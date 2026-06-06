'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '@/lib/use-voice';
import { nicheConfigs } from '@/lib/sales-scripts';
import { getScripts, saveCall } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Bot, User,
  Clock, Target, ArrowRight, Headphones, BarChart3, Languages, Zap
} from 'lucide-react';
import type { Niche, SalesScript, Call, CallTranscript } from '@/types';

const PHASE_META: Record<string, { label: string; color: string }> = {
  begruessung: { label: 'Begruessung', color: '#3b82f6' },
  bedarfsanalyse: { label: 'Bedarfsanalyse', color: '#8b5cf6' },
  praesentation: { label: 'Praesentation', color: '#10b981' },
  einwandbehandlung: { label: 'Einwaende', color: '#f59e0b' },
  abschluss: { label: 'Abschluss', color: '#ef4444' },
  verabschiedung: { label: 'Verabschiedung', color: '#78716c' },
};

interface Msg {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
  phase?: string;
}

const VoiceBars = () => (
  <div className="flex items-end gap-[3px] h-8">
    {Array.from({ length: 14 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-[3px] rounded-full bg-gradient-to-t from-orange-500 to-orange-400 origin-bottom"
        animate={{ height: ['4px', `${12 + Math.random() * 18}px`, '4px'] }}
        transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

const TypingIndicator = () => (
  <div className="flex gap-2.5 justify-start">
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
      <Bot className="w-3 h-3 text-white" />
    </div>
    <div className="bg-white rounded-2xl rounded-tl-lg px-4 py-2.5 shadow-sm border border-stone-100">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="w-1.5 h-1.5 bg-stone-300 rounded-full"
            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  </div>
);

// Mode badge component
const ModeBadge = ({ mode }: { mode: string }) => {
  const config = {
    'speech-engine': { label: 'Speech Engine', color: 'bg-emerald-500', icon: Zap },
    'tts': { label: 'ElevenLabs', color: 'bg-orange-500', icon: Headphones },
    'browser': { label: 'Browser', color: 'bg-stone-400', icon: Volume2 },
  }[mode] || { label: 'Browser', color: 'bg-stone-400', icon: Volume2 };
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5 text-[9px] text-stone-400">
      <div className={cn('w-1.5 h-1.5 rounded-full', config.color)} />
      <Icon className="w-2.5 h-2.5" />
      <span>{config.label}</span>
    </div>
  );
};

export default function SimulatorPage() {
  const voice = useVoice();
  const [selectedNiche, setSelectedNiche] = useState<Niche>('waermepumpe');
  const [callActive, setCallActive] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentPhase, setCurrentPhase] = useState('begruessung');
  const [isTyping, setIsTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeScript, setActiveScript] = useState<SalesScript | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);
  const callStartRef = useRef<Date | null>(null);

  useEffect(() => {
    const scripts = getScripts();
    setActiveScript(scripts.find((s) => s.niche === selectedNiche && s.aktiv) || scripts[0] || null);
  }, [selectedNiche]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    if (callActive) { timerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000); }
    else if (timerRef.current) { clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive]);

  const endAndSaveCall = useCallback((msgs: Msg[], phase: string, duration: number) => {
    if (!callStartRef.current || msgs.length === 0) return;
    const callId = `call-${Date.now()}`;
    const transcripts: CallTranscript[] = msgs.map((m, i) => ({
      id: `t-${callId}-${i}`, callId,
      abschnitt: (m.phase as CallTranscript['abschnitt']) || 'begruessung',
      sprecher: m.role === 'agent' ? 'agent' : 'kunde',
      text: m.content, zeitstempel: m.timestamp.toISOString(),
    }));
    saveCall({ id: callId, leadId: 'live-simulation', leadName: 'Live Simulation', status: 'abgeschlossen', dauer: duration, gestartetAm: callStartRef.current.toISOString(), beendetAm: new Date().toISOString(), skriptId: activeScript?.id || '', stimmung: 'neutral', transkript: transcripts, zusammenfassung: `${msgs.length} Nachrichten, ${Math.floor(duration / 60)} Min.` } as Call);
  }, [activeScript]);

  const processAgentResponse = useCallback(async (userText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true; setIsTyping(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp.toISOString() })), niche: selectedNiche, scriptId: activeScript?.id, currentPhase }),
      });
      const data = await res.json();
      if (data.message) {
        setCurrentPhase(data.phase);
        setMessages((prev) => [...prev, { id: `msg-${Date.now()}-a`, role: 'agent', content: data.message, timestamp: new Date(), phase: data.phase }]);
        setSuggestions(data.suggestions || []); setIsTyping(false);
        voice.speak(data.message, () => { setTimeout(() => { if (callActive) voice.startListening(); }, 400); });
      }
    } catch { setIsTyping(false); } finally { isProcessingRef.current = false; }
  }, [messages, selectedNiche, activeScript, currentPhase, callActive, voice]);

  useEffect(() => {
    if (!callActive || !voice.isListening || !voice.currentTranscript?.trim()) return;
    const text = voice.currentTranscript.trim();
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: new Date() }]);
    setTimeout(() => processAgentResponse(text), 200);
  }, [voice.isListening, voice.currentTranscript]);

  const startCall = async () => {
    setCallActive(true); setMessages([]); setCurrentPhase('begruessung'); setCallDuration(0); callStartRef.current = new Date(); setIsTyping(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [], niche: selectedNiche, scriptId: activeScript?.id, currentPhase: 'begruessung' }) });
      const data = await res.json();
      if (data.message) {
        setCurrentPhase(data.phase);
        setMessages([{ id: `msg-${Date.now()}-a`, role: 'agent', content: data.message, timestamp: new Date(), phase: 'begruessung' }]);
        setSuggestions(data.suggestions || []); setIsTyping(false);
        voice.speak(data.message, () => { setTimeout(() => { if (callActive) voice.startListening(); }, 400); });
      }
    } catch { setIsTyping(false); }
  };

  const endCall = () => {
    voice.stopSpeaking(); voice.stopListening(); endAndSaveCall(messages, currentPhase, callDuration);
    setCallActive(false); isProcessingRef.current = false;
  };

  const handleSuggestion = (text: string) => {
    if (!callActive) return; voice.stopListening();
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: new Date() }]);
    setTimeout(() => processAgentResponse(text), 200);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <main className="overflow-x-hidden w-full max-w-full">
      {/* ASYMMETRIC HERO */}
      <section className="relative min-h-[100dvh] flex flex-col lg:flex-row items-stretch">
        {/* Left: Content */}
        <div className="flex-1 flex flex-col justify-center px-5 py-10 md:px-12 lg:px-16 lg:py-20 lg:max-w-[52%]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-orange-500/60" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">Sprachverkaufsagent</span>
            </div>

            <h1 className="text-[clamp(1.85rem,4.5vw,3.5rem)] font-semibold tracking-tight leading-[1.1] text-stone-900 max-w-lg mb-4">
              Der Agent verkauft.
              <span className="block text-stone-400 mt-1">Sie spielen den Kunden.</span>
            </h1>

            <p className="text-stone-500 text-sm leading-relaxed max-w-md mb-7">
              Waehlen Sie eine Nische, starten Sie das Gespraech und sprechen Sie mit dem KI-Verkaeufer.
              Alles laeuft im Browser — keine externe Software noetig.
            </p>

            {/* Niche selector */}
            {!callActive && (
              <motion.div className="flex flex-wrap gap-1.5 mb-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                {nicheConfigs.slice(0, 8).map((niche) => (
                  <button key={niche.id} onClick={() => setSelectedNiche(niche.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 active:scale-[0.97]',
                      selectedNiche === niche.id
                        ? 'text-white shadow-lg'
                        : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
                    )}
                    style={selectedNiche === niche.id ? { backgroundColor: niche.farbcode, boxShadow: `0 8px 20px -6px ${niche.farbcode}35` } : {}}>
                    {niche.name}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Feature details */}
            {!callActive && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-stone-400 text-xs">
                {[
                  { icon: voice.mode === 'speech-engine' ? Zap : Headphones, text: voice.mode === 'speech-engine' ? 'Speech Engine' : 'ElevenLabs Stimme' },
                  { icon: Languages, text: 'Deutsch (de-DE)' },
                  { icon: BarChart3, text: '8 Nischen' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <f.icon className="w-3.5 h-3.5" />{f.text}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Call interface */}
        <div className="flex-1 flex items-center justify-center px-4 pb-6 lg:pb-0 lg:pr-10 xl:pr-16">
          <motion.div className="w-full max-w-[420px]" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            <div className="bg-white rounded-[1.5rem] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.07)] border border-stone-200/60 overflow-hidden">
              {/* Status bar */}
              <div className={cn('px-4 py-3 flex items-center justify-between transition-all duration-500', callActive ? 'bg-stone-900 text-white' : 'bg-stone-50/80')}>
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center transition-colors', callActive ? 'bg-emerald-500/20' : 'bg-stone-200')}>
                    <Bot className={cn('w-4 h-4', callActive ? 'text-emerald-400' : 'text-stone-500')} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight truncate max-w-[180px]">{activeScript?.name || 'HeizPro KI'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] opacity-50 mt-0.5">
                      {callActive ? (
                        <>
                          <motion.div className={cn('w-1.5 h-1.5 rounded-full', voice.isSpeaking ? 'bg-orange-400' : voice.isListening ? 'bg-blue-400' : 'bg-emerald-400')}
                            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                          <span>{voice.isSpeaking ? 'Spricht...' : voice.isListening ? 'Hoert zu' : 'Aktiv'}</span>
                          <Clock className="w-2.5 h-2.5" />{fmt(callDuration)}
                        </>
                      ) : (
                        <ModeBadge mode={voice.mode} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Phase indicators */}
                {callActive && (
                  <div className="flex items-center gap-0.5">
                    {Object.entries(PHASE_META).map(([key, val]) => (
                      <div key={key} className="sm:hidden w-1.5 rounded-full transition-all duration-500"
                        style={{ height: currentPhase === key ? '16px' : '6px', backgroundColor: val.color, opacity: currentPhase === key ? 1 : 0.2 }} />
                    ))}
                    {Object.entries(PHASE_META).map(([key, val]) => (
                      <div key={key} className={cn('hidden sm:block px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider transition-all', currentPhase === key ? 'text-white' : 'text-white/20')}
                        style={currentPhase === key ? { backgroundColor: val.color } : {}}>{val.label.slice(0, 4)}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages area */}
              <div className="h-[280px] sm:h-[340px] lg:h-[400px] overflow-y-auto p-3.5 space-y-2 bg-stone-50/20">
                {!callActive && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full px-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3 shadow-lg shadow-orange-500/15">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-stone-400 text-[11px] text-center max-w-[200px] leading-relaxed mb-2">
                      KI-Verkaeufer spricht. Sie antworten als Kunde.
                    </p>
                    {voice.mode === 'speech-engine' && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-medium">
                        <Zap className="w-2.5 h-2.5" />
                        Echtzeit-Sprachmodus aktiv
                      </div>
                    )}
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <motion.div key={msg.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      className={cn('flex gap-2', msg.role === 'agent' ? 'justify-start' : 'justify-end')}>
                      {msg.role === 'agent' && (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        'max-w-[84%] rounded-xl px-3 py-2 text-[12px] leading-relaxed',
                        msg.role === 'agent' ? 'bg-white text-stone-800 shadow-sm border border-stone-100/80 rounded-tl-md' : 'bg-stone-900 text-white rounded-tr-md'
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn('text-[8px] mt-0.5', msg.role === 'agent' ? 'text-stone-300' : 'text-stone-500')}>
                          {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-2.5 h-2.5 text-stone-500" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && <TypingIndicator />}

                {voice.isListening && callActive && (
                  <motion.div className="flex items-center justify-center py-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-medium">
                      <Mic className="w-2.5 h-2.5 animate-pulse" />
                      {voice.currentTranscript || 'Hoert zu...'}
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {callActive && suggestions.length > 0 && !voice.isSpeaking && !isTyping && (
                  <motion.div className="px-3.5 py-2 border-t border-stone-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.slice(0, 3).map((s, i) => (
                        <button key={i} onClick={() => handleSuggestion(s)}
                          className="text-[10px] bg-white border border-stone-200 text-stone-500 px-2 py-1 rounded-md hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors active:scale-[0.97]">
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="px-3.5 py-3 border-t border-stone-100 flex items-center justify-center gap-3">
                {!callActive ? (
                  <motion.button onClick={startCall} disabled={!voice.isSupported} whileTap={{ scale: 0.97 }}
                    className={cn('flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      voice.isSupported ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-md shadow-stone-900/10' : 'bg-stone-200 text-stone-400 cursor-not-allowed')}>
                    <Phone className="w-4 h-4" />
                    <span className="sm:hidden">Starten</span>
                    <span className="hidden sm:inline">Gespraech starten</span>
                    <ArrowRight className="w-3 h-3 opacity-40" />
                  </motion.button>
                ) : (
                  <>
                    <motion.button onClick={() => voice.isListening ? voice.stopListening() : voice.startListening()} disabled={voice.isSpeaking} whileTap={{ scale: 0.9 }}
                      className={cn('w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        voice.isListening ? 'bg-blue-500 text-white shadow-lg' : voice.isSpeaking ? 'bg-stone-100 text-stone-300' : 'bg-stone-100 text-stone-500')}>
                      {voice.isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </motion.button>
                    <motion.button onClick={endCall} whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
                      <PhoneOff className="w-5 h-5" />
                    </motion.button>
                    <motion.button onClick={() => voice.stopSpeaking()} whileTap={{ scale: 0.9 }}
                      className={cn('w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        voice.isSpeaking ? 'bg-orange-500 text-white shadow-lg' : 'bg-stone-100 text-stone-400')}>
                      {voice.isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENTO */}
      {!callActive && (
        <section className="px-5 lg:px-12 pb-12">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-2.5" style={{ gridAutoFlow: 'dense' }}>
            <div className="md:col-span-3 md:row-span-2 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[260px] md:min-h-[320px]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-medium mb-2">Echtzeit-Sprachinteraktion</p>
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight mb-2">
                  Der Agent spricht.<br />Sie antworten.
                </h3>
                <p className="text-stone-500 text-xs md:text-sm leading-relaxed max-w-sm">
                  Sprachsynthese und Spracherkennung laufen direkt im Browser. Der KI-Verkaeufer fuehrt das Gespraech durch alle Phasen.
                </p>
              </div>
              <VoiceBars />
            </div>
            <div className="md:col-span-2 bg-orange-50 border border-orange-100 rounded-2xl p-5 md:p-6 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-orange-600 font-medium">Nischen</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-orange-700">8</p>
              <p className="text-xs text-orange-600/60 mt-1">Fachbereiche — Waermepumpe bis Sanitaer</p>
            </div>
            <div className="md:col-span-2 bg-white border border-stone-200/80 rounded-2xl p-5 md:p-6 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-medium">Sprache</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-stone-900">DE</p>
              <p className="text-xs text-stone-400 mt-1">Professionelle Sprachausgabe auf Deutsch</p>
            </div>
          </div>
        </section>
      )}

      {!voice.isSupported && (
        <div className="px-5 pb-6">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 text-center">
            Ihr Browser unterstuetzt die Web Speech API nicht. Bitte nutzen Sie Google Chrome.
          </div>
        </div>
      )}
    </main>
  );
}
