// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useVoice } from '@/lib/use-voice';

/**
 * Regression test for the turn-taking bug ("lanza el mensaje antes de acabar de
 * hablar"). The agent must react to a FINAL, complete utterance only — never to
 * interim/partial speech results. Before the fix, page.tsx reacted to every
 * interim `currentTranscript` change and launched the response on the first
 * fragment ("ich", "ja" ...) before the user had finished speaking.
 *
 * The browser mic/STT cannot be driven headlessly, so we mock SpeechRecognition
 * and assert the hook only emits a final transcript on isFinal results.
 */

let instances: any[] = [];
let container: HTMLDivElement | null = null;
let root: any = null;

class MockRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 1;
  onresult: any = null;
  onerror: any = null;
  onend: any = null;
  constructor() { instances.push(this); }
  start() {}
  stop() {}
  abort() {}
}

function makeResultEvent(transcript: string, isFinal: boolean) {
  const result = [{ transcript }, { transcript }] as any;
  result.isFinal = isFinal;
  return { results: [result] };
}

beforeEach(() => {
  instances = [];
  (window as any).SpeechRecognition = MockRecognition;
  (window as any).webkitSpeechRecognition = MockRecognition;
  (window as any).speechSynthesis = {
    getVoices: () => [],
    cancel() {},
    speak() {},
    onvoiceschanged: null,
  };
  (globalThis as any).Audio = class { play() { return Promise.resolve(); } pause() {} };
  (globalThis as any).fetch = async () => ({ json: async () => ({ mode: 'browser' }) });

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => { root.unmount(); });
  if (container && container.parentNode) container.parentNode.removeChild(container);
});

function mountWith(spy: (t: string) => void) {
  function Harness() { useVoice({ onFinalTranscript: spy }); return null; }
  act(() => { root.render(React.createElement(Harness)); });
}

async function flushMountEffects() {
  // let the mount-time /api/speech-status fetch chain resolve
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}

describe('useVoice turn-taking — onFinalTranscript fires on FINAL results only', () => {
  it('does NOT fire on interim/partial results', async () => {
    const spy = vi.fn();
    mountWith(spy);
    await flushMountEffects();

    // Several interim fragments as the user is still speaking.
    act(() => { instances[0].onresult(makeResultEvent('ich', false)); });
    act(() => { instances[0].onresult(makeResultEvent('ich habe eine', false)); });
    act(() => { instances[0].onresult(makeResultEvent('ich habe eine alte gasheizung', false)); });

    expect(spy).not.toHaveBeenCalled();
  });

  it('fires exactly once with the full text on the final result', async () => {
    const spy = vi.fn();
    mountWith(spy);
    await flushMountEffects();

    act(() => { instances[0].onresult(makeResultEvent('ich', false)); });
    act(() => { instances[0].onresult(makeResultEvent('ich habe eine alte gasheizung', false)); });
    act(() => { instances[0].onresult(makeResultEvent('ich habe eine alte gasheizung', true)); });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('ich habe eine alte gasheizung');
  });

  it('does NOT fire on a final result that is empty/whitespace', async () => {
    const spy = vi.fn();
    mountWith(spy);
    await flushMountEffects();

    act(() => { instances[0].onresult(makeResultEvent('   ', true)); });
    expect(spy).not.toHaveBeenCalled();
  });
});
