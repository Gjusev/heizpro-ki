import type { IncomingMessage, ServerResponse } from 'http';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// ============================================
// Speech Engine – Conversation Logic
// Manages per-session state and delegates
// response generation to the script engine
// ============================================

interface ConversationState {
  messages: { role: 'agent' | 'user'; content: string; timestamp: string }[];
  niche: string;
  scriptId: string;
  currentPhase: string;
  startedAt: Date;
}

const sessions = new Map<string, ConversationState>();

const PHASE_ORDER = ['begruessung', 'bedarfsanalyse', 'praesentation', 'einwandbehandlung', 'abschluss', 'verabschiedung'];

// --- Phase Detection ---
function detectPhase(userMessage: string, currentPhase: string): string {
  const lower = userMessage.toLowerCase();
  const positiveSignals = ['ja', 'gerne', 'interessiert', 'gut', 'super', 'okay', 'richtig', 'genau', 'stimmt', 'natürlich', 'klar', 'sicher', 'warum nicht', 'zeigt mir', 'erzählen sie', 'mehr darüber', 'termin', 'angebot', 'beratung'];
  const objectionSignals = ['teuer', 'zu viel', 'nicht', 'nein', 'kein interesse', 'bedenken', 'zweifel', 'anderes mal', 'warten', 'überlegen', 'laut', 'funktioniert nicht'];
  const closingSignals = ['termin', 'vereinbaren', 'angebot', 'klingt gut', 'weiter', 'machen wir', 'abschließen', 'unterschreiben', 'wann', 'passt'];
  const endSignals = ['tschüss', 'auf wiedersehen', 'danke', 'bis dann', 'fertig', 'ende'];

  if (endSignals.some((s) => lower.includes(s))) return 'verabschiedung';
  if (closingSignals.some((s) => lower.includes(s)) && currentPhase !== 'verabschiedung') return 'abschluss';
  if (objectionSignals.some((s) => lower.includes(s)) && !['einwandbehandlung', 'verabschiedung'].includes(currentPhase)) return 'einwandbehandlung';
  if (positiveSignals.some((s) => lower.includes(s))) {
    const idx = PHASE_ORDER.indexOf(currentPhase);
    if (idx < PHASE_ORDER.length - 1) {
      const next = PHASE_ORDER[idx + 1];
      if (next === 'einwandbehandlung') return 'abschluss';
      return next;
    }
  }
  return currentPhase;
}

function detectObjectionCategory(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes('teuer') || l.includes('kosten') || l.includes('preis')) return 'Kosten';
  if (l.includes('leistung') || l.includes('heizt nicht') || l.includes('kalt')) return 'Leistung';
  if (l.includes('isoliert') || l.includes('altbau') || l.includes('dämmung')) return 'Gebäude';
  if (l.includes('warten') || l.includes('später') || l.includes('überlegen')) return 'Zeitpunkt';
  if (l.includes('laut') || l.includes('geräusch') || l.includes('lärm')) return 'Lärm';
  if (l.includes('gesund') || l.includes('luft') || l.includes('zugluft')) return 'Gesundheit';
  return 'Allgemein';
}

// --- Sales script data (inlined for Speech Engine standalone server) ---
interface ScriptSection {
  phase: string;
  headline: string;
  haupttext: string;
  varianten: string[];
}

interface Objection {
  kategorie: string;
  einwand: string;
  antworten: string[];
}

interface SalesScriptData {
  id: string;
  niche: string;
  name: string;
  abschnitte: ScriptSection[];
  einwaende: Objection[];
}

const SCRIPTS: SalesScriptData[] = [
  {
    id: 'waermepumpe-standard',
    niche: 'waermepumpe',
    name: 'Wärmepumpe Standard',
    abschnitte: [
      { phase: 'begruessung', headline: 'Begrüßung', haupttext: 'Guten Tag! Mein Name ist Anna von HeizPro. Ich rufe an, weil wir aktuell attraktive Fördermöglichkeiten für moderne Wärmepumpen in Ihrer Region anbieten. Haben Sie einen Moment Zeit?', varianten: ['Guten Tag! Hier ist Anna von HeizPro. Wir helfen Hausbesitzern wie Ihnen beim Energiesparen. Dürfen ich Ihnen kurz unsere Wärmepumpen-Lösung vorstellen?'] },
      { phase: 'bedarfsanalyse', headline: 'Bedarfsanalyse', haupttext: 'Erzählen Sie mir kurz: Wie alt ist Ihre aktuelle Heizung? Und wie hoch sind Ihre jährlichen Heizkosten ungefähr?', varianten: ['Damit ich Ihnen das passende Angebot machen kann: Wann wurde Ihre Heizung zuletzt ausgetauscht? Und wie groß ist Ihre Wohnfläche?'] },
      { phase: 'praesentation', headline: 'Präsentation', haupttext: 'Basierend auf Ihren Angaben empfehle ich unsere Luft-Wasser-Wärmepumpe. Sie reduziert Ihre Heizkosten um bis zu 50% und ist mit bis zu 40% KfW-Förderung besonders attraktiv. Die Installation dauert nur 2-3 Tage.', varianten: ['Ideal für Ihr Gebäude wäre unsere Hocheffizienz-Wärmepumpe. Bei einer Förderung von bis zu 40% amortisiert sich die Investition in nur 5-7 Jahren.'] },
      { phase: 'einwandbehandlung', headline: 'Einwandbehandlung', haupttext: 'Das verstehe ich vollkommen. Lassen Sie uns das gemeinsam betrachten.', varianten: [] },
      { phase: 'abschluss', headline: 'Abschluss', haupttext: 'Wie wäre es, wenn wir für nächste Woche einen unverbindlichen Beratungstermin bei Ihnen vor Ort vereinbaren? Unser Experte kann sich Ihre Situation genau ansehen und Ihnen ein maßgeschneidertes Angebot erstellen.', varianten: ['Sollen wir direkt einen Termin für die kostenlose Erstberatung festlegen? Unser Fachberater kommt zu Ihnen nach Hause.'] },
      { phase: 'verabschiedung', headline: 'Verabschiedung', haupttext: 'Vielen Dank für Ihr Interesse! Sie erhalten in Kürze eine Bestätigungsmail. Unser Berater meldet sich rechtzeitig vor dem Termin. Ich wünsche Ihnen noch einen schönen Tag!', varianten: [] },
    ],
    einwaende: [
      { kategorie: 'Kosten', einwand: 'Zu teuer', antworten: ['Die Anschaffungskosten sind natürlich ein Punkt, aber mit der KfW-Förderung von bis zu 40% und den monatlichen Einsparungen von 50% bei den Heizkosten amortisiert sich die Investition in wenigen Jahren.', 'Ich verstehe Ihre Bedenken. Rechnen wir zusammen: Bei einer Förderung von 7.200€ und monatlichen Einsparungen von 150-200€ trägt sich die Anlage in 5-7 Jahren.'] },
      { kategorie: 'Leistung', einwand: 'Heizt nicht genug', antworten: ['Moderne Wärmepumpen arbeiten selbst bei -20°C zuverlässig. Unsere Modelle sind speziell für das deutsche Klima entwickelt und liefern auch an kalten Wintertagen volle Leistung.'] },
      { kategorie: 'Gebäude', einwand: 'Geeignet für Altbau?', antworten: ['Gerade im Altbau zeigen Wärmepumpen ihre Stärken! In Kombination mit einer guten Dämmung erreichen Sie optimale Effizienz. Wir bieten auch eine kostenlose Energieberatung an.'] },
      { kategorie: 'Lärm', einwand: 'Zu laut', antworten: ['Unsere neuesten Modelle arbeiten mit nur 35-40 dB — das entspricht leiser Bibliotheksatmosphäre. Auch nachts haben Sie keine Belästigung.'] },
      { kategorie: 'Gesetzgebung', einwand: 'Pflicht ab 2024?', antworten: ['Ja, seit 2024 gilt das Gebäudeenergiegesetz. Wenn Sie Ihre alte Heizung ersetzen müssen, ist eine Wärmepumpe die zukunftssicherste Wahl — und mit Förderung sogar die wirtschaftlichste.'] },
    ],
  },
  {
    id: 'klimaanlage-standard',
    niche: 'klimaanlage',
    name: 'Klimaanlage Standard',
    abschnitte: [
      { phase: 'begruessung', headline: 'Begrüßung', haupttext: 'Guten Tag! Mein Name ist Anna von HeizPro. Ich rufe an, weil wir professionelle Klimaanlagen-Lösungen anbieten — besonders wichtig für die kommenden Sommermonate. Haben Sie einen Moment?', varianten: [] },
      { phase: 'bedarfsanalyse', headline: 'Bedarfsanalyse', haupttext: 'Wie groß ist der Raum, den Sie klimatisieren möchten? Und nutzen Sie ihn hauptsächlich tagsüber oder abends?', varianten: [] },
      { phase: 'praesentation', headline: 'Präsentation', haupttext: 'Für Ihre Anforderungen empfehle ich unsere Split-Klimaanlage mit Inverter-Technologie. Sie kühlt, heizt und filtert die Luft — geräuscharm und energieeffizient.', varianten: [] },
      { phase: 'abschluss', headline: 'Abschluss', haupttext: 'Möchten Sie einen Termin für die kostenlose Beratung und ein maßgeschneidertes Angebot vereinbaren?', varianten: [] },
      { phase: 'verabschiedung', headline: 'Verabschiedung', haupttext: 'Vielen Dank für Ihr Interesse! Unser Berater wird sich wie vereinbart melden. Einen schönen Tag noch!', varianten: [] },
    ],
    einwaende: [
      { kategorie: 'Kosten', einwand: 'Zu teuer', antworten: ['Eine gute Klimaanlage ist eine Investition in Ihren Komfort. Mit der Inverter-Technologie sind die laufenden Kosten überraschend niedrig — oft nur 30-50 Cent pro Stunde.'] },
      { kategorie: 'Lärm', einwand: 'Zu laut', antworten: ['Unsere Geräte arbeiten mit nur 19-24 dB im Leisemodus — leiser als ein Flüstern. Ideal für Schlafzimmer und Büros.'] },
    ],
  },
  {
    id: 'gasheizung-standard',
    niche: 'gasheizung',
    name: 'Gasheizung Standard',
    abschnitte: [
      { phase: 'begruessung', headline: 'Begrüßung', haupttext: 'Guten Tag! Mein Name ist Anna von HeizPro. Wir beraten Hausbesitzer zum Thema moderne Heiztechnik. Dürfen ich Ihnen kurz unsere Angebote vorstellen?', varianten: [] },
      { phase: 'bedarfsanalyse', headline: 'Bedarfsanalyse', haupttext: 'Wie alt ist Ihre aktuelle Gasheizung? Und haben Sie in letzter Zeit steigende Gaspreise bemerkt?', varianten: [] },
      { phase: 'praesentation', headline: 'Präsentation', haupttext: 'Unsere Brennwert-Technologie nutzt die Abwärme optimal und spart bis zu 30% Gaskosten. Die Umrüstung ist unkompliziert und in der Regel an einem Tag erledigt.', varianten: [] },
      { phase: 'abschluss', headline: 'Abschluss', haupttext: 'Sollen wir einen Beratungstermin vereinbaren? Unser Fachmann prüft vor Ort, welche Lösung am besten zu Ihrem Haus passt.', varianten: [] },
      { phase: 'verabschiedung', headline: 'Verabschiedung', haupttext: 'Vielen Dank für das Gespräch! Sie hören in Kürze von uns. Einen schönen Tag noch!', varianten: [] },
    ],
    einwaende: [
      { kategorie: 'Kosten', einwand: 'Lohnt sich das?', antworten: ['Bei einer 15 Jahre alten Heizung amortisiert sich die neue Brennwertheizung in 4-6 Jahren. Danach sparen Sie jedes Jahr bares Geld.'] },
    ],
  },
];

const DEFAULT_NICHE = 'waermepumpe';

function getScript(niche: string): SalesScriptData {
  return SCRIPTS.find((s) => s.niche === niche) || SCRIPTS[0];
}

// --- Generate Response ---
function generateResponse(conversationId: string, userText: string): { text: string; phase: string } {
  let state = sessions.get(conversationId);

  if (!state) {
    state = {
      messages: [],
      niche: DEFAULT_NICHE,
      scriptId: 'waermepumpe-standard',
      currentPhase: 'begruessung',
      startedAt: new Date(),
    };
    sessions.set(conversationId, state);
  }

  const script = getScript(state.niche);

  // First message: greeting
  if (state.messages.length === 0 && !userText) {
    const section = script.abschnitte.find((s) => s.phase === 'begruessung');
    const greeting = section
      ? section.haupttext.replace('[Agent-Name]', 'Anna').replace('[Firma]', 'HeizPro').replace('[Ort]', 'Ihrer Region')
      : 'Guten Tag! Mein Name ist Anna von HeizPro. Wie kann ich Ihnen heute helfen?';

    state.messages.push({ role: 'agent', content: greeting, timestamp: new Date().toISOString() });
    return { text: greeting, phase: 'begruessung' };
  }

  // Add user message
  state.messages.push({ role: 'user', content: userText, timestamp: new Date().toISOString() });

  // Detect phase
  const newPhase = detectPhase(userText, state.currentPhase);
  state.currentPhase = newPhase;

  let responseText = '';

  if (newPhase === 'einwandbehandlung') {
    const kategorie = detectObjectionCategory(userText);
    const objection = script.einwaende.find((e) => e.kategorie === kategorie);
    responseText = objection
      ? objection.antworten[Math.floor(Math.random() * objection.antworten.length)]
      : 'Das verstehe ich vollkommen. Lassen Sie uns das im Beratungsgespräch genauer klären.';
  } else {
    const section = script.abschnitte.find((s) => s.phase === newPhase);
    if (section) {
      const templates = [section.haupttext, ...section.varianten];
      responseText = templates[Math.floor(Math.random() * templates.length)]
        .replace(/\[Agent-Name\]/g, 'Anna')
        .replace(/\[Firma\]/g, 'HeizPro')
        .replace(/\[Ort\]/g, 'Ihrer Region');
    } else {
      responseText = 'Vielen Dank für Ihre Zeit! Gibt es noch etwas, das ich für Sie klären kann?';
      state.currentPhase = 'verabschiedung';
    }
  }

  // Contextual additions
  const lower = userText.toLowerCase();
  if (lower.includes('förderung') || lower.includes('kfw') || lower.includes('zuschuss')) {
    responseText += ' Die KfW fördert aktuell mit bis zu 40% der Kosten. Das sind bei einer Wärmepumpe bis zu 7.200€ Einsparung!';
  }

  state.messages.push({ role: 'agent', content: responseText, timestamp: new Date().toISOString() });
  return { text: responseText, phase: state.currentPhase };
}

// --- Session management ---
export function getSession(conversationId: string): ConversationState | undefined {
  return sessions.get(conversationId);
}

export function clearSession(conversationId: string): void {
  sessions.delete(conversationId);
}

export { generateResponse, sessions };
export type { ConversationState };
