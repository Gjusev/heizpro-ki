'use client';

import type { Call, CallTranscript, SalesScript, AgentConfig } from '@/types';
import { salesScripts as defaultScripts } from '@/lib/sales-scripts';
import { mockAgents } from '@/lib/mock-data';

// ============================================
// LocalStorage Store – Full Persistence
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

// --- Agents (multi-agent support, 2 agents) ---
export function getAgents(): AgentConfig[] {
  return getItem<AgentConfig[]>(KEYS.agents, mockAgents);
}

export function saveAgents(agents: AgentConfig[]): void {
  setItem(KEYS.agents, agents);
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
}

/** Get the currently active agent as full AgentConfig (backwards compat) */
export function getAgent(): AgentConfig {
  const agents = getAgents();
  const activeId = getActiveAgentId();
  return agents.find((a) => a.id === activeId) || agents[0] || mockAgents[0];
}
