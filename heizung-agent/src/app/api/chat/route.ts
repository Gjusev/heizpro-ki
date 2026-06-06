import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { salesScripts, nicheConfigs } from '@/lib/sales-scripts';

// ============================================
// Chat API – OpenAI-powered conversation engine
// Uses sales scripts as system prompt context,
// structured JSON output for phase tracking
// ============================================

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
  agentId?: string;
  agentName?: string;
  personality?: string;
}

const PHASE_ORDER = ['begruessung', 'bedarfsanalyse', 'praesentation', 'einwandbehandlung', 'abschluss', 'verabschiedung'];

const PHASE_LABELS: Record<string, string> = {
  begruessung: 'Begrüßung',
  bedarfsanalyse: 'Bedarfsanalyse',
  praesentation: 'Präsentation',
  einwandbehandlung: 'Einwandbehandlung',
  abschluss: 'Abschluss',
  verabschiedung: 'Verabschiedung',
};

// Personality-specific system prompt instructions
const PERSONALITY_PROMPTS: Record<string, string> = {
  beratend: `Du bist beratend und empathisch. Du hörst aktiv zu, stellst Verständnisfragen und gibst dem Kunden das Gefühl, ernst genommen zu werden. Du drängst nicht, sondern überzeugst durch Fachwissen und echte Hilfsbereitschaft.`,
  vertrauensvoll: `Du strahlst Vertrauen und Kompetenz aus. Du sprichst ruhig und sachlich, nennst konkrete Zahlen und Beispiele. Der Kunde fühlt sich bei dir in guten Händen. Du vermeidest Druck, baust aber eine starke Expertenwirkung auf.`,
  energisch: `Du bist dynamisch und überzeugend. Du sprichst direkt und zielorientiert, betonst Vorteile und Handlungsdruck. Du erzeugst ein Gefühl von Dringlichkeit ohne aggressiv zu wirken. Du führst das Gespräch aktiv und bringst es voran.`,
  ruhig: `Du bist gelassen und geduldig. Du gibst dem Kunde Zeit zum Denken, wiederholst wichtige Punkte sanft und gehst auf jedes Bedenken einfühlsam ein. Du schaffst eine entspannte Gesprächsatmosphäre.`,
};

// OpenAI client (lazy init)
let openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

// ============================================
// System Prompt Builder
// ============================================
function buildSystemPrompt(params: {
  script: typeof salesScripts[0];
  nicheConfig: typeof nicheConfigs[0] | undefined;
  personality: string;
  currentPhase: string;
  leadName?: string;
  agentName?: string;
}): string {
  const { script, nicheConfig, personality, currentPhase, leadName, agentName } = params;
  const displayName = agentName?.split('–')[0].trim() || 'Anna';

  const personalityInstruction = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.beratend;
  const currentSection = script.abschnitte.find((s) => s.phase === currentPhase);
  const nicheData = nicheConfig;

  // Build objection reference for the LLM
  const objectionRef = script.einwaende
    .map((e) => `  - "${e.kategorie}": ${e.antworten[0]}`)
    .join('\n');

  // Build all phase goals as context
  const phaseOverview = script.abschnitte
    .map((s) => `${s.phase}: ${s.headline}`)
    .join(' → ');

  // Current phase details
  const currentPhaseDetails = currentSection
    ? `Aktuelle Phase: "${currentSection.headline}"
Beispiel-Text für diese Phase: "${currentSection.haupttext.slice(0, 300)}"
${currentSection.varianten.length > 0 ? `Alternative Formulierung: "${currentSection.varianten[0].slice(0, 200)}"` : ''}`
    : '';

  return `Du bist ${displayName}, ein virtueller Verkaufsberater für HeizPro, ein Unternehmen für Heizungs- und Klimatechnik in Deutschland. Du führst ein Telefonat mit einem potentiellen Kunden.

# Deine Persönlichkeit
${personalityInstruction}

# Deine Rolle
- Du heißt ${displayName} — verwende IMMER diesen Namen, niemals Platzhalter wie [Agent-Name]
- Du sprichst immer auf Deutsch, natürlich und gesprächig wie am Telefon
- ${leadName ? `Der Kunde heißt ${leadName} — verwende den Namen wenn passend.` : 'Sprichst du höflich mit "Sie"'}
- Du bist Experte für ${nicheData?.name || script.niche}
- Dein Ziel: Einen unverbindlichen, kostenlosen Beratungstermin vereinbaren

# Gesprächsphasen (in dieser Reihenfolge)
${phaseOverview}

# ${currentPhaseDetails}

# Nischen-Informationen
${nicheData ? `- Produkt: ${nicheData.name}
- Beschreibung: ${nicheData.beschreibung}
- Zielgruppe: ${nicheData.zielgruppe}
- Durchschnittlicher Auftragswert: ${nicheData.durchschnittlicherAuftragswert.toLocaleString('de-DE')}€
- Typische Conversion-Rate: ${(nicheData.conversionRate * 100).toFixed(0)}%` : ''}

# Einwandbehandlung (nutze diese als Referenz bei Kundenbedenken)
${objectionRef}

# Wichtige Regeln
- Antworte IMMER auf Deutsch, kurz und natürlich (wie am Telefon, nicht wie ein Brief)
- Keine Aufzählungszeichen, keine Bulletpoints – du sprichst, du schreibst keinen Prospekt
- VERWENDE NIEMALS eckige Klammern-Platzhalter wie [Agent-Name], [Firma], [Ort], [Name] etc. — ersetze sie immer durch echte Werte
- Dein Name ist ${displayName}, deine Firma ist HeizPro
- Bleibe immer in deiner Rolle als Verkaufsberater
- Wenn der Kunde Fragen zu Kosten oder Förderung hat, gib konkrete Zahlen
- KfW-Förderung: bis zu 40% der Kosten, bei Wärmepumpen bis zu 7.200€
- Wenn der Kunde einwendet, gehe darauf ein und führe zurück zum Gespräch
- Jede Antwort soll das Gespräch voranbringen und auf einen Beratungstermin hinarbeiten
- Halte Antworten kurz: 1-3 Sätze, maximal 60 Wörter

# Ausgabe-Format
Du MUSST als JSON antworten mit genau diesen drei Feldern:
{
  "message": "Deine gesprochene Antwort (kurz, natürlich, deutsch)",
  "phase": "die aktuelle phase (eine von: ${PHASE_ORDER.join(', ')})",
  "suggestions": ["Vorschlag 1 für Kundenantwort", "Vorschlag 2", "Vorschlag 3"]
}

Die Phase wechselst du nur wenn der Kundeninhalt das rechtfertigt:
- Positive Signale (Interesse, Fragen) → nächste Phase
- Einwände (Bedenken, Preis, Zeit) → einwandbehandlung
- Terminwunsch oder Zustimmung → abschluss
- Verabschiedung → verabschiedung
Sonst bleibe in der aktuellen Phase.`;
}

// ============================================
// Fallback: Template-based responses (when no OpenAI key)
// ============================================
function templateResponse(body: ChatRequest): NextResponse {
  const { messages, niche, scriptId, currentPhase, leadName, agentName } = body;
  const displayName = agentName?.split('–')[0].trim() || 'Anna';
  const script = salesScripts.find((s) => s.id === scriptId) || salesScripts.find((s) => s.niche === niche);
  if (!script) {
    return NextResponse.json({ error: 'Skript nicht gefunden' }, { status: 400 });
  }

  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  let newPhase = currentPhase;

  if (messages.length === 0) {
    newPhase = 'begruessung';
    const section = script.abschnitte.find((s) => s.phase === 'begruessung');
    const greeting = section
      ? section.haupttext.replace('[Agent-Name]', displayName).replace('[Firma]', 'HeizPro').replace('[Ort]', 'Ihrer Region')
      : `Guten Tag! Mein Name ist ${displayName} von HeizPro. Wie kann ich Ihnen heute helfen?`;
    return NextResponse.json({
      message: greeting, phase: newPhase, phaseLabel: PHASE_LABELS[newPhase],
      nextPhases: PHASE_ORDER, suggestions: ['Ja, ich höre zu', 'Guten Tag!', 'Was bieten Sie an?'],
    });
  }

  if (lastUserMessage) {
    const lower = lastUserMessage.content.toLowerCase();
    const endSignals = ['tschüss', 'auf wiedersehen', 'danke', 'bis dann', 'fertig', 'ende'];
    const closingSignals = ['termin', 'vereinbaren', 'angebot', 'klingt gut', 'weiter', 'machen wir', 'abschließen', 'unterschreiben', 'wann', 'passt'];
    const objectionSignals = ['teuer', 'zu viel', 'nicht', 'nein', 'kein interesse', 'bedenken', 'zweifel', 'anderes mal', 'warten', 'überlegen', 'laut', 'unverständlich', 'funktioniert nicht', 'ungeeignet', 'schlecht'];
    const positiveSignals = ['ja', 'gerne', 'interessiert', 'gut', 'super', 'okay', 'richtig', 'genau', 'stimmt', 'natürlich', 'klar', 'sicher', 'warum nicht', 'zeigt mir', 'erzählen sie', 'mehr darüber', 'termin', 'angebot', 'beratung'];

    if (endSignals.some((s) => lower.includes(s))) newPhase = 'verabschiedung';
    else if (closingSignals.some((s) => lower.includes(s)) && currentPhase !== 'verabschiedung') newPhase = 'abschluss';
    else if (objectionSignals.some((s) => lower.includes(s)) && !['einwandbehandlung', 'verabschiedung'].includes(currentPhase)) newPhase = 'einwandbehandlung';
    else if (positiveSignals.some((s) => lower.includes(s))) {
      const idx = PHASE_ORDER.indexOf(currentPhase);
      if (idx < PHASE_ORDER.length - 1) {
        const next = PHASE_ORDER[idx + 1];
        newPhase = next === 'einwandbehandlung' ? 'abschluss' : next;
      }
    }
  }

  let responseText = '';
  if (newPhase === 'einwandbehandlung') {
    const lower = lastUserMessage?.content.toLowerCase() || '';
    let kategorie = 'Allgemein';
    if (lower.includes('teuer') || lower.includes('kosten') || lower.includes('preis')) kategorie = 'Kosten';
    else if (lower.includes('leistung') || lower.includes('heizt nicht') || lower.includes('kalt')) kategorie = 'Leistung';
    else if (lower.includes('isoliert') || lower.includes('altbau') || lower.includes('dämmung')) kategorie = 'Gebäude';
    else if (lower.includes('warten') || lower.includes('später') || lower.includes('überlegen')) kategorie = 'Zeitpunkt';
    else if (lower.includes('laut') || lower.includes('geräusch') || lower.includes('lärm')) kategorie = 'Lärm';
    const objection = script.einwaende.find((e) => e.kategorie === kategorie);
    responseText = objection ? objection.antworten[0] : 'Das verstehe ich vollkommen. Lassen Sie uns das im Beratungsgespräch genauer klären.';
  } else {
    const section = script.abschnitte.find((s) => s.phase === newPhase);
    if (section) {
      const templates = [section.haupttext, ...section.varianten];
      responseText = templates[Math.floor(Math.random() * templates.length)]
        .replace(/\[Agent-Name\]/g, displayName).replace(/\[Firma\]/g, 'HeizPro')
        .replace(/\[Ort\]/g, 'Ihrer Region').replace(/\[Name\]/g, leadName || 'Herr/Frau')
        .replace(/\[Tag\]/g, 'Donnerstag').replace(/\[Uhrzeit\]/g, '15:00');
    } else {
      responseText = 'Vielen Dank für Ihre Zeit! Gibt es noch etwas, das ich für Sie klären kann?';
      newPhase = 'verabschiedung';
    }
  }

  if (lastUserMessage) {
    const lower = lastUserMessage.content.toLowerCase();
    if (lower.includes('förderung') || lower.includes('kfw') || lower.includes('zuschuss')) {
      responseText += ' Übrigens: Die KfW fördert aktuell mit bis zu 40% der Kosten. Das sind bei einer Wärmepumpe bis zu 7.200€ Einsparung!';
    }
    if (lower.includes('was kostet') || lower.includes('wie teuer') || lower.includes('preis')) {
      const nc = nicheConfigs.find((n) => n.id === niche);
      if (nc) responseText += ` Die Investition liegt bei ca. ${nc.durchschnittlicherAuftragswert.toLocaleString('de-DE')}€ – inklusive Installation.`;
    }
  }

  const suggestions = getSuggestions(newPhase);
  return NextResponse.json({
    message: responseText, phase: newPhase, phaseLabel: PHASE_LABELS[newPhase],
    nextPhases: PHASE_ORDER, suggestions,
  });
}

function getSuggestions(phase: string): string[] {
  switch (phase) {
    case 'begruessung': return ['Ja, ich habe eine alte Heizung', 'Was bieten Sie an?', 'Ich bin nicht interessiert'];
    case 'bedarfsanalyse': return ['Meine Heizung ist von 1998', 'Ich habe eine Gasheizung', 'Die Heizkosten sind sehr hoch'];
    case 'praesentation': return ['Wie viel kostet das?', 'Gibt es Förderung?', 'Klingt interessant, erzählen Sie mehr'];
    case 'einwandbehandlung': return ['Das überzeugt mich', 'Ich möchte trotzdem warten', 'Gibt es Alternativen?'];
    case 'abschluss': return ['Termin am Donnerstag passt', 'Senden Sie mir ein Angebot', 'Ich brauche noch Bedenkzeit'];
    case 'verabschiedung': return ['Vielen Dank!', 'Ich freue mich auf den Termin', 'Auf Wiedersehen!'];
    default: return ['Interessant', 'Erzählen Sie mehr', 'Was kostet das?'];
  }
}

// ============================================
// POST Handler
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, niche, scriptId, currentPhase, leadName, personality, agentName } = body;

    const client = getOpenAIClient();

    // Fallback to templates if no OpenAI key
    if (!client) {
      return templateResponse(body);
    }

    const script = salesScripts.find((s) => s.id === scriptId) || salesScripts.find((s) => s.niche === niche);
    if (!script) {
      return NextResponse.json({ error: 'Skript nicht gefunden' }, { status: 400 });
    }

    const nicheConfig = nicheConfigs.find((n) => n.id === niche);

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      script,
      nicheConfig,
      personality: personality || 'beratend',
      currentPhase,
      leadName,
      agentName,
    });

    // Convert message history to OpenAI format (cap at last 20 messages)
    const recentMessages = messages.slice(-20);
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: (m.role === 'agent' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
    ];

    // Call OpenAI
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await client.chat.completions.create({
      model,
      messages: openaiMessages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';

    // Parse structured response
    let parsed: { message?: string; phase?: string; suggestions?: string[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // If JSON parsing fails, use raw content as message
      parsed = { message: rawContent, phase: currentPhase, suggestions: getSuggestions(currentPhase) };
    }

    const responseMessage = parsed.message || 'Vielen Dank für Ihre Antwort. Wie kann ich Ihnen weiterhelfen?';
    const responsePhase = PHASE_ORDER.includes(parsed.phase || '') ? parsed.phase! : currentPhase;
    const responseSuggestions = Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
      ? parsed.suggestions.slice(0, 3)
      : getSuggestions(responsePhase);

    return NextResponse.json({
      message: responseMessage,
      phase: responsePhase,
      phaseLabel: PHASE_LABELS[responsePhase],
      nextPhases: PHASE_ORDER,
      suggestions: responseSuggestions,
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);

    // If OpenAI fails, try template fallback
    try {
      const body: ChatRequest = await request.clone().json();
      return templateResponse(body);
    } catch {
      return NextResponse.json(
        { error: 'Fehler bei der Gesprächsverarbeitung', details: error instanceof Error ? error.message : 'Unknown' },
        { status: 500 }
      );
    }
  }
}
