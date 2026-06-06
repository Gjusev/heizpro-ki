'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockDailyMetrics } from '@/lib/mock-data';

export function NicheChart() {
  const data = mockDailyMetrics.slice(-14).map((d) => ({
    datum: new Date(d.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    anrufe: d.anrufe,
    verbunden: d.verbunden,
    termine: d.termine,
  }));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Anruf-Aktivität</h3>
          <p className="text-sm text-gray-500">Letzte 14 Tage</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-gray-500">Anrufe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-gray-500">Termine</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="gradientAnrufe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientTermine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="datum" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="anrufe" stroke="#fb923c" fill="url(#gradientAnrufe)" strokeWidth={2} />
            <Area type="monotone" dataKey="termine" stroke="#34d399" fill="url(#gradientTermine)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
