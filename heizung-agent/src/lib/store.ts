'use client';

import type { Call, SalesScript, AgentConfig } from '@/types';
import { salesScripts as defaultScripts } from '@/lib/sales-scripts';
import { mockAgents } from '@/lib/mock-data';

// ============================================
// Store – PostgreSQL-backed via API routes
// Falls back to localStorage during SSR or if DB unavailable
// ============================================

const KEYS = {
  calls: 'heizpro_calls',
  scripts: 'heizpro_scripts',
  agents: 'heizpro_agents',
  activeAgent: 'heizpro_active_agent',
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

// ============================================
// Calls — persisted to PostgreSQL
// ============================================

export function getCalls(): Call[] {
  return getItem<Call[]>(KEYS.calls, []);
}

export async function getCallsFromDB(): Promise<Call[]> {
  try {
    const res = await fetch('/api/db/calls');
    const data = await res.json();
    return data.calls || [];
  } catch {
    return getCalls();
  }
}

export function saveCall(call: Call): void {
  const calls = getCalls();
  const idx = calls.findIndex((c) => c.id === call.id);
  if (idx >= 0) calls[idx] = call;
  else calls.unshift(call);
  setItem(KEYS.calls, calls);

  // Persist to DB in background
  fetch('/api/db/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      duration: call.dauer,
      status: call.status,
      outcome: call.ergebnis,
      mood: call.stimmung,
      summary: call.zusammenfassung,
      transcript: call.transkript,
      startedAt: call.gestartetAm,
      endedAt: call.beendetAm,
      scriptId: call.skriptId,
      niche: call.skriptId?.split('-')[1] || undefined,
    }),
  }).catch(() => {});
}

export async function deleteCallFromDB(callId: string): Promise<void> {
  try {
    await fetch(`/api/db/calls?id=${callId}`, { method: 'DELETE' });
  } catch {}
  deleteCall(callId);
}

export function deleteCall(callId: string): void {
  setItem(KEYS.calls, getCalls().filter((c) => c.id !== callId));
}

// ============================================
// Scripts — persisted to PostgreSQL
// ============================================

export function getScripts(): SalesScript[] {
  return getItem<SalesScript[]>(KEYS.scripts, defaultScripts);
}

export async function getScriptsFromDB(): Promise<any[]> {
  try {
    const res = await fetch('/api/db/scripts');
    const data = await res.json();
    return data.scripts || [];
  } catch {
    return getScripts();
  }
}

export function saveScript(script: SalesScript): void {
  const scripts = getScripts();
  const idx = scripts.findIndex((s) => s.id === script.id);
  if (idx >= 0) scripts[idx] = script;
  else scripts.push(script);
  setItem(KEYS.scripts, scripts);

  // Persist to DB in background
  fetch('/api/db/scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: script.id,
      name: script.name,
      niche: script.niche,
      description: script.beschreibung,
      version: script.version,
      active: script.aktiv,
      sections: script.abschnitte,
      objections: script.einwaende,
    }),
  }).catch(() => {});
}

export async function deleteScriptFromDB(scriptId: string): Promise<void> {
  try {
    await fetch(`/api/db/scripts?id=${scriptId}`, { method: 'DELETE' });
  } catch {}
  deleteScript(scriptId);
}

export function deleteScript(scriptId: string): void {
  setItem(KEYS.scripts, getScripts().filter((s) => s.id !== scriptId));
}

// ============================================
// Agents — persisted to PostgreSQL
// ============================================

export function getAgents(): AgentConfig[] {
  return getItem<AgentConfig[]>(KEYS.agents, mockAgents);
}

export async function getAgentsFromDB(): Promise<AgentConfig[]> {
  try {
    const res = await fetch('/api/db/agents');
    const data = await res.json();
    if (data.agents && data.agents.length > 0) {
      // Cache to localStorage for instant loads
      setItem(KEYS.agents, data.agents);
      return data.agents;
    }
    return getAgents();
  } catch {
    return getAgents();
  }
}

export function saveAgents(agents: AgentConfig[]): void {
  setItem(KEYS.agents, agents);

  // Persist to DB in background
  fetch('/api/db/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agents }),
  }).catch(() => {});
}

export function saveAgent(agent: AgentConfig): void {
  const agents = getAgents();
  const idx = agents.findIndex((a) => a.id === agent.id);
  if (idx >= 0) agents[idx] = agent;
  else agents.push(agent);
  saveAgents(agents);
}

export function getActiveAgentId(): string {
  return getItem<string>(KEYS.activeAgent, 'agent-01');
}

export function setActiveAgentId(id: string): void {
  setItem(KEYS.activeAgent, id);

  // Persist to DB in background
  fetch('/api/db/agents', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activeId: id }),
  }).catch(() => {});
}

/** Get the currently active agent as full AgentConfig (backwards compat) */
export function getAgent(): AgentConfig {
  const agents = getAgents();
  const activeId = getActiveAgentId();
  return agents.find((a) => a.id === activeId) || agents[0] || mockAgents[0];
}

// ============================================
// Seed — call once on first load
// ============================================

let _seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (_seeded) return;
  _seeded = true;
  try {
    await fetch('/api/db/seed', { method: 'POST' });
  } catch {}
}
