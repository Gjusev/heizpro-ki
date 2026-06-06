'use client';

import { useState, useEffect } from 'react';
import { getScripts, saveScript, deleteScript } from '@/lib/store';
import { getAgent, saveAgent } from '@/lib/store';
import { nicheConfigs } from '@/lib/sales-scripts';
import { cn } from '@/lib/utils';
import {
  FileText, Plus, PencilSimple, Trash, CaretDown, CaretUp, Copy, FloppyDisk, X, Phone, Shield, ChatCircle, Check
} from '@phosphor-icons/react/dist/ssr';
import type { SalesScript, ScriptSection, Objection, ScriptPhase } from '@/types';

const PHASES: { value: ScriptPhase; label: string }[] = [
  { value: 'begruessung', label: 'Begrüßung' },
  { value: 'bedarfsanalyse', label: 'Bedarfsanalyse' },
  { value: 'praesentation', label: 'Präsentation' },
  { value: 'einwandbehandlung', label: 'Einwandbehandlung' },
  { value: 'abschluss', label: 'Abschluss' },
  { value: 'verabschiedung', label: 'Verabschiedung' },
];

const emptySection = (phase: ScriptPhase): ScriptSection => ({
  phase,
  headline: '',
  haupttext: '',
  varianten: [],
  triggers: [],
});

const emptyObjection = (): Objection => ({
  id: `obj-${Date.now()}`,
  kategorie: '',
  einwand: '',
  antworten: [''],
});

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<SalesScript[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<SalesScript | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    setScripts(getScripts());
  }, []);

  const handleSave = () => {
    if (!editData) return;
    saveScript({ ...editData, aktualisiertAm: new Date().toISOString() });
    setScripts(getScripts());
    setEditingId(null);
    setEditData(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleNew = () => {
    const newScript: SalesScript = {
      id: `script-${Date.now()}`,
      name: 'Neues Skript',
      niche: 'waermepumpe',
      beschreibung: '',
      version: '1.0',
      aktiv: true,
      abschnitte: PHASES.map((p) => emptySection(p.value)),
      einwaende: [],
      erstelltAm: new Date().toISOString(),
      aktualisiertAm: new Date().toISOString(),
    };
    setEditingId(newScript.id);
    setEditData(newScript);
  };

  const handleDuplicate = (script: SalesScript) => {
    const dup: SalesScript = {
      ...script,
      id: `script-${Date.now()}`,
      name: `${script.name} (Kopie)`,
      version: '1.0',
      erstelltAm: new Date().toISOString(),
      aktualisiertAm: new Date().toISOString(),
    };
    saveScript(dup);
    setScripts(getScripts());
  };

  const handleDelete = (id: string) => {
    deleteScript(id);
    setScripts(getScripts());
    if (editingId === id) { setEditingId(null); setEditData(null); }
  };

  // Toggle script assignment to agent
  const toggleScriptAssignment = (scriptId: string) => {
    const agent = getAgent();
    const has = agent.skriptIds.includes(scriptId);
    const updated = {
      ...agent,
      skriptIds: has ? agent.skriptIds.filter((s) => s !== scriptId) : [...agent.skriptIds, scriptId],
    };
    saveAgent(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Edit helpers
  const updateSection = (idx: number, field: keyof ScriptSection, value: string | string[]) => {
    if (!editData) return;
    const updated = [...editData.abschnitte];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditData({ ...editData, abschnitte: updated });
  };

  const addVariant = (idx: number) => {
    if (!editData) return;
    const updated = [...editData.abschnitte];
    updated[idx] = { ...updated[idx], varianten: [...updated[idx].varianten, ''] };
    setEditData({ ...editData, abschnitte: updated });
  };

  const updateVariant = (secIdx: number, varIdx: number, value: string) => {
    if (!editData) return;
    const updated = [...editData.abschnitte];
    const vars = [...updated[secIdx].varianten];
    vars[varIdx] = value;
    updated[secIdx] = { ...updated[secIdx], varianten: vars };
    setEditData({ ...editData, abschnitte: updated });
  };

  const updateObjection = (idx: number, field: keyof Objection, value: string | string[]) => {
    if (!editData) return;
    const updated = [...editData.einwaende];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditData({ ...editData, einwaende: updated });
  };

  const updateObjectionAnswer = (objIdx: number, ansIdx: number, value: string) => {
    if (!editData) return;
    const updated = [...editData.einwaende];
    const answers = [...updated[objIdx].antworten];
    answers[ansIdx] = value;
    updated[objIdx] = { ...updated[objIdx], antworten: answers };
    setEditData({ ...editData, einwaende: updated });
  };

  if (!mounted) return null;

  const agent = typeof window !== 'undefined' ? getAgent() : null;

  return (
    <main className="overflow-x-hidden w-full max-w-full px-6 lg:px-10 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">Verkaufsskripte</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">Skripte</h1>
            <p className="text-stone-500 text-sm mt-2">Erstellen, bearbeiten und weisen Sie Verkaufsskripte den Agenten zu</p>
          </div>
          <button onClick={handleNew}
            className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Neues Skript
          </button>
        </div>

        {/* Saved toast */}
        {saved && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" /> Gespeichert
          </div>
        )}

        {/* EDITOR */}
        {editingId && editData && (
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden card-elevated">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h2 className="font-semibold text-stone-900">Skript bearbeiten</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleSave}
                  className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors">
                  <FloppyDisk className="w-4 h-4" /> Speichern
                </button>
                <button onClick={() => { setEditingId(null); setEditData(null); }}
                  className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Meta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Name</label>
                  <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Nische</label>
                  <select value={editData.niche} onChange={(e) => setEditData({ ...editData, niche: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400">
                    {nicheConfigs.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Beschreibung</label>
                  <input value={editData.beschreibung} onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                </div>
              </div>

              {/* Sections / Phases */}
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Gespraechsphasen</h3>
                <div className="space-y-3">
                  {editData.abschnitte.map((section, idx) => (
                    <div key={section.phase} className="border border-stone-200 rounded-xl overflow-hidden">
                      <div className="bg-stone-50 px-4 py-2.5 flex items-center gap-2 border-b border-stone-200">
                        <span className="w-6 h-6 rounded-md bg-stone-300 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        <span className="text-sm font-semibold text-stone-700">{PHASES.find(p => p.value === section.phase)?.label}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Überschrift</label>
                          <input value={section.headline} onChange={(e) => updateSection(idx, 'headline', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            placeholder="z.B. Begrüßung & Einstieg" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Haupttext</label>
                          <textarea value={section.haupttext} onChange={(e) => updateSection(idx, 'haupttext', e.target.value)} rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
                            placeholder="Der Haupttext, den der Agent in dieser Phase spricht..." />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Varianten</label>
                          {section.varianten.map((v, vi) => (
                            <div key={vi} className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] text-stone-400 w-4 shrink-0">{vi + 1}.</span>
                              <input value={v} onChange={(e) => updateVariant(idx, vi, e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                            </div>
                          ))}
                          <button onClick={() => addVariant(idx)}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1">+ Variante hinzufügen</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objections */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Einwandbehandlung</h3>
                  <button onClick={() => setEditData({ ...editData, einwaende: [...editData.einwaende, emptyObjection()] })}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium">+ Einwand hinzufügen</button>
                </div>
                <div className="space-y-3">
                  {editData.einwaende.map((obj, idx) => (
                    <div key={obj.id} className="border border-stone-200 rounded-xl p-4 space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Kategorie</label>
                          <input value={obj.kategorie} onChange={(e) => updateObjection(idx, 'kategorie', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            placeholder="z.B. Kosten, Leistung" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Einwand</label>
                          <input value={obj.einwand} onChange={(e) => updateObjection(idx, 'einwand', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                            placeholder="z.B. Eine Waermepumpe ist zu teuer." />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Antworten</label>
                        {obj.antworten.map((a, ai) => (
                          <div key={ai} className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] text-stone-400 w-4 shrink-0">{ai + 1}.</span>
                            <textarea value={a} onChange={(e) => updateObjectionAnswer(idx, ai, e.target.value)} rows={2}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none" />
                          </div>
                        ))}
                        <button onClick={() => {
                          const updated = [...editData.einwaende];
                          updated[idx] = { ...updated[idx], antworten: [...updated[idx].antworten, ''] };
                          setEditData({ ...editData, einwaende: updated });
                        }} className="text-xs text-orange-600 hover:text-orange-700 font-medium">+ Antwort hinzufügen</button>
                      </div>
                      <button onClick={() => setEditData({ ...editData, einwaende: editData.einwaende.filter((_, i) => i !== idx) })}
                        className="text-xs text-red-500 hover:text-red-600 font-medium">Einwand entfernen</button>
                    </div>
                  ))}
                  {editData.einwaende.length === 0 && (
                    <p className="text-sm text-stone-400 py-4 text-center">Keine Einwände definiert. Klicken Sie auf &quot;+ Einwand hinzufügen&quot;.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Script list */}
        <div className="space-y-2">
          {scripts.map((script) => {
            const niche = nicheConfigs.find((n) => n.id === script.niche);
            const isAssigned = agent?.skriptIds?.includes(script.id);
            return (
              <div key={script.id} className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: niche ? `${niche.farbcode}15` : '#f5f5f4' }}>
                    <FileText className="w-5 h-5" style={{ color: niche?.farbcode || '#78716c' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900 truncate">{script.name}</p>
                      {script.aktiv && <span className="text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">Aktiv</span>}
                      {isAssigned && <span className="text-[9px] uppercase tracking-wider bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold"> Zugewiesen</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: niche ? `${niche.farbcode}12` : '#f5f5f4', color: niche?.farbcode || '#78716c' }}>
                        {niche?.name || script.niche}
                      </span>
                      <span className="text-xs text-stone-400">v{script.version}</span>
                      <span className="text-xs text-stone-400">{script.abschnitte.length} Phasen</span>
                      <span className="text-xs text-stone-400">{script.einwaende.length} Einwände</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Assign toggle */}
                    <button onClick={() => toggleScriptAssignment(script.id)} title={isAssigned ? 'Vom Agenten entfernen' : 'Agenten zuweisen'}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                        isAssigned ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      )}>
                      {isAssigned ? 'Zugewiesen' : 'Zuweisen'}
                    </button>
                    <button onClick={() => { setEditingId(script.id); setEditData({ ...script }); }}
                      className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
                      <PencilSimple className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDuplicate(script)}
                      className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(script.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Description */}
                {script.beschreibung && (
                  <div className="px-5 pb-3 pt-0">
                    <p className="text-xs text-stone-500">{script.beschreibung}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
