import { describe, it, expect } from 'vitest';
import { mockAgents, mockCalls, mockLeads, mockAppointments, mockAgentMetrics, mockDailyMetrics } from '@/lib/mock-data';

describe('mock-data', () => {
  describe('mockAgents', () => {
    it('has exactly 2 agents', () => {
      expect(mockAgents).toHaveLength(2);
    });

    it('agent-01 is Anna with beratend personality', () => {
      const anna = mockAgents[0];
      expect(anna.id).toBe('agent-01');
      expect(anna.name).toContain('Anna');
      expect(anna.persoenlichkeit).toBe('beratend');
    });

    it('agent-02 is Max with energisch personality', () => {
      const max = mockAgents[1];
      expect(max.id).toBe('agent-02');
      expect(max.name).toContain('Max');
      expect(max.persoenlichkeit).toBe('energisch');
    });

    it('each agent has required fields', () => {
      for (const agent of mockAgents) {
        expect(agent.id).toBeTruthy();
        expect(agent.name).toBeTruthy();
        expect(agent.sprache).toBe('de-DE');
        expect(agent.geschwindigkeit).toBeGreaterThanOrEqual(0.5);
        expect(agent.geschwindigkeit).toBeLessThanOrEqual(2.0);
        expect(agent.temperatur).toBeGreaterThan(0);
        expect(agent.temperatur).toBeLessThanOrEqual(1);
        expect(agent.arbeitszeiten.start).toMatch(/^\d{2}:\d{2}$/);
        expect(agent.arbeitszeiten.ende).toMatch(/^\d{2}:\d{2}$/);
        expect(agent.arbeitszeiten.wochentage.length).toBeGreaterThan(0);
        expect(agent.skriptIds.length).toBeGreaterThan(0);
        expect(agent.niches.length).toBeGreaterThan(0);
      }
    });

    it('agents have different speeds', () => {
      expect(mockAgents[0].geschwindigkeit).not.toBe(mockAgents[1].geschwindigkeit);
    });

    it('Anna has broader work hours than Max (Max includes Saturday)', () => {
      expect(mockAgents[1].arbeitszeiten.wochentage).toContain(6); // Saturday
      expect(mockAgents[0].arbeitszeiten.wochentage).not.toContain(6);
    });
  });

  describe('mockLeads', () => {
    it('has 8 leads', () => {
      expect(mockLeads).toHaveLength(8);
    });

    it('each lead has required fields', () => {
      for (const lead of mockLeads) {
        expect(lead.id).toBeTruthy();
        expect(lead.vorname).toBeTruthy();
        expect(lead.nachname).toBeTruthy();
        expect(lead.plz).toBeTruthy();
        expect(lead.ort).toBeTruthy();
        expect(lead.erstelltAm).toBeTruthy();
      }
    });

    it('has leads in different statuses', () => {
      const statuses = [...new Set(mockLeads.map((l) => l.status))];
      expect(statuses.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('mockCalls', () => {
    it('has 6 calls', () => {
      expect(mockCalls).toHaveLength(6);
    });

    it('first call has transcript', () => {
      expect(mockCalls[0].transkript.length).toBeGreaterThan(0);
    });

    it('each call has required fields', () => {
      for (const call of mockCalls) {
        expect(call.id).toBeTruthy();
        expect(call.leadId).toBeTruthy();
        expect(call.dauer).toBeGreaterThanOrEqual(0);
        expect(call.gestartetAm).toBeTruthy();
      }
    });
  });

  describe('mockAppointments', () => {
    it('has 3 appointments', () => {
      expect(mockAppointments).toHaveLength(3);
    });

    it('each appointment has required fields', () => {
      for (const apt of mockAppointments) {
        expect(apt.id).toBeTruthy();
        expect(apt.datum).toBeTruthy();
        expect(apt.uhrzeit).toBeTruthy();
        expect(apt.niche).toBeTruthy();
      }
    });
  });

  describe('mockAgentMetrics', () => {
    it('has all required metric fields', () => {
      expect(mockAgentMetrics.totalAnrufe).toBeGreaterThan(0);
      expect(mockAgentMetrics.verbundenRate).toBeGreaterThan(0);
      expect(mockAgentMetrics.terminQuote).toBeGreaterThan(0);
      expect(mockAgentMetrics.abschlussRate).toBeGreaterThan(0);
      expect(mockAgentMetrics.umsatzMonat).toBeGreaterThan(0);
      expect(mockAgentMetrics.topNiche).toBeTruthy();
      expect(mockAgentMetrics.trends).toHaveProperty('anrufe');
      expect(mockAgentMetrics.trends).toHaveProperty('termine');
      expect(mockAgentMetrics.trends).toHaveProperty('abschluesse');
    });
  });

  describe('mockDailyMetrics', () => {
    it('has 30 days of data', () => {
      expect(mockDailyMetrics).toHaveLength(30);
    });

    it('each day has required fields', () => {
      for (const day of mockDailyMetrics) {
        expect(day.datum).toBeTruthy();
        expect(day.anrufe).toBeGreaterThan(0);
        expect(day.verbunden).toBeGreaterThan(0);
        expect(day.verbunden).toBeLessThanOrEqual(day.anrufe);
      }
    });
  });
});
