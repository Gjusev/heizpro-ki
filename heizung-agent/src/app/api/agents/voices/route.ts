import { NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

/**
 * GET /api/agents/voices
 * Lists available voices from ElevenLabs.
 * Returns German-friendly voices first.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ voices: [], configured: false });
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const result = await client.voices.getAll();
    const voices = (result as any).voices || result || [];

    // Sort: German/multilingual voices first, then by name
    const sorted = voices
      .map((v: any) => ({
        id: v.voiceId || v.voice_id,
        name: v.name,
        labels: v.labels || {},
        previewUrl: v.previewUrl || v.preview_url,
      }))
      .sort((a: any, b: any) => {
        const aDe = a.labels?.language === 'de' || a.labels?.accent === 'german' ? 0 : 1;
        const bDe = b.labels?.language === 'de' || b.labels?.accent === 'german' ? 0 : 1;
        return aDe - bDe || a.name.localeCompare(b.name);
      });

    return NextResponse.json({ voices: sorted, configured: true });
  } catch (error) {
    console.error('[Voices API] Error:', error);
    return NextResponse.json({ voices: [], configured: true, error: 'Fehler beim Laden der Stimmen' }, { status: 500 });
  }
}
