import { pgSchema, uuid, text, varchar, boolean, integer, timestamp, jsonb, real } from 'drizzle-orm/pg-core';

// ============================================
// Schema: heizpro – KI-Sprachverkaufsagent
// Alle Tabellen im eigenen Schema fuer Isolation
// ============================================

const heizpro = pgSchema('heizpro');

// --- Agents ---
export const agents = heizpro.table('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  personality: varchar('personality', { length: 30 }).notNull().default('beratend'),
  language: varchar('language', { length: 10 }).notNull().default('de-DE'),
  voiceId: varchar('voice_id', { length: 100 }),
  engineId: varchar('engine_id', { length: 100 }),
  speed: real('speed').notNull().default(1.0),
  temperature: integer('temperature').notNull().default(70), // 0-100 mapped to 0.0-1.0
  active: boolean('active').notNull().default(true),
  maxCallsPerDay: integer('max_calls_per_day').notNull().default(80),
  workStart: varchar('work_start', { length: 5 }).notNull().default('09:00'),
  workEnd: varchar('work_end', { length: 5 }).notNull().default('18:00'),
  workDays: varchar('work_days', { length: 20 }).notNull().default('1,2,3,4,5'),
  niches: text('niches').notNull().default('waermepumpe,klimaanlage,gasheizung'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Scripts ---
export const scripts = heizpro.table('scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  niche: varchar('niche', { length: 50 }).notNull(),
  description: text('description'),
  version: varchar('version', { length: 10 }).notNull().default('1.0'),
  active: boolean('active').notNull().default(true),
  sections: jsonb('sections').notNull().default('[]'),
  objections: jsonb('objections').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Agent-Script Assignment ---
export const agentScripts = heizpro.table('agent_scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  scriptId: uuid('script_id').notNull().references(() => scripts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Calls ---
export const calls = heizpro.table('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').references(() => agents.id),
  scriptId: uuid('script_id').references(() => scripts.id),
  niche: varchar('niche', { length: 50 }),
  status: varchar('status', { length: 30 }).notNull().default('abgeschlossen'),
  outcome: varchar('outcome', { length: 30 }),
  mood: varchar('mood', { length: 20 }),
  duration: integer('duration').notNull().default(0),
  summary: text('summary'),
  transcript: jsonb('transcript').notNull().default('[]'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

// --- Speech Engine Config ---
export const speechEngines = heizpro.table('speech_engines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  engineId: varchar('engine_id', { length: 100 }).notNull(),
  wsUrl: varchar('ws_url', { length: 500 }),
  voiceId: varchar('voice_id', { length: 100 }),
  modelId: varchar('model_id', { length: 100 }).default('eleven_multilingual_v2'),
  active: boolean('active').notNull().default(true),
  config: jsonb('config').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Types for Drizzle inference
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Script = typeof scripts.$inferSelect;
export type NewScript = typeof scripts.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type AgentScript = typeof agentScripts.$inferSelect;
export type SpeechEngine = typeof speechEngines.$inferSelect;
export type NewSpeechEngine = typeof speechEngines.$inferInsert;
