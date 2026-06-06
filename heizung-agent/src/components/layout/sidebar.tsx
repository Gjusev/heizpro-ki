'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Phone,
  FileText,
  Flame,
  Menu,
  X,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Sprachassistent', icon: Mic, highlight: true },
  { href: '/calls', label: 'Gespräche', icon: Phone },
  { href: '/scripts', label: 'Skripte', icon: FileText },
  { href: '/agents', label: 'Agenten', icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setCollapsed(true)} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 z-50 h-screen bg-[var(--dark)] text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-0 lg:w-20 overflow-hidden' : 'w-72 lg:w-72'
      )}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shrink-0">
            <Flame className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight truncate">HeizPro KI</h1>
              <p className="text-[11px] text-stone-500 truncate">Sprachverkaufsagent</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-lg hover:bg-white/5 transition-colors lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const highlight = 'highlight' in item && item.highlight;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                  isActive && highlight
                    ? 'bg-gradient-to-r from-orange-500/20 to-red-500/10 text-orange-400'
                    : isActive
                    ? 'bg-white/5 text-white'
                    : highlight && !collapsed
                    ? 'text-orange-300/80 border border-orange-500/15 bg-orange-500/5 hover:bg-orange-500/10'
                    : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
                )}
              >
                <item.icon className={cn('w-[18px] h-[18px] shrink-0')} />
                {!collapsed && <span>{item.label}</span>}
                {highlight && !isActive && !collapsed && (
                  <span className="ml-auto text-[9px] uppercase tracking-wider bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">Live</span>
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 mx-3 mb-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 agent-active-pulse" />
              1 Agent aktiv
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
            </div>
          </div>
        )}
      </aside>

      <button
        onClick={() => setCollapsed(false)}
        className={cn('fixed top-4 left-4 z-40 p-2 rounded-xl bg-[var(--dark)] text-white shadow-lg lg:hidden', !collapsed && 'hidden')}
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
