import { NextRequest, NextResponse } from 'next/server';
import { salesScripts, nicheConfigs } from '@/lib/sales-scripts';

interface ChatMessage {
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  niche: string;
  scriptId: string;
  currentPhase: string;
  leadName?: string;
}

// ============================================
// Phasen-Logik: bestimmt die nächste Phase
// basierend auf dem Gesprächsverlauf
// ============================================
const PHASE_ORDER = ['begruessung', 'bedarfsanalyse', 'praesentation', 'einwandbehandlung', 'abschluss', 'verabschiedung'];

function detectPhase(userMessage: string, currentPhase: string): string {
  const lower = userMessage.toLowerCase();

  // Positive Signale → nächste Phase
  const positiveSignals = ['ja', 'gerne', 'interessiert', 'gut', 'super', 'okay', 'richtig', 'genau', 'stimmt', 'natürlich', 'klar', 'sicher', 'warum nicht', 'zeigt mir', 'erzählen sie', 'mehr darüber', 'termin', 'angebot', 'beratung'];
  const objectionSignals = ['teuer', 'zu viel', 'nicht', 'nein', 'kein interesse', 'bedenken', 'zweifel', 'anderes mal', 'warten', 'überlegen', 'laut', 'unverständlich', 'funktioniert nicht', 'ungeeignet', 'schlecht'];
  const closingSignals = ['termin', 'vereinbaren', 'angebot', 'klingt gut', 'weiter', 'machen wir', 'abschließen', 'unterschreiben', 'wann', 'passt'];
  const endSignals = ['tschüss', 'auf wiedersehen', 'danke', 'bis dann', 'fertig', 'ende'];

  if (endSignals.some((s) => lower.includes(s))) return 'verabschiedung';
  if (closingSignals.some((s) => lower.includes(s)) && currentPhase !== 'verabschiedung') return 'abschluss';
  if (objectionSignals.some((s) => lower.includes(s)) && !['einwandbehandlung', 'verabschiedung'].includes(currentPhase)) return 'einwandbehandlung';
  if (positiveSignals.some((s) => lower.includes(s))) {
    const currentIdx = PHASE_ORDER.indexOf(currentPhase);
    if (currentIdx < PHASE_ORDER.length - 1) {
      const next = PHASE_ORDER[currentIdx + 1];
      // Einwandbehandlung überspringen wenn nicht relevant
      if (next === 'einwandbehandlung') return 'abschluss';
      return next;
    }
  }

  return currentPhase;
}

function detectObjectionCategory(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('teuer') || lower.includes('kosten') || lower.includes('preis') || lower.includes('bezahl')) return 'Kosten';
  if (lower.includes('leistung') || lower.includes('heizt nicht') || lower.includes('kalt') || lower.includes('stark genug')) return 'Leistung';
  if (lower.includes('isoliert') || lower.includes('altbau') || lower.includes('dämmung') || lower.includes('haus')) return 'Gebäude';
  if (lower.includes('warten') || lower.includes('später') || lower.includes('zeitpunkt') || lower.includes('überlegen')) return 'Zeitpunkt';
  if (lower.includes('laut') || lower.includes('geräusch') || lower.includes('lärm')) return 'Lärm';
  if (lower.includes('gesund') || lower.includes('krank') || lower.includes('luft') || lower.includes('zugluft')) return 'Gesundheit';
  if (lower.includes('gesetz') || lower.includes('pflicht') || lower.includes('vorschrift')) return 'Gesetzgebung';
  return 'Allgemein';
}

function getObjectionResponse(niche: string, kategorie: string): string {
  const script = salesScripts.find((s) => s.niche === niche);
  if (!script) return 'Das verstehe ich vollkommen. Lassen Sie uns das im Beratungsgespräch genauer klären.';
  const objection = script.einwaende.find((e) => e.kategorie === kategorie);
  if (!objection) {
    const any = script.einwaende[0];
    return any ? any.antworten[0] : 'Das ist ein berechtigter Punkt. Gerne können wir das in einem persönlichen Gespräch vertiefen.';
  }
  return objection.antworten[Math.floor(Math.random() * objection.antworten.length)];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, niche, scriptId, currentPhase, leadName } = body;

    const script = salesScripts.find((s) => s.id === scriptId) || salesScripts.find((s) => s.niche === niche);
    if (!script) {
      return NextResponse.json({ error: 'Skript nicht gefunden' }, { status: 400 });
    }

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    let newPhase = currentPhase;

    // Erste Nachricht: Begrüßung
    if (messages.length === 0) {
      newPhase = 'begruessung';
      const section = script.abschnitte.find((s) => s.phase === 'begruessung');
      const greeting = section
        ? section.haupttext.replace('[Agent-Name]', 'Anna').replace('[Firma]', 'HeizPro').replace('[Ort]', 'Ihrer Region')
        : 'Guten Tag! Mein Name ist Anna von HeizPro. Wie kann ich Ihnen heute helfen?';

      return NextResponse.json({
        message: greeting,
        phase: newPhase,
        phaseLabel: 'Begrüßung',
        nextPhases: PHASE_ORDER,
        suggestions: ['Ja, ich höre zu', 'Guten Tag!', 'Was bieten Sie an?'],
      });
    }

    // Phasen-Erkennung basierend auf User-Antwort
    if (lastUserMessage) {
      newPhase = detectPhase(lastUserMessage.content, currentPhase);
    }

    let responseText = '';

    // Einwandbehandlung
    if (newPhase === 'einwandbehandlung') {
      const kategorie = lastUserMessage ? detectObjectionCategory(lastUserMessage.content) : 'Allgemein';
      responseText = getObjectionResponse(niche, kategorie);
    } else {
      // Normale Phasen-Antwort
      const section = script.abschnitte.find((s) => s.phase === newPhase);
      if (section) {
        const templates = [section.haupttext, ...section.varianten];
        const template = templates[Math.floor(Math.random() * templates.length)];
        responseText = template
          .replace(/\[Agent-Name\]/g, 'Anna')
          .replace(/\[Firma\]/g, 'HeizPro')
          .replace(/\[Ort\]/g, 'Ihrer Region')
          .replace(/\[Name\]/g, leadName || 'Herr/Frau')
          .replace(/\[Tag\]/g, 'Donnerstag')
          .replace(/\[Uhrzeit\]/g, '15:00');
      } else {
        responseText = 'Vielen Dank für Ihre Zeit! Gibt es noch etwas, das ich für Sie klären kann?';
        newPhase = 'verabschiedung';
      }
    }

    // Kontextuelle Anpassungen basierend auf User-Nachricht
    if (lastUserMessage) {
      const lower = lastUserMessage.content.toLowerCase();

      // Wenn User nach Förderung fragt
      if (lower.includes('förderung') || lower.includes('kfW') || lower.includes('zuschuss')) {
        responseText += ' Übrigens: Die KfW fördert aktuell mit bis zu 40% der Kosten. Das sind bei einer Wärmepumpe bis zu 7.200€ Einsparung!';
      }

      // Wenn User nach Kosten fragt
      if (lower.includes('was kostet') || lower.includes('wie teuer') || lower.includes('preis')) {
        const nicheConfig = nicheConfigs.find((n) => n.id === niche);
        if (nicheConfig) {
          responseText += ` Die Investition liegt je nach Ausführung bei ca. ${nicheConfig.durchschnittlicherAuftragswert.toLocaleString('de-DE')}€ – inklusive Installation.`;
        }
      }
    }

    // Vorschläge für die nächste Antwort
    const suggestions = getSuggestions(newPhase);

    return NextResponse.json({
      message: responseText,
      phase: newPhase,
      phaseLabel: PHASE_ORDER.indexOf(newPhase) >= 0
        ? ['Begrüßung', 'Bedarfsanalyse', 'Präsentation', 'Einwandbehandlung', 'Abschluss', 'Verabschiedung'][PHASE_ORDER.indexOf(newPhase)]
        : newPhase,
      nextPhases: PHASE_ORDER,
      suggestions,
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Gesprächsverarbeitung', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

function getSuggestions(phase: string): string[] {
  switch (phase) {
    case 'begruessung':
      return ['Ja, ich habe eine alte Heizung', 'Was bieten Sie an?', 'Ich bin nicht interessiert'];
    case 'bedarfsanalyse':
      return ['Meine Heizung ist von 1998', 'Ich habe eine Gasheizung', 'Die Heizkosten sind sehr hoch', 'Wie alt ist zu alt?'];
    case 'praesentation':
      return ['Wie viel kostet das?', 'Gibt es Förderung?', 'Klingt interessant, erzählen Sie mehr', ' Funktioniert das auch im Altbau?'];
    case 'einwandbehandlung':
      return ['Das überzeugt mich', 'Ich möchte trotzdem warten', 'Lassen Sie mich überlegen', 'Gibt es Alternativen?'];
    case 'abschluss':
      return ['Termin am Donnerstag passt', 'Können Sie nächste Woche?', 'Senden Sie mir ein Angebot', 'Ich brauche noch Bedenkzeit'];
    case 'verabschiedung':
      return ['Vielen Dank!', 'Ich freue mich auf den Termin', 'Auf Wiedersehen!'];
    default:
      return ['Interessant', 'Erzählen Sie mehr', 'Was kostet das?'];
  }
}
