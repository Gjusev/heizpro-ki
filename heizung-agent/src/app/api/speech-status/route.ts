import { NextResponse } from 'next/server';

/**
 * GET /api/speech-status
 * Checks if the Speech Engine is available (API key + engine ID configured).
 * The browser calls this to decide which voice mode to use.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;
  const hasTtsKey = !!apiKey;

  const mode = engineId && apiKey ? 'speech-engine' : hasTtsKey ? 'tts' : 'browser';

  return NextResponse.json({
    mode,
    speechEngineAvailable: !!(engineId && apiKey),
    ttsAvailable: hasTtsKey,
  });
}
