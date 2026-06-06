// ============================================
// Heizungs-KI Vertriebsagent - Types & Models
// ============================================

// --- Lead Management ---
export type LeadStatus = 'neu' | 'kontaktiert' | 'interessiert' | 'termin_gebucht' | 'angebot_gesendet' | 'gewonnen' | 'verloren';
export type LeadSource = 'kaltakquise' | 'website' | 'empfehlung' | 'werbung' | 'wiedervorlage';
export type HeatingType = 'gasheizung' | 'oelheizung' | 'waermepumpe' | 'fernwaerme' | 'pellets' | 'solarthermie' | 'klimaanlage' | 'unbekannt';
export type BuildingType = 'einfamilienhaus' | 'mehrfamilienhaus' | 'gewerbe' | 'altbau' | 'neubau';

export interface Lead {
  id: string;
  vorname: string;
  nachname: string;
  telefon: string;
  email?: string;
  adresse?: string;
  plz: string;
  ort: string;
  status: LeadStatus;
  quelle: LeadSource;
  heizungsart: HeatingType;
  gebaeudeart: BuildingType;
  wohnflaeche?: number;
  baujahr?: number;
  notizen?: string;
  letzterKontakt?: string;
  naechsterTermin?: string;
  erstelltAm: string;
  aktualisiertAm: string;
}

// --- Call Management ---
export type CallStatus = 'geplant' | 'laeuft' | 'abgeschlossen' | 'abgebrochen' | 'keine_antwort' | 'besetzt';
export type CallOutcome = 'termin_gebucht' | 'interesse' | 'kein_interesse' | 'rueckruf' | 'nicht_erreicht' | 'widerspruch';

export interface CallTranscript {
  id: string;
  callId: string;
  abschnitt: 'begruessung' | 'bedarfsanalyse' | 'praesentation' | 'einwandbehandlung' | 'abschluss' | 'verabschiedung';
  sprecher: 'agent' | 'kunde';
  text: string;
  zeitstempel: string;
}

export interface Call {
  id: string;
  leadId: string;
  leadName: string;
  status: CallStatus;
  ergebnis?: CallOutcome;
  dauer: number; // in Sekunden
  gestartetAm: string;
  beendetAm?: string;
  skriptId: string;
  stimmung?: 'positiv' | 'neutral' | 'negativ';
  transkript: CallTranscript[];
  zusammenfassung?: string;
  terminGebucht?: boolean;
  terminDatum?: string;
  notizen?: string;
}

// --- Agent Configuration ---
export type AgentPersoenlichkeit = 'beratend' | 'vertrauensvoll' | 'energisch' | 'ruhig';

export interface AgentConfig {
  id: string;
  name: string;
  beschreibung: string;
  persoenlichkeit: AgentPersoenlichkeit;
  sprache: 'de-DE';
  stimme: string; // Voice ID from provider
  geschwindigkeit: number; // 0.5 - 2.0
  temperatur: number; // 0.0 - 1.0
  aktiv: boolean;
  maxAnrufeProTag: number;
  arbeitszeiten: {
    start: string; // HH:mm
    ende: string;
    wochentage: number[]; // 0-6, 0=Sonntag
  };
  skriptIds: string[];
  niches: Niche[];
  erstelltAm: string;
}

// --- Sales Scripts ---
export type ScriptPhase = 'begruessung' | 'bedarfsanalyse' | 'praesentation' | 'einwandbehandlung' | 'abschluss' | 'verabschiedung';

export interface ScriptSection {
  phase: ScriptPhase;
  headline: string;
  haupttext: string;
  varianten: string[];
  triggers: string[]; // Keywords die diese Phase ausloesen
}

export interface Objection {
  id: string;
  kategorie: string;
  einwand: string;
  antworten: string[];
}

export interface SalesScript {
  id: string;
  name: string;
  niche: Niche;
  beschreibung: string;
  version: string;
  aktiv: boolean;
  abschnitte: ScriptSection[];
  einwaende: Objection[];
  erstelltAm: string;
  aktualisiertAm: string;
}

// --- Niche Configuration ---
export type Niche =
  | 'gasheizung'
  | 'waermepumpe'
  | 'klimaanlage'
  | 'solarthermie'
  | 'pelletsheizung'
  | 'brennwerttechnik'
  | 'hybridheizung'
  | 'fussbodenheizung'
  | 'sanitaer'
  | 'badrenovierung';

export interface NicheConfig {
  id: Niche;
  name: string;
  beschreibung: string;
  zielgruppe: string;
  saisonaleRelevanz: number[]; // Monate 1-12, Gewichtung
  durchschnittlicherAuftragswert: number;
  conversionRate: number;
  farbcode: string;
}

// --- Analytics ---
export interface DailyMetric {
  datum: string;
  anrufe: number;
  verbunden: number;
  termine: number;
  abschluesse: number;
  dauerDurchschnitt: number;
}

export interface AgentMetrics {
  totalAnrufe: number;
  verbundenRate: number;
  terminQuote: number;
  abschlussRate: number;
  durchschnittlicheDauer: number;
  umsatzMonat: number;
  topNiche: Niche;
  trends: {
    anrufe: number; // % change
    termine: number;
    abschluesse: number;
  };
}

// --- Appointment ---
export interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  datum: string;
  uhrzeit: string;
  dauer: number; // Minuten
  ort: string;
  niche: Niche;
  status: 'geplant' | 'bestaetigt' | 'durchgefuehrt' | 'storniert';
  notizen?: string;
}
