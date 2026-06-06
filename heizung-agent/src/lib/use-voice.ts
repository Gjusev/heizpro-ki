'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// Voice Hook – Multi-Mode Voice Interface
// Mode 1: Speech Engine (ElevenLabs real-time, full-duplex)
// Mode 2: ElevenLabs TTS (server proxy, browser STT)
// Mode 3: Browser fallback (SpeechSynthesis + Web Speech API)
// ============================================

type VoiceMode = 'speech-engine' | 'tts' | 'browser';

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  currentTranscript: string;
  error: string | null;
  mode: VoiceMode;
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

export function useVoice(): UseVoiceReturn {
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
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'de-DE';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const results = event.results;
      const transcript = results[results.length - 1][0].transcript;
      setState((prev) => ({ ...prev, currentTranscript: transcript }));
      if (results[results.length - 1].isFinal) {
        setState((prev) => ({ ...prev, isListening: false }));
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        setState((prev) => ({ ...prev, error: `Spracherkennung: ${event.error}`, isListening: false }));
      } else {
        setState((prev) => ({ ...prev, isListening: false }));
      }
    };

    recognition.onend = () => setState((prev) => ({ ...prev, isListening: false }));
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
      recognition.abort();
      window.speechSynthesis.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setState((prev) => ({ ...prev, currentTranscript: '', error: null }));
    try {
      recognitionRef.current.start();
      setState((prev) => ({ ...prev, isListening: true }));
    } catch {
      recognitionRef.current.stop();
      setTimeout(() => {
        try { recognitionRef.current.start(); setState((prev) => ({ ...prev, isListening: true })); } catch {}
      }, 100);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
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
        audio.onplay = () => setState((prev) => ({ ...prev, isSpeaking: true }));
        audio.onended = () => { setState((prev) => ({ ...prev, isSpeaking: false })); URL.revokeObjectURL(url); onEnd?.(); };
        audio.onerror = () => { setState((prev) => ({ ...prev, isSpeaking: false })); URL.revokeObjectURL(url); onEnd?.(); };
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

    utterance.onstart = () => setState((prev) => ({ ...prev, isSpeaking: true }));
    utterance.onend = () => { setState((prev) => ({ ...prev, isSpeaking: false })); onEnd?.(); };
    utterance.onerror = () => { setState((prev) => ({ ...prev, isSpeaking: false })); onEnd?.(); };
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
