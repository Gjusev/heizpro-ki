// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useVoice } from '@/lib/use-voice';

/**
 * Regression tests for end-of-turn detection in continuous mode.
 *
 * The recognizer runs with continuous=true so the user can pause between clauses.
 * The hook must:
 *  - NOT emit while speech is still arriving (within the silence debounce),
 *  - accumulate multiple clauses into ONE turn,
 *  - emit the full transcript only after the user goes silent for TURN_SILENCE_MS,
 *  - never emit an empty/whitespace turn.
 *
 * (The browser mic/STT cannot be driven headlessly, so SpeechRecognition is mocked.)
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

// Build a SpeechRecognitionResultList-like event from ordered entries.
function evt(...items: { t: string; final: boolean }[]) {
  const results = items.map((it) => {
    const r = [{ transcript: it.t }, { transcript: it.t }] as any;
    r.isFinal = it.final;
    return r;
  });
  return { results };
}

// TURN_SILENCE_MS is 800 in the hook; wait past it to let the debounce fire.
const SILENCE = 1100;

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
async function flush() { await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); }
async function wait(ms: number) { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); }

describe('useVoice end-of-turn detection (continuous + silence debounce)', () => {
  it('does NOT emit while speech is still arriving (within the debounce window)', async () => {
    const spy = vi.fn();
    mountWith(spy);
    await flush();

    act(() => instances[0].onresult(evt({ t: 'ich', final: false })));
    act(() => instances[0].onresult(evt({ t: 'ich habe eine', final: false })));
    act(() => instances[0].onresult(evt({ t: 'ich habe eine alte gasheizung', final: false })));

    expect(spy).not.toHaveBeenCalled();
  });

  it('accumulates multiple clauses and emits once after the user goes silent', async () => {
    const spy = vi.fn();
    mountWith(spy);
    await flush();

    // clause A finalizes, then clause B is spoken (interim) before the silence
    act(() => instances[0].onresult(evt({ t: 'ich habe eine gasheizung', final: true })));
    act(() => instances[0].onresult(
      evt({ t: 'ich habe eine gasheizung', final: true }, { t: ' und sie ist alt', final: false }),
    ));
    await wait(SILENCE);

    expect(spy).toHaveBeenCalledTimes(1);
    const out = spy.mock.calls[0][0];
    expect(out).toMatch(/gasheizung/);
    expect(out).toMatch(/alt/);
  });

  it('does NOT emit an empty / whitespace-only turn', async () => {
    const spy = vi.fn();
    mountWith(spy);
    await flush();

    act(() => instances[0].onresult(evt({ t: '   ', final: true })));
    await wait(SILENCE);

    expect(spy).not.toHaveBeenCalled();
  });
});
