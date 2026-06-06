'use client';

import { mockAppointments } from '@/lib/mock-data';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { nicheConfigs } from '@/lib/sales-scripts';
import Link from 'next/link';

export function UpcomingAppointments() {
  const appointments = mockAppointments.filter((a) => a.status !== 'storniert');

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Kommende Termine</h3>
          <p className="text-sm text-gray-500">Beratungstermine & Vor-Ort-Besuche</p>
        </div>
        <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          {appointments.length} Termine
        </div>
      </div>
      <div className="space-y-3">
        {appointments.map((apt) => {
          const niche = nicheConfigs.find((n) => n.id === apt.niche);
          return (
            <div
              key={apt.id}
              className="relative p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="text-center shrink-0">
                  <div className="text-lg font-bold text-gray-900">{apt.datum.split('-')[2]}</div>
                  <div className="text-xs text-gray-400 uppercase">
                    {new Date(apt.datum).toLocaleDateString('de-DE', { month: 'short' })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{apt.leadName}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {apt.uhrzeit} · {apt.dauer} Min.
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: niche ? `${niche.farbcode}15` : '#f3f4f6',
                        color: niche?.farbcode || '#6b7280',
                      }}
                    >
                      {niche?.name || apt.niche}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{apt.ort}</span>
                  </div>
                </div>
              </div>
              <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${apt.status === 'bestaetigt' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
