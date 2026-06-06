import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tts
 * Text-to-Speech via ElevenLabs API
 * Recibe texto en alemán y devuelve audio MP3
 */
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

    const vId = voiceId || process.env.ELEVENLABS_VOICE_ID || 'MFnm3jV7qH3T7RRp3J00';
    const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 5000), // ElevenLabs limit
        model_id: modelId,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[TTS] ElevenLabs error:', response.status, errText);
      return NextResponse.json({
        error: 'ElevenLabs API Fehler',
        details: errText,
        fallback: true,
      }, { status: 200 });
    }

    // Stream audio back
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[TTS] Error:', error);
    return NextResponse.json({ error: 'TTS Fehler', fallback: true }, { status: 200 });
  }
}
