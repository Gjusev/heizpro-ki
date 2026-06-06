import { z } from 'zod/v4';

// ============================================
// Zod Validation Schemas – HeizPro KI API
// ============================================

// --- Agent ---
export const agentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  personality: z.enum(['beratend', 'vertrauensvoll', 'energisch', 'ruhig']).default('beratend'),
  voiceId: z.string().max(100).optional(),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  temperature: z.number().min(0).max(1).default(0.7),
  active: z.boolean().default(true),
  maxCallsPerDay: z.number().int().min(1).max(500).default(80),
  workStart: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  workDays: z.array(z.number().int().min(0).max(6)).min(1).default([1, 2, 3, 4, 5]),
  niches: z.array(z.string()).min(1).default(['waermepumpe']),
  scriptIds: z.array(z.string().uuid()).default([]),
});

export const agentUpdateSchema = agentCreateSchema.partial();

// --- Script ---
export const scriptSectionSchema = z.object({
  phase: z.enum(['begruessung', 'bedarfsanalyse', 'praesentation', 'einwandbehandlung', 'abschluss', 'verabschiedung']),
  headline: z.string().max(200),
  haupttext: z.string(),
  varianten: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
});

export const objectionSchema = z.object({
  id: z.string(),
  kategorie: z.string().max(100),
  einwand: z.string(),
  antworten: z.array(z.string()).min(1),
});

export const scriptCreateSchema = z.object({
  name: z.string().min(1).max(200),
  niche: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
  version: z.string().max(10).default('1.0'),
  active: z.boolean().default(true),
  sections: z.array(scriptSectionSchema).min(1),
  objections: z.array(objectionSchema).default([]),
});

export const scriptUpdateSchema = scriptCreateSchema.partial();

// --- Call ---
export const callCreateSchema = z.object({
  agentId: z.string().uuid().optional(),
  scriptId: z.string().uuid().optional(),
  niche: z.string().max(50).optional(),
  status: z.enum(['geplant', 'laeuft', 'abgeschlossen', 'abgebrochen']).default('abgeschlossen'),
  outcome: z.enum(['termin_gebucht', 'interesse', 'kein_interesse', 'rueckruf', 'nicht_erreicht', 'widerspruch']).optional(),
  mood: z.enum(['positiv', 'neutral', 'negativ']).optional(),
  duration: z.number().int().min(0).default(0),
  summary: z.string().optional(),
  transcript: z.array(z.object({
    abschnitt: z.string(),
    sprecher: z.enum(['agent', 'kunde']),
    text: z.string(),
    zeitstempel: z.string(),
  })).default([]),
});

// --- Chat ---
export const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['agent', 'user']),
    content: z.string(),
    timestamp: z.string(),
  })),
  niche: z.string().min(1),
  scriptId: z.string().min(1),
  currentPhase: z.string().min(1),
  leadName: z.string().optional(),
});

// --- TTS ---
export const ttsRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().max(100).optional(),
});
