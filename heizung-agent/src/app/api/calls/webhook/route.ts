import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/calls/webhook
 * Webhook-Endpoint für Voice-AI-Provider Callbacks
 *
 * Empfängt Echtzeit-Updates von Anrufen:
 * - call.started
 * - call.ended
 * - call.transcript
 * - call.analysis
 *
 * Unterstützte Provider: Vapi, Retell AI, Bland.ai
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Provider-spezifische Verarbeitung
    const provider = request.headers.get('x-provider') || 'unknown';
    const eventType = body.type || body.event || body.status;

    console.log(`[Webhook] Provider: ${provider}, Event: ${eventType}`);

    switch (eventType) {
      case 'call.started':
      case 'callStarted':
      case 'in_progress':
        // Anruf wurde gestartet
        console.log(`[Webhook] Anruf gestartet: ${body.call?.id || body.call_id}`);
        break;

      case 'call.ended':
      case 'callEnded':
      case 'ended':
        // Anruf beendet – Ergebnis verarbeiten
        console.log(`[Webhook] Anruf beendet: ${body.call?.id || body.call_id}`);
        // TODO: Lead-Status aktualisieren
        // TODO: Transkription speichern
        // TODO: Termin buchen falls vereinbart
        break;

      case 'call.transcript':
      case 'transcript':
        // Transkription eingegangen
        console.log(`[Webhook] Transkription: ${body.call?.id || body.call_id}`);
        // TODO: Transkription in Datenbank speichern
        break;

      case 'call.analysis':
      case 'analysis':
        // KI-Analyse des Gesprächs
        console.log(`[Webhook] Analyse: ${body.call?.id || body.call_id}`);
        // TODO: Stimmungsanalyse speichern
        // TODO: Zusammenfassung generieren
        break;

      default:
        console.log(`[Webhook] Unbekanntes Event: ${eventType}`);
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error('[Webhook] Fehler:', error);
    return NextResponse.json(
      { error: 'Webhook-Verarbeitung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

// GET für Webhook-Verifikation (z.B. Meta/Twilio)
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  const token = request.nextUrl.searchParams.get('hub.verify_token');

  if (mode === 'subscribe' && challenge) {
    // TODO: Token-Validierung
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'ok', service: 'HeizPro KI Webhook' });
}
