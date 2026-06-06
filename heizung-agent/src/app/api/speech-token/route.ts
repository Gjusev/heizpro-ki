import { NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

/**
 * GET /api/speech-token
 * Issues a short-lived conversation token for the browser.
 * The token lets the browser connect to ElevenLabs Speech Engine
 * without exposing the API key in client-side code.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;

  if (!apiKey || !engineId) {
    return NextResponse.json(
      {
        error: 'Speech Engine nicht konfiguriert',
        hint: 'Setzen Sie ELEVENLABS_API_KEY und ELEVENLABS_SPEECH_ENGINE_ID in .env.local',
      },
      { status: 503 },
    );
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });

    const response = await elevenlabs.conversationalAi.conversations.getWebrtcToken({
      agentId: engineId,
    });

    return NextResponse.json({ token: response.token });
  } catch (error) {
    console.error('[SpeechToken] Fehler:', error);
    return NextResponse.json(
      { error: 'Token konnte nicht erstellt werden' },
      { status: 500 },
    );
  }
}
