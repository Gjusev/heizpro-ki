'use client';

import { useState, useEffect } from 'react';
import { getAgent, saveAgent } from '@/lib/store';
import { getScripts } from '@/lib/store';
import { nicheConfigs } from '@/lib/sales-scripts';
import { cn } from '@/lib/utils';
import { Bot, Settings, Save, Check, Volume2, Clock, Phone, FileText } from 'lucide-react';
import type { AgentConfig, AgentPersoenlichkeit } from '@/types';

export default function AgentsPage() {
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [scripts, setScripts] = useState<{ id: string; name: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAgent(getAgent());
    setScripts(getScripts().map((s) => ({ id: s.id, name: s.name })));
  }, []);

  const handleSave = () => {
    if (!agent) return;
    saveAgent(agent);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleScript = (scriptId: string) => {
    if (!agent) return;
    const has = agent.skriptIds.includes(scriptId);
    setAgent({
      ...agent,
      skriptIds: has ? agent.skriptIds.filter((s) => s !== scriptId) : [...agent.skriptIds, scriptId],
    });
  };

  const toggleNiche = (niche: string) => {
    if (!agent) return;
    const has = agent.niches.includes(niche as any);
    setAgent({
      ...agent,
      niches: has ? agent.niches.filter((n) => n !== niche) : [...agent.niches, niche as any],
    });
  };

  if (!mounted || !agent) return null;

  return (
    <main className="overflow-x-hidden w-full max-w-full px-6 lg:px-10 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">Konfiguration</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">Agent</h1>
          <p className="text-stone-500 text-sm mt-2">Konfigurieren Sie den KI-Verkäufer — Stimme, Skripte und Arbeitszeiten</p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            <Check className="w-4 h-4" /> Gespeichert
          </div>
        )}

        {/* Agent Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
          {/* Agent header */}
          <div className="bg-stone-900 text-white px-6 py-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <input value={agent.name}
                  onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                  className="bg-transparent text-xl font-semibold border-b border-white/20 focus:border-orange-400 outline-none pb-0.5 w-auto" />
                <button onClick={() => setAgent({ ...agent, aktiv: !agent.aktiv })}
                  className={cn(
                    'text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full transition-colors',
                    agent.aktiv ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                  )}>
                  {agent.aktiv ? 'Aktiv' : 'Pausiert'}
                </button>
              </div>
              <textarea value={agent.beschreibung}
                onChange={(e) => setAgent({ ...agent, beschreibung: e.target.value })}
                rows={2}
                className="w-full bg-transparent text-stone-400 text-sm mt-1 resize-none border-none outline-none placeholder:text-stone-600" />
            </div>
          </div>

          {/* Config sections */}
          <div className="p-6 space-y-8">
            {/* Personality & Voice */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5" /> Persönlichkeit & Stimme
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Persönlichkeit</label>
                  <select value={agent.persoenlichkeit}
                    onChange={(e) => setAgent({ ...agent, persoenlichkeit: e.target.value as AgentPersoenlichkeit })}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
                    <option value="beratend">Beratend</option>
                    <option value="vertrauensvoll">Vertrauensvoll</option>
                    <option value="energisch">Energisch</option>
                    <option value="ruhig">Ruhig</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Geschwindigkeit</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0.5" max="2" step="0.1" value={agent.geschwindigkeit}
                      onChange={(e) => setAgent({ ...agent, geschwindigkeit: parseFloat(e.target.value) })}
                      className="flex-1 accent-orange-500" />
                    <span className="text-sm font-medium text-stone-600 w-10 text-center">{agent.geschwindigkeit}x</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Kreativität</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="1" step="0.1" value={agent.temperatur}
                      onChange={(e) => setAgent({ ...agent, temperatur: parseFloat(e.target.value) })}
                      className="flex-1 accent-orange-500" />
                    <span className="text-sm font-medium text-stone-600 w-10 text-center">{agent.temperatur}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Arbeitszeiten
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="time" value={agent.arbeitszeiten.start}
                    onChange={(e) => setAgent({ ...agent, arbeitszeiten: { ...agent.arbeitszeiten, start: e.target.value } })}
                    className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  <span className="text-stone-400">bis</span>
                  <input type="time" value={agent.arbeitszeiten.ende}
                    onChange={(e) => setAgent({ ...agent, arbeitszeiten: { ...agent.arbeitszeiten, ende: e.target.value } })}
                    className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
                <div className="flex gap-1.5">
                  {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, i) => (
                    <button key={i} onClick={() => {
                      const days = agent.arbeitszeiten.wochentage.includes(i)
                        ? agent.arbeitszeiten.wochentage.filter((d) => d !== i)
                        : [...agent.arbeitszeiten.wochentage, i];
                      setAgent({ ...agent, arbeitszeiten: { ...agent.arbeitszeiten, wochentage: days } });
                    }}
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors',
                        agent.arbeitszeiten.wochentage.includes(i) ? 'bg-orange-100 text-orange-700' : 'bg-stone-50 text-stone-300'
                      )}>
                      {day}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-stone-500">Max. Anrufe/Tag:</label>
                  <input type="number" value={agent.maxAnrufeProTag}
                    onChange={(e) => setAgent({ ...agent, maxAnrufeProTag: parseInt(e.target.value) || 50 })}
                    className="w-20 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                </div>
              </div>
            </div>

            {/* Script Assignment */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Zugewiesene Skripte
              </h3>
              <div className="space-y-1.5">
                {scripts.map((script) => {
                  const assigned = agent.skriptIds.includes(script.id);
                  return (
                    <button key={script.id} onClick={() => toggleScript(script.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left',
                        assigned ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-stone-50 border border-stone-100 text-stone-500 hover:bg-stone-100'
                      )}>
                      <div className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                        assigned ? 'border-orange-500 bg-orange-500' : 'border-stone-300'
                      )}>
                        {assigned && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Phone className="w-4 h-4 opacity-40" />
                      {script.name}
                    </button>
                  );
                })}
                {scripts.length === 0 && <p className="text-sm text-stone-400">Keine Skripte vorhanden. Erstellen Sie zuerst ein Skript.</p>}
              </div>
            </div>

            {/* Niche Assignment */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Aktive Nischen</h3>
              <div className="flex flex-wrap gap-2">
                {nicheConfigs.map((niche) => {
                  const active = agent.niches.includes(niche.id);
                  return (
                    <button key={niche.id} onClick={() => toggleNiche(niche.id)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        active ? 'text-white shadow-sm' : 'bg-stone-50 border border-stone-200 text-stone-500 hover:border-stone-300'
                      )}
                      style={active ? { backgroundColor: niche.farbcode } : {}}>
                      {niche.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save bar */}
          <div className="px-6 py-4 border-t border-stone-100 flex justify-end">
            <button onClick={handleSave}
              className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm">
              <Save className="w-4 h-4" /> Speichern
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
