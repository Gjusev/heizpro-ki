'use client';

import type { Call, CallTranscript, SalesScript, AgentConfig } from '@/types';
import { salesScripts as defaultScripts } from '@/lib/sales-scripts';
import { mockAgent } from '@/lib/mock-data';

// ============================================
// LocalStorage Store – Full Persistence
// ============================================

const KEYS = {
  calls: 'heizpro_calls',
  scripts: 'heizpro_scripts',
  agent: 'heizpro_agent',
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// --- Calls ---
export function getCalls(): Call[] {
  return getItem<Call[]>(KEYS.calls, []);
}

export function saveCall(call: Call): void {
  const calls = getCalls();
  const idx = calls.findIndex((c) => c.id === call.id);
  if (idx >= 0) calls[idx] = call;
  else calls.unshift(call);
  setItem(KEYS.calls, calls);
}

export function deleteCall(callId: string): void {
  setItem(KEYS.calls, getCalls().filter((c) => c.id !== callId));
}

// --- Scripts ---
export function getScripts(): SalesScript[] {
  return getItem<SalesScript[]>(KEYS.scripts, defaultScripts);
}

export function saveScript(script: SalesScript): void {
  const scripts = getScripts();
  const idx = scripts.findIndex((s) => s.id === script.id);
  if (idx >= 0) scripts[idx] = script;
  else scripts.push(script);
  setItem(KEYS.scripts, scripts);
}

export function deleteScript(scriptId: string): void {
  setItem(KEYS.scripts, getScripts().filter((s) => s.id !== scriptId));
}

// --- Agent ---
export function getAgent(): AgentConfig {
  return getItem<AgentConfig>(KEYS.agent, mockAgent);
}

export function saveAgent(agent: AgentConfig): void {
  setItem(KEYS.agent, agent);
}
