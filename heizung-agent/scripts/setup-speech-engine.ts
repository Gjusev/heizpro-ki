/**
 * Speech Engine Setup Script
 *
 * Creates an ElevenLabs Speech Engine resource and prints the ENGINE_ID
 * to add to your .env.local
 *
 * Usage:  pnpm run setup:speech
 *
 * Prerequisites:
 *   - ELEVENLABS_API_KEY in .env.local
 *   - PUBLIC_WS_URL pointing to your WebSocket server (e.g. wss://xxx.ngrok.app/ws)
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const wsUrl = process.env.PUBLIC_WS_URL;

  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY fehlt. Bitte in .env.local setzen.');
    process.exit(1);
  }

  if (!wsUrl) {
    console.error('PUBLIC_WS_URL fehlt. Beispiel: wss://mein-tunnel.ngrok.app/ws');
    console.error('');
    console.error('Lokale Entwicklung:');
    console.error('  1. ngrok http 3001');
    console.error('  2. PUBLIC_WS_URL=wss://xxxx.ngrok.app/ws pnpm run setup:speech');
    process.exit(1);
  }

  const elevenlabs = new ElevenLabsClient({ apiKey });

  console.log('Erstelle Speech Engine...');
  console.log(`  WebSocket URL: ${wsUrl}`);

  const engine = await elevenlabs.speechEngine.create({
    name: 'HeizPro KI Verkaeufer',
    speechEngine: {
      wsUrl,
    },
    overrides: {
      firstMessage: true,
    },
    tts: {
      modelId: 'eleven_multilingual_v2',
      voiceId: process.env.ELEVENLABS_VOICE_ID || 'MFnm3jV7qH3T7RRp3J00',
      optimizeStreamingLatency: 2,
    },
    asr: {
      provider: 'scribe_realtime',
      keywords: ['Heizung', 'Waermepumpe', 'Klimaanlage', 'Foerderung', 'KfW', 'Gasheizung', 'Solarthermie', 'Sanitaer'],
    },
    turn: {
      turnEagerness: 'normal',
      speculativeTurn: true,
    },
    privacy: {
      recordVoice: false,
    },
  });

  console.log('');
  console.log('Speech Engine erstellt!');
  console.log('');
  console.log('Fuegen Sie folgende Zeile zu .env.local hinzu:');
  console.log(`  ELEVENLABS_SPEECH_ENGINE_ID=${engine.engineId}`);
  console.log('');
  console.log('Dann starten Sie den WebSocket Server:');
  console.log('  pnpm run ws:dev');
}

main().catch((err) => {
  console.error('Fehler:', err);
  process.exit(1);
});
