import { describe, it, expect } from 'vitest';
import type {
  Lead,
  Call,
  CallTranscript,
  AgentConfig,
  SalesScript,
  ScriptSection,
  Objection,
  NicheConfig,
  DailyMetric,
  AgentMetrics,
  Appointment,
  Niche,
  LeadStatus,
  LeadSource,
  HeatingType,
  BuildingType,
  CallStatus,
  CallOutcome,
  AgentPersoenlichkeit,
  ScriptPhase,
} from '@/types';

describe('types', () => {
  it('AgentConfig accepts valid agent data', () => {
    const agent: AgentConfig = {
      id: 'test-01',
      name: 'Test Agent',
      beschreibung: 'Test description',
      persoenlichkeit: 'beratend',
      sprache: 'de-DE',
      stimme: 'Marlene',
      geschwindigkeit: 1.0,
      temperatur: 0.7,
      aktiv: true,
      maxAnrufeProTag: 80,
      arbeitszeiten: { start: '09:00', ende: '18:00', wochentage: [1, 2, 3, 4, 5] },
      skriptIds: ['script-01'],
      niches: ['waermepumpe'],
      erstelltAm: '2024-01-01',
    };
    expect(agent.id).toBe('test-01');
    expect(agent.sprache).toBe('de-DE');
  });

  it('Lead accepts valid lead data', () => {
    const lead: Lead = {
      id: 'lead-01',
      vorname: 'Thomas',
      nachname: 'Mueller',
      telefon: '+49 89 1234567',
      plz: '80331',
      ort: 'Muenchen',
      status: 'neu',
      quelle: 'kaltakquise',
      heizungsart: 'gasheizung',
      gebaeudeart: 'einfamilienhaus',
      erstelltAm: '2024-06-01',
      aktualisiertAm: '2024-06-01',
    };
    expect(lead.status).toBe('neu');
  });

  it('SalesScript accepts valid script data', () => {
    const script: SalesScript = {
      id: 'script-01',
      name: 'Test Script',
      niche: 'waermepumpe',
      beschreibung: 'Test',
      version: '1.0',
      aktiv: true,
      abschnitte: [],
      einwaende: [],
      erstelltAm: '2024-01-01',
      aktualisiertAm: '2024-01-01',
    };
    expect(script.niche).toBe('waermepumpe');
  });

  it('Niche type accepts all valid niche IDs', () => {
    const niches: Niche[] = [
      'gasheizung', 'waermepumpe', 'klimaanlage', 'solarthermie',
      'pelletsheizung', 'brennwerttechnik', 'hybridheizung', 'fussbodenheizung',
      'sanitaer', 'badrenovierung',
    ];
    expect(niches).toHaveLength(10);
  });

  it('LeadStatus accepts all valid statuses', () => {
    const statuses: LeadStatus[] = [
      'neu', 'kontaktiert', 'interessiert', 'termin_gebucht',
      'angebot_gesendet', 'gewonnen', 'verloren',
    ];
    expect(statuses).toHaveLength(7);
  });

  it('AgentPersoenlichkeit accepts all valid personalities', () => {
    const personalities: AgentPersoenlichkeit[] = ['beratend', 'vertrauensvoll', 'energisch', 'ruhig'];
    expect(personalities).toHaveLength(4);
  });

  it('ScriptPhase accepts all valid phases', () => {
    const phases: ScriptPhase[] = [
      'begruessung', 'bedarfsanalyse', 'praesentation',
      'einwandbehandlung', 'abschluss', 'verabschiedung',
    ];
    expect(phases).toHaveLength(6);
  });

  it('Call accepts valid call data', () => {
    const call: Call = {
      id: 'call-01',
      leadId: 'lead-01',
      leadName: 'Thomas Mueller',
      status: 'abgeschlossen',
      ergebnis: 'termin_gebucht',
      dauer: 485,
      gestartetAm: '2024-06-05T14:30:00',
      beendetAm: '2024-06-05T14:38:05',
      skriptId: 'script-01',
      stimmung: 'positiv',
      transkript: [],
    };
    expect(call.dauer).toBe(485);
  });

  it('Appointment accepts valid appointment data', () => {
    const apt: Appointment = {
      id: 'apt-01',
      leadId: 'lead-01',
      leadName: 'Thomas Mueller',
      datum: '2024-06-12',
      uhrzeit: '10:00',
      dauer: 60,
      ort: 'Muenchen',
      niche: 'waermepumpe',
      status: 'bestaetigt',
    };
    expect(apt.dauer).toBe(60);
  });
});
