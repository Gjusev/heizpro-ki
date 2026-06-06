'use client';

import { useState, useEffect } from 'react';
import { getCalls, deleteCall } from '@/lib/store';
import { formatDuration, formatDate, formatTime, cn } from '@/lib/utils';
import { nicheConfigs } from '@/lib/sales-scripts';
import {
  Phone, Clock, CaretDown, CaretUp, Trash, ChatCircle, Robot, User, CalendarBlank
} from '@phosphor-icons/react/dist/ssr';
import type { Call } from '@/types';

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCalls(getCalls().sort((a, b) => new Date(b.gestartetAm).getTime() - new Date(a.gestartetAm).getTime()));
  }, []);

  const handleDelete = (id: string) => {
    deleteCall(id);
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  if (!mounted) return null;

  const totalDuration = calls.reduce((a, c) => a + c.dauer, 0);
  const totalMsgs = calls.reduce((a, c) => a + (c.transkript?.length || 0), 0);

  return (
    <main className="overflow-x-hidden w-full max-w-full px-6 lg:px-10 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">Gesprächsarchiv</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">Gespräche</h1>
          <p className="text-stone-500 text-sm mt-2">Alle simulierten Verkaufsgespräche mit vollständigen Transkriptionen</p>
        </div>

        {/* Stats — asymmetric layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl p-6 card-elevated flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Phone size={28} weight="duotone" className="text-orange-400" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.15em] text-stone-500 font-medium">Gespräche gesamt</span>
              <p className="text-4xl font-bold mt-0.5">{calls.length}</p>
              <p className="text-xs text-stone-500 mt-1">{formatDuration(totalDuration)} Gesamtdauer</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 card-elevated flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <ChatCircle size={16} weight="duotone" className="text-stone-400" />
              <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">Nachrichten</span>
            </div>
            <p className="text-3xl font-bold text-stone-900">{totalMsgs}</p>
          </div>
        </div>

        {/* Call list */}
        <div className="space-y-2">
          {calls.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mx-auto mb-5">
                <Phone size={32} weight="duotone" className="text-orange-400" />
              </div>
              <h3 className="text-stone-700 text-base font-semibold mb-1">Noch keine Gespräche</h3>
              <p className="text-stone-400 text-sm max-w-xs mx-auto mb-5">
                Starten Sie Ihr erstes Gespräch im Sprachassistenten und es erscheint hier.
              </p>
              <a href="/" className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors">
                Gespräch starten
              </a>
            </div>
          )}

          {calls.map((call) => {
            const isOpen = expandedId === call.id;
            const niche = nicheConfigs.find((n) => n.id === call.skriptId?.split('-')[1]?.replace('script-', '') || '');
            return (
              <div key={call.id} className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden card-elevated cursor-pointer">
                {/* Header */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                  onClick={() => setExpandedId(isOpen ? null : call.id)}>
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-stone-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {formatDate(call.gestartetAm)} — {formatTime(call.gestartetAm)}
                      </p>
                      {call.ergebnis && (
                        <span className={cn(
                          'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                          call.ergebnis === 'termin_gebucht' ? 'bg-emerald-50 text-emerald-700' :
                          call.ergebnis === 'interesse' ? 'bg-blue-50 text-blue-700' : 'bg-stone-100 text-stone-600'
                        )}>
                          {call.ergebnis.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDuration(call.dauer)} Dauer · {call.transkript?.length || 0} Nachrichten
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(call.id); }}
                      className="p-2 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                    {isOpen ? <CaretUp className="w-4 h-4 text-stone-400" /> : <CaretDown className="w-4 h-4 text-stone-400" />}
                  </div>
                </div>

                {/* Expanded transcript */}
                {isOpen && call.transkript && call.transkript.length > 0 && (
                  <div className="border-t border-stone-100 px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-stone-400 font-medium mb-3">Vollständige Transkription</p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {call.transkript.map((t) => (
                        <div key={t.id} className={cn('flex gap-2.5', t.sprecher === 'agent' ? 'justify-start' : 'justify-end')}>
                          {t.sprecher === 'agent' && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 mt-0.5">
                              <Robot className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className={cn(
                            'max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                            t.sprecher === 'agent'
                              ? 'bg-stone-50 text-stone-800 rounded-tl-lg'
                              : 'bg-stone-900 text-white rounded-tr-lg'
                          )}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-50">
                              {t.sprecher === 'agent' ? 'Verkäufer' : 'Kunde'} · {formatTime(t.zeitstempel)}
                            </p>
                            <p>{t.text}</p>
                          </div>
                          {t.sprecher === 'kunde' && (
                            <div className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-3 h-3 text-stone-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {call.zusammenfassung && (
                      <div className="mt-4 bg-orange-50/50 border border-orange-100 rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-[0.15em] text-orange-600 font-medium mb-1">Zusammenfassung</p>
                        <p className="text-sm text-orange-800">{call.zusammenfassung}</p>
                      </div>
                    )}
                  </div>
                )}

                {isOpen && (!call.transkript || call.transkript.length === 0) && (
                  <div className="border-t border-stone-100 px-5 py-6 text-center text-stone-400 text-sm">
                    Keine Transkription verfügbar.
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
