'use server';

import { db } from './index';
import { agents, scripts, agentScripts, calls } from './schema';
import { eq, desc } from 'drizzle-orm';
import { salesScripts } from '@/lib/sales-scripts';
import { mockAgents } from '@/lib/mock-data';
import type { AgentConfig } from '@/types';

// ============================================
// Server Actions — Database queries
// Replaces localStorage store
// ============================================

// --- Agents ---

export async function dbGetAgents(): Promise<AgentConfig[]> {
  const rows = await db.select().from(agents).orderBy(agents.createdAt);
  return rows.map(rowToAgentConfig);
}

export async function dbGetAgent(id: string): Promise<AgentConfig | null> {
  const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  if (rows.length === 0) return null;
  return rowToAgentConfig(rows[0]);
}

export async function dbGetActiveAgent(): Promise<AgentConfig | null> {
  const rows = await db.select().from(agents).where(eq(agents.active, true)).limit(1);
  if (rows.length === 0) return null;
  return rowToAgentConfig(rows[0]);
}

export async function dbSaveAgent(config: AgentConfig): Promise<void> {
  const existing = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, config.id)).limit(1);

  const data = {
    name: config.name,
    description: config.beschreibung,
    personality: config.persoenlichkeit,
    language: config.sprache,
    voiceId: config.stimme,
    speed: config.geschwindigkeit,
    temperature: Math.round(config.temperatur * 100),
    active: config.aktiv,
    maxCallsPerDay: config.maxAnrufeProTag,
    workStart: config.arbeitszeiten.start,
    workEnd: config.arbeitszeiten.ende,
    workDays: config.arbeitszeiten.wochentage.join(','),
    niches: config.niches.join(','),
  };

  if (existing.length > 0) {
    await db.update(agents).set({ ...data, updatedAt: new Date() }).where(eq(agents.id, config.id));
  } else {
    await db.insert(agents).values({
      id: config.id,
      ...data,
    });
  }

  // Sync script assignments
  await db.delete(agentScripts).where(eq(agentScripts.agentId, config.id));
  for (const scriptId of config.skriptIds) {
    await db.insert(agentScripts).values({
      agentId: config.id,
      scriptId: scriptId,
    });
  }
}

export async function dbSaveAgents(configs: AgentConfig[]): Promise<void> {
  for (const config of configs) {
    await dbSaveAgent(config);
  }
}

export async function dbSetActiveAgent(id: string): Promise<void> {
  await db.update(agents).set({ active: false, updatedAt: new Date() });
  await db.update(agents).set({ active: true, updatedAt: new Date() }).where(eq(agents.id, id));
}

export async function dbGetActiveAgentId(): Promise<string> {
  const row = await db.select({ id: agents.id }).from(agents).where(eq(agents.active, true)).limit(1);
  return row[0]?.id || 'agent-01';
}

// --- Scripts ---

export async function dbGetScripts() {
  return db.select().from(scripts).orderBy(desc(scripts.createdAt));
}

export async function dbGetScript(id: string) {
  const rows = await db.select().from(scripts).where(eq(scripts.id, id)).limit(1);
  return rows[0] || null;
}

export async function dbSaveScript(script: {
  id?: string;
  name: string;
  niche: string;
  description?: string;
  version?: string;
  active?: boolean;
  sections?: any[];
  objections?: any[];
}) {
  if (script.id) {
    const existing = await db.select({ id: scripts.id }).from(scripts).where(eq(scripts.id, script.id)).limit(1);
    if (existing.length > 0) {
      await db.update(scripts).set({
        name: script.name,
        niche: script.niche,
        description: script.description || null,
        version: script.version || '1.0',
        active: script.active ?? true,
        sections: script.sections || [],
        objections: script.objections || [],
        updatedAt: new Date(),
      }).where(eq(scripts.id, script.id));
      return script.id;
    }
  }

  const result = await db.insert(scripts).values({
    id: script.id || `script-${Date.now()}`,
    name: script.name,
    niche: script.niche,
    description: script.description || null,
    version: script.version || '1.0',
    active: script.active ?? true,
    sections: script.sections || [],
    objections: script.objections || [],
  }).returning({ id: scripts.id });

  return result[0].id;
}

export async function dbDeleteScript(id: string) {
  await db.delete(agentScripts).where(eq(agentScripts.scriptId, id));
  await db.delete(scripts).where(eq(scripts.id, id));
}

// --- Calls ---

export async function dbGetCalls() {
  return db.select().from(calls).orderBy(desc(calls.startedAt));
}

export async function dbSaveCall(call: {
  agentId?: string;
  scriptId?: string;
  niche?: string;
  status?: string;
  outcome?: string;
  mood?: string;
  duration: number;
  summary?: string;
  transcript?: any[];
  startedAt?: Date;
  endedAt?: Date;
}) {
  const result = await db.insert(calls).values({
    agentId: call.agentId || null,
    scriptId: call.scriptId || null,
    niche: call.niche || null,
    status: call.status || 'abgeschlossen',
    outcome: call.outcome || null,
    mood: call.mood || null,
    duration: call.duration,
    summary: call.summary || null,
    transcript: call.transcript || [],
    startedAt: call.startedAt || new Date(),
    endedAt: call.endedAt || null,
  }).returning({ id: calls.id });

  return result[0].id;
}

export async function dbDeleteCall(id: string) {
  await db.delete(calls).where(eq(calls.id, id));
}

// --- Seed ---

export async function dbSeedDefaults() {
  const existingAgents = await db.select({ id: agents.id }).from(agents).limit(1);
  if (existingAgents.length > 0) return { seeded: false, message: 'Already seeded' };

  for (const agent of mockAgents) {
    await dbSaveAgent(agent);
  }

  for (const script of salesScripts) {
    await dbSaveScript({
      id: script.id,
      name: script.name,
      niche: script.niche,
      description: script.beschreibung,
      version: script.version,
      active: script.aktiv,
      sections: script.abschnitte,
      objections: script.einwaende,
    });
  }

  return { seeded: true, agents: mockAgents.length, scripts: salesScripts.length };
}

// --- Helper: Map DB row to AgentConfig ---

function rowToAgentConfig(row: typeof agents.$inferSelect): AgentConfig {
  return {
    id: row.id,
    name: row.name,
    beschreibung: row.description || '',
    persoenlichkeit: row.personality as AgentConfig['persoenlichkeit'],
    sprache: row.language as 'de-DE',
    stimme: row.voiceId || 'Marlene',
    geschwindigkeit: row.speed,
    temperatur: row.temperature / 100,
    aktiv: row.active,
    maxAnrufeProTag: row.maxCallsPerDay,
    arbeitszeiten: {
      start: row.workStart,
      ende: row.workEnd,
      wochentage: row.workDays.split(',').map(Number),
    },
    skriptIds: [],
    niches: row.niches.split(',') as AgentConfig['niches'],
    erstelltAm: row.createdAt.toISOString(),
  };
}

export async function dbGetAgentWithScripts(agentId: string): Promise<AgentConfig | null> {
  const agent = await dbGetAgent(agentId);
  if (!agent) return null;

  const assignments = await db.select({ scriptId: agentScripts.scriptId })
    .from(agentScripts)
    .where(eq(agentScripts.agentId, agentId));

  agent.skriptIds = assignments.map((a) => a.scriptId);
  return agent;
}
