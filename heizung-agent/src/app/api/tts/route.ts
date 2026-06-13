import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts
 * Text-to-Speech via ElevenLabs API
 * Recibe texto en alemán y devuelve audio MP3
 *
 * Resilience: if the configured/requested voice does not exist on the account
 * (ElevenLabs returns 404 voice_not_found) — which used to mute the agent and
 * fall back to the browser voice — we resolve a real voice from the account and
 * retry once. The old hardcoded default 'MFnm3jV7qH3T7RRp3J00' was invalid for
 * most accounts, so it was removed.
 */

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

// Cache a working voice per process so we don't list voices on every request.
let cachedFallbackVoice: string | null = null;

async function resolveAccountVoice(apiKey: string): Promise<string | null> {
  if (cachedFallbackVoice) return cachedFallbackVoice;
  try {
    const res = await fetch(`${ELEVEN_BASE}/voices`, { headers: { 'xi-api-key': apiKey } });
    if (!res.ok) return null;
    const data = await res.json();
    const voices = (data.voices || []) as { voice_id: string; labels?: { language?: string } }[];
    if (voices.length === 0) return null;
    // Prefer a German-labeled voice if the account has one, else the first available.
    const de = voices.find((v) => v.labels?.language === 'de');
    cachedFallbackVoice = (de || voices[0]).voice_id;
    return cachedFallbackVoice;
  } catch {
    return null;
  }
}

async function synthesize(apiKey: string, voiceId: string, text: string, modelId: string): Promise<Response> {
  return fetch(`${ELEVEN_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text: text.slice(0, 5000), // ElevenLabs limit
      model_id: modelId,
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });
}

function audioResponse(audioBuffer: ArrayBuffer): NextResponse {
  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength.toString(),
      'Cache-Control': 'no-cache',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text ist erforderlich' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Fallback: if no ElevenLabs key, return empty audio with a flag
    if (!apiKey) {
      return NextResponse.json({
        error: 'ElevenLabs API Key nicht konfiguriert. Bitte ELEVENLABS_API_KEY in .env.local setzen.',
        fallback: true,
      }, { status: 200 });
    }

    const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
    const requestedVoice = voiceId || process.env.ELEVENLABS_VOICE_ID;

    let response: Response;
    if (requestedVoice) {
      response = await synthesize(apiKey, requestedVoice, text, modelId);
      // voice_not_found → resolve a real account voice and retry once.
      if (response.status === 404) {
        const fallback = await resolveAccountVoice(apiKey);
        if (fallback && fallback !== requestedVoice) {
          response = await synthesize(apiKey, fallback, text, modelId);
        }
      }
    } else {
      // No voice configured at all — resolve one from the account.
      const fallback = await resolveAccountVoice(apiKey);
      if (!fallback) {
        return NextResponse.json({ error: 'Keine Stimme konfiguriert oder verfuegbar.', fallback: true }, { status: 200 });
      }
      response = await synthesize(apiKey, fallback, text, modelId);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('[TTS] ElevenLabs error:', response.status, errText);
      return NextResponse.json({ error: 'ElevenLabs API Fehler', details: errText, fallback: true }, { status: 200 });
    }

    // Stream audio back
    const audioBuffer = await response.arrayBuffer();
    return audioResponse(audioBuffer);
  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json({ error: 'TTS Fehler', fallback: true }, { status: 200 });
  }
}
