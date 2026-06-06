'use client';

import { useState, useEffect } from 'react';
import { getAgents, saveAgents, getActiveAgentId, setActiveAgentId } from '@/lib/store';
import { getScripts } from '@/lib/store';
import { nicheConfigs } from '@/lib/sales-scripts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Bot, Save, Check, Volume2, Clock, FileText, Phone, Zap, Users } from 'lucide-react';
import type { AgentConfig, AgentPersoenlichkeit } from '@/types';

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [scripts, setScripts] = useState<{ id: string; name: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeAgentId, setActiveId] = useState('agent-01');

  useEffect(() => {
    setMounted(true);
    setAgents(getAgents());
    setScripts(getScripts().map((s) => ({ id: s.id, name: s.name })));
    setActiveId(getActiveAgentId());
  }, []);

  const handleSave = () => {
    saveAgents(agents);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateAgent = (id: string, updates: Partial<AgentConfig>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const toggleScript = (agentId: string, scriptId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const has = agent.skriptIds.includes(scriptId);
    updateAgent(agentId, { skriptIds: has ? agent.skriptIds.filter((s) => s !== scriptId) : [...agent.skriptIds, scriptId] });
  };

  const toggleNiche = (agentId: string, niche: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const has = agent.niches.includes(niche as any);
    updateAgent(agentId, { niches: has ? agent.niches.filter((n) => n !== niche) : [...agent.niches, niche as any] });
  };

  if (!mounted) return null;

  const PERSONALITY_META: Record<AgentPersoenlichkeit, { label: string; desc: string }> = {
    beratend: { label: 'Beratend', desc: 'Ruhig, analysierend' },
    vertrauensvoll: { label: 'Vertrauensvoll', desc: 'Empathisch, warm' },
    energisch: { label: 'Energisch', desc: 'Direkt, abschlussstark' },
    ruhig: { label: 'Ruhig', desc: 'Geduldig, sachlich' },
  };

  const GRADIENTS = ['from-orange-500 to-red-600', 'from-blue-500 to-indigo-600'];

  return (
    <main className="overflow-x-hidden w-full max-w-full px-5 lg:px-10 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">Konfiguration</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">Verkaeufer</h1>
            <p className="text-stone-500 text-sm mt-1.5">Zwei KI-Agenten mit unterschiedlichen Verkaufsstillen</p>
          </div>
          <button onClick={handleSave}
            className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm">
            <Save className="w-4 h-4" /> Speichern
          </button>
        </div>

        {saved && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            <Check className="w-4 h-4" /> Gespeichert
          </motion.div>
        )}

        {/* Active agent indicator */}
        <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 border border-stone-200/60">
          <Users className="w-4 h-4 text-stone-400" />
          <span className="text-xs text-stone-500">Aktiver Agent im Sprachassistenten:</span>
          <div className="flex gap-1.5">
            {agents.map((a, i) => (
              <button key={a.id} onClick={() => { setActiveId(a.id); setActiveAgentId(a.id); }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                  activeAgentId === a.id ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                )}>
                {a.name.split('–')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {agents.map((agent, i) => (
            <motion.div key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">

              {/* Agent header */}
              <div className={cn('px-5 py-5 flex items-center gap-4', i === 0 ? 'bg-stone-900 text-white' : 'bg-stone-800 text-white')}>
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0', GRADIENTS[i])}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input value={agent.name}
                      onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                      className="bg-transparent text-base font-semibold border-b border-white/20 focus:border-orange-400 outline-none pb-0.5 w-full" />
                  </div>
                  <textarea value={agent.beschreibung}
                    onChange={(e) => updateAgent(agent.id, { beschreibung: e.target.value })}
                    rows={2}
                    className="w-full bg-transparent text-stone-400 text-[11px] mt-1 resize-none border-none outline-none placeholder:text-stone-600 leading-relaxed" />
                </div>
              </div>

              {/* Config */}
              <div className="p-5 space-y-5">
                {/* Personality */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
                    <Volume2 className="w-3 h-3" /> Stil
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['beratend', 'vertrauensvoll', 'energisch', 'ruhig'] as AgentPersoenlichkeit[]).map((p) => (
                      <button key={p} onClick={() => updateAgent(agent.id, { persoenlichkeit: p })}
                        className={cn(
                          'px-3 py-2 rounded-lg text-[11px] font-medium text-left transition-all',
                          agent.persoenlichkeit === p
                            ? 'bg-stone-900 text-white shadow-sm'
                            : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                        )}>
                        <span className="block font-semibold">{PERSONALITY_META[p].label}</span>
                        <span className="block text-[9px] opacity-50 mt-0.5">{PERSONALITY_META[p].desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Tempo</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="0.7" max="1.3" step="0.1" value={agent.geschwindigkeit}
                        onChange={(e) => updateAgent(agent.id, { geschwindigkeit: parseFloat(e.target.value) })}
                        className="flex-1 accent-orange-500 h-1" />
                      <span className="text-xs font-mono text-stone-500 w-8">{agent.geschwindigkeit}x</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Kreativitaet</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="0.3" max="1" step="0.1" value={agent.temperatur}
                        onChange={(e) => updateAgent(agent.id, { temperatur: parseFloat(e.target.value) })}
                        className="flex-1 accent-orange-500 h-1" />
                      <span className="text-xs font-mono text-stone-500 w-8">{agent.temperatur}</span>
                    </div>
                  </div>
                </div>

                {/* Scripts */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                    <FileText className="w-3 h-3" /> Skripte
                  </label>
                  <div className="space-y-1">
                    {scripts.map((script) => {
                      const assigned = agent.skriptIds.includes(script.id);
                      return (
                        <button key={script.id} onClick={() => toggleScript(agent.id, script.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all text-left',
                            assigned ? 'bg-orange-50 text-orange-800' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                          )}>
                          <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                            assigned ? 'border-orange-500 bg-orange-500' : 'border-stone-300')}>
                            {assigned && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          {script.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Niches */}
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Nischen</label>
                  <div className="flex flex-wrap gap-1.5">
                    {nicheConfigs.slice(0, 8).map((niche) => {
                      const active = agent.niches.includes(niche.id);
                      return (
                        <button key={niche.id} onClick={() => toggleNiche(agent.id, niche.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-medium transition-all',
                            active ? 'text-white' : 'bg-stone-50 border border-stone-200 text-stone-400 hover:border-stone-300'
                          )}
                          style={active ? { backgroundColor: niche.farbcode } : {}}>
                          {niche.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
