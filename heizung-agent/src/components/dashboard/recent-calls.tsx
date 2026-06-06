'use client';

import { mockCalls } from '@/lib/mock-data';
import { formatDuration, formatTime, getOutcomeLabel, getMoodEmoji } from '@/lib/utils';
import { Phone, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function RecentCalls() {
  const calls = mockCalls.filter((c) => c.status === 'abgeschlossen').slice(0, 5);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Letzte Anrufe</h3>
          <p className="text-sm text-gray-500">Aktuelle Gesprächsergebnisse</p>
        </div>
        <Link href="/calls" className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 font-medium">
          Alle <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {calls.map((call) => (
          <div
            key={call.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 shrink-0">
              <Phone className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{call.leadName}</p>
                <span className="text-sm">{getMoodEmoji(call.stimmung)}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{call.zusammenfassung?.slice(0, 60)}…</p>
            </div>
            <div className="text-right shrink-0">
              {call.ergebnis && (
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${
                  call.ergebnis === 'termin_gebucht'
                    ? 'bg-emerald-50 text-emerald-700'
                    : call.ergebnis === 'interesse'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {getOutcomeLabel(call.ergebnis)}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDuration(call.dauer)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
