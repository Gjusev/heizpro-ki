'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// Voice Hook – ElevenLabs TTS + Web Speech Recognition
// Sprachausgabe: ElevenLabs API (Production) / Browser Fallback
// Spracherkennung: Web Speech API (Browser, kostenlos)
// ============================================

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  currentTranscript: string;
  error: string | null;
  ttsMode: 'elevenlabs' | 'browser';
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
    ttsMode: 'browser',
  });

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasSynth = 'speechSynthesis' in window;
    const supported = !!SpeechRecognition && hasSynth;

    setState((prev) => ({ ...prev, isSupported: supported }));

    if (!supported) {
      setState((prev) => ({ ...prev, error: 'Ihr Browser unterstuetzt keine Sprachfunktionen. Bitte nutzen Sie Chrome.' }));
      return;
    }

    // Setup Speech Recognition (user mic input)
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

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;

    // Setup audio element for ElevenLabs playback
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // Setup browser synthesis as fallback
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Check ElevenLabs availability
  useEffect(() => {
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '__check__' }),
    })
      .then((res) => res.headers.get('Content-Type'))
      .then((ct) => {
        if (ct === 'audio/mpeg') {
          setState((prev) => ({ ...prev, ttsMode: 'elevenlabs' }));
        }
      })
      .catch(() => {});
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
        try {
          recognitionRef.current.start();
          setState((prev) => ({ ...prev, isListening: true }));
        } catch {}
      }, 100);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setState((prev) => ({ ...prev, isListening: false }));
  }, []);

  // ElevenLabs TTS via API
  const speakElevenLabs = useCallback(async (text: string, onEnd?: () => void) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

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
        audio.onended = () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
          URL.revokeObjectURL(url);
          onEnd?.();
        };
        audio.onerror = () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
          URL.revokeObjectURL(url);
          onEnd?.();
        };
        await audio.play();
      } else {
        // Fallback to browser TTS
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

    const cleanText = text
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\*/g, '')
      .replace(/\n/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

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
    if (state.ttsMode === 'elevenlabs') {
      speakElevenLabs(text, onEnd);
    } else {
      speakBrowser(text, onEnd);
    }
  }, [state.ttsMode, speakElevenLabs, speakBrowser]);

  const stopSpeaking = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop browser TTS
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
