'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// Voice Hook – Multi-Mode Voice Interface
// Mode 1: Speech Engine (ElevenLabs real-time, full-duplex)
// Mode 2: ElevenLabs TTS (server proxy, browser STT)
// Mode 3: Browser fallback (SpeechSynthesis + Web Speech API)
// ============================================

type VoiceMode = 'speech-engine' | 'tts' | 'browser';

// Silence gap that closes a user turn. With continuous recognition the user can
// pause between clauses; only after this much silence do we treat the turn as done.
const TURN_SILENCE_MS = 800;

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  currentTranscript: string;
  error: string | null;
  mode: VoiceMode;
}

interface UseVoiceOptions {
  /** Fired once per user turn with the COMPLETE transcript, after the user goes
   *  silent for TURN_SILENCE_MS. Drives turn-taking — it does not fire on every
   *  interim/partial chunk, so the caller never reacts to a half-spoken sentence
   *  and people can pause between clauses without being interrupted. */
  onFinalTranscript?: (text: string) => void;
}

interface UseVoiceReturn extends VoiceState {
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  availableVoices: SpeechSynthesisVoice[];
  germanVoices: SpeechSynthesisVoice[];
}

export function useVoice(options?: UseVoiceOptions): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isSupported: false,
    currentTranscript: '',
    error: null,
    mode: 'browser',
  });

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isSpeakingRef = useRef(false);

  // Always-current final-transcript handler. The SpeechRecognition instance and its
  // onresult callback are created once on mount ([] effect below), so we keep the
  // latest handler in a ref and invoke it through the ref — otherwise onresult would
  // be stuck on the render-0 closure and never see updated component state.
  const onFinalRef = useRef(options?.onFinalTranscript);
  useEffect(() => { onFinalRef.current = options?.onFinalTranscript; });

  // End-of-turn accumulation state. Kept in refs because the SpeechRecognition
  // instance and its callbacks are created once on mount.
  const committedRef = useRef('');        // finalized phrases accumulated this turn
  const processedRef = useRef(0);         // result index already folded into committed
  const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // silence debounce
  const emittingRef = useRef(false);      // guard: emit at most once per turn

  // Detect available voice mode on mount
  useEffect(() => {
    fetch('/api/speech-status')
      .then((res) => res.json())
      .then((data) => {
        const mode: VoiceMode = data.mode || 'browser';
        setState((prev) => ({ ...prev, mode }));
      })
      .catch(() => {
        setState((prev) => ({ ...prev, mode: 'browser' }));
      });
  }, []);

  // Setup browser recognition + synthesis (used in TTS and browser modes)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasSynth = 'speechSynthesis' in window;
    const supported = !!SpeechRecognition && hasSynth;

    setState((prev) => ({ ...prev, isSupported: supported }));

    if (!supported) {
      setState((prev) => ({ ...prev, error: 'Ihr Browser unterstuetzt keine Sprachfunktionen. Bitte nutzen Sie Chrome.' }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;   // keep listening across pauses so the user can pause between clauses
    recognition.interimResults = true;
    recognition.lang = 'de-DE';
    recognition.maxAlternatives = 1;

    // Close out the current turn: stop listening and emit the accumulated
    // transcript exactly once. (startListening resets the buffers for next turn.)
    const finishTurn = (text: string) => {
      if (emittingRef.current) return;
      emittingRef.current = true;
      if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
      setState((prev) => ({ ...prev, isListening: false }));
      try { recognitionRef.current?.stop(); } catch {}
      const finalText = text.trim();
      if (finalText) onFinalRef.current?.(finalText);
    };

    recognition.onresult = (event: any) => {
      if (emittingRef.current) return; // turn already finalized; ignore trailing results
      const results = event.results;
      // Fold newly-finalized phrases into the committed buffer; keep the current
      // interim phrase separate for live display.
      let interim = '';
      for (let i = processedRef.current; i < results.length; i++) {
        if (results[i].isFinal) {
          committedRef.current += results[i][0].transcript;
          processedRef.current = i + 1;
        } else {
          interim += results[i][0].transcript;
        }
      }
      setState((prev) => ({ ...prev, currentTranscript: (committedRef.current + interim).trim() }));

      // End-of-turn debounce: restart the silence timer on every speech chunk.
      // When nothing new arrives for TURN_SILENCE_MS, the user has finished talking.
      if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
      turnTimerRef.current = setTimeout(() => {
        turnTimerRef.current = null;
        finishTurn(committedRef.current + interim);
      }, TURN_SILENCE_MS);
    };

    recognition.onerror = (event: any) => {
      if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
      if (event.error !== 'no-speech') {
        setState((prev) => ({ ...prev, error: `Spracherkennung: ${event.error}`, isListening: false }));
      } else {
        setState((prev) => ({ ...prev, isListening: false }));
      }
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
      // Recognition ended on its own (Chrome auto-stop / no-speech). If we captured
      // speech but the debounce hadn't fired yet, flush it so the turn isn't lost.
      if (!emittingRef.current && committedRef.current.trim()) {
        if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
        finishTurn(committedRef.current);
      }
    };
    recognitionRef.current = recognition;

    if (!audioRef.current) audioRef.current = new Audio();
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      const german = allVoices.filter((v) => v.lang.startsWith('de'));
      if (german.length > 0) {
        const premium = german.find((v) => v.name.includes('Google') || v.name.includes('Premium'));
        setSelectedVoice(premium || german[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
      recognition.abort();
      window.speechSynthesis.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isSpeakingRef.current) return; // Block: never open mic while TTS is active (ref avoids stale closure)
    // Reset per-turn accumulation / debounce state.
    committedRef.current = '';
    processedRef.current = 0;
    emittingRef.current = false;
    if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
    try { recognitionRef.current.stop(); } catch {} // Clear stale session
    setState((prev) => ({ ...prev, currentTranscript: '', error: null }));
    // Brief pause to let the audio hardware pipeline fully quiesce
    setTimeout(() => {
      if (!recognitionRef.current) return;
      try {
        recognitionRef.current.start();
        setState((prev) => ({ ...prev, isListening: true }));
      } catch {
        // Already started or busy — ignore
      }
    }, 150);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    // A manual stop cancels the in-flight turn: suppress the onend auto-flush and
    // tear down the debounce timer so nothing is emitted.
    emittingRef.current = true;
    if (turnTimerRef.current) { clearTimeout(turnTimerRef.current); turnTimerRef.current = null; }
    try { recognitionRef.current.stop(); } catch {}
    setState((prev) => ({ ...prev, isListening: false }));
  }, []);

  // ElevenLabs TTS via API proxy
  const speakElevenLabs = useCallback(async (text: string, onEnd?: () => void) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.pause();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const contentType = res.headers.get('Content-Type') || '';
      if (contentType === 'audio/mpeg') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audio.src = url;
        audio.onplay = () => { isSpeakingRef.current = true; setState((prev) => ({ ...prev, isSpeaking: true })); };
        audio.onended = () => { isSpeakingRef.current = false; setState((prev) => ({ ...prev, isSpeaking: false })); URL.revokeObjectURL(url); onEnd?.(); };
        audio.onerror = () => { isSpeakingRef.current = false; setState((prev) => ({ ...prev, isSpeaking: false })); URL.revokeObjectURL(url); onEnd?.(); };
        await audio.play();
      } else {
        speakBrowser(text, onEnd);
      }
    } catch {
      speakBrowser(text, onEnd);
    }
  }, []);

  // Browser TTS fallback
  const speakBrowser = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) { onEnd?.(); return; }
    synthRef.current.cancel();

    const cleanText = text.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/\*/g, '').replace(/\n/g, '. ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => { isSpeakingRef.current = true; setState((prev) => ({ ...prev, isSpeaking: true })); };
    utterance.onend = () => { isSpeakingRef.current = false; setState((prev) => ({ ...prev, isSpeaking: false })); onEnd?.(); };
    utterance.onerror = () => { isSpeakingRef.current = false; setState((prev) => ({ ...prev, isSpeaking: false })); onEnd?.(); };
    synthRef.current.speak(utterance);
  }, [selectedVoice]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (state.mode === 'speech-engine') {
      // In Speech Engine mode, TTS is handled by ElevenLabs directly.
      // The browser hook doesn't speak — the SDK does.
      onEnd?.();
      return;
    }
    if (state.mode === 'tts') {
      speakElevenLabs(text, onEnd);
    } else {
      speakBrowser(text, onEnd);
    }
  }, [state.mode, speakElevenLabs, speakBrowser]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (synthRef.current) synthRef.current.cancel();
    isSpeakingRef.current = false;
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  const germanVoices = voices.filter((v) => v.lang.startsWith('de'));

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setVoice: setSelectedVoice,
    availableVoices: voices,
    germanVoices,
  };
}
