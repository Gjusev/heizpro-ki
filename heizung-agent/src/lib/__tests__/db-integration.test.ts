import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Integration tests for database queries.
 * These require DATABASE_URL to be set and the DB to be migrated + seeded.
 * Run with: DATABASE_URL=... pnpm test
 */
describe('db-queries (integration)', () => {
  // Skip if no DATABASE_URL
  const hasDb = !!process.env.DATABASE_URL;

  describe.skipIf(!hasDb)('with database connection', () => {
    let dbGetAgents: typeof import('@/lib/db/queries').dbGetAgents;
    let dbGetScripts: typeof import('@/lib/db/queries').dbGetScripts;
    let dbGetCalls: typeof import('@/lib/db/queries').dbGetCalls;
    let dbGetActiveAgentId: typeof import('@/lib/db/queries').dbGetActiveAgentId;
    let dbSaveCall: typeof import('@/lib/db/queries').dbSaveCall;
    let dbDeleteCall: typeof import('@/lib/db/queries').dbDeleteCall;

    beforeAll(async () => {
      const queries = await import('@/lib/db/queries');
      dbGetAgents = queries.dbGetAgents;
      dbGetScripts = queries.dbGetScripts;
      dbGetCalls = queries.dbGetCalls;
      dbGetActiveAgentId = queries.dbGetActiveAgentId;
      dbSaveCall = queries.dbSaveCall;
      dbDeleteCall = queries.dbDeleteCall;
    });

    it('can fetch agents from DB', async () => {
      const agents = await dbGetAgents();
      expect(agents.length).toBeGreaterThanOrEqual(2);
      expect(agents[0].name).toContain('Anna');
      expect(agents[1].name).toContain('Max');
    });

    it('can fetch scripts from DB', async () => {
      const scripts = await dbGetScripts();
      expect(scripts.length).toBeGreaterThanOrEqual(3);
      const names = scripts.map((s) => s.name);
      expect(names.some((n) => n.includes('Wärmepumpe'))).toBe(true);
    });

    it('agents have correct properties', async () => {
      const agents = await dbGetAgents();
      for (const agent of agents) {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(['beratend', 'vertrauensvoll', 'energisch', 'ruhig']).toContain(agent.persoenlichkeit);
        expect(agent.sprache).toBe('de-DE');
        expect(agent.geschwindigkeit).toBeGreaterThan(0);
        expect(agent.temperatur).toBeGreaterThan(0);
      }
    });

    it('scripts have sections and objections as arrays', async () => {
      const scripts = await dbGetScripts();
      for (const script of scripts) {
        expect(Array.isArray(script.sections)).toBe(true);
        expect(Array.isArray(script.objections)).toBe(true);
      }
    });

    it('can get active agent ID', async () => {
      const id = await dbGetActiveAgentId();
      expect(id).toBeTruthy();
      expect(['agent-01', 'agent-02']).toContain(id);
    });

    it('can insert and delete a call', async () => {
      const callId = await dbSaveCall({
        duration: 120,
        status: 'abgeschlossen',
        outcome: 'interesse',
        summary: 'Test call from vitest',
      });
      expect(callId).toBeTruthy();

      // Verify it appears in calls
      const calls = await dbGetCalls();
      expect(calls.some((c) => c.id === callId)).toBe(true);

      // Clean up
      await dbDeleteCall(callId);
      const callsAfter = await dbGetCalls();
      expect(callsAfter.some((c) => c.id === callId)).toBe(false);
    });
  });
});
