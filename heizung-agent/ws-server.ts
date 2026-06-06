import { createServer } from 'http';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { generateResponse, clearSession } from './src/lib/speech-engine';

// ============================================
// Speech Engine WebSocket Server
// Standalone server on port 3001
// Handles ElevenLabs Speech Engine callbacks
// ============================================

const PORT = parseInt(process.env.WS_PORT || '3001', 10);
const API_KEY = process.env.ELEVENLABS_API_KEY;
const ENGINE_ID = process.env.ELEVENLABS_SPEECH_ENGINE_ID!;

if (!API_KEY) {
  console.error('[WS] ELEVENLABS_API_KEY nicht gesetzt');
  process.exit(1);
}

if (!ENGINE_ID) {
  console.error('[WS] ELEVENLABS_SPEECH_ENGINE_ID nicht gesetzt. Führen Sie zuerst pnpm run setup:speech aus.');
  process.exit(1);
}

const elevenlabs = new ElevenLabsClient({ apiKey: API_KEY });

async function main() {
  const engine = await elevenlabs.speechEngine.get(ENGINE_ID);

  const httpServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'heizpro-speech-engine' }));
  });

  engine.attach(httpServer, '/ws', {
    debug: true,
    onInit: (conversationId, session) => {
      console.log(`[WS] Session gestartet: ${conversationId}`);
    },
    onTranscript: async (transcript, signal, session) => {
      const convId = session.conversationId || 'unknown';
      console.log(`[WS] Transkript (${convId}): "${JSON.stringify(transcript).slice(0, 120)}"`);

      // Extract user text from transcript segments
      const userText = transcript
        .filter((t) => t.role === 'user')
        .map((t) => t.content)
        .join(' ')
        .trim();

      if (!userText) return;

      // Delegate to conversation engine
      const response = generateResponse(convId, userText);
      console.log(`[WS] Antwort (${response.phase}): "${response.text.slice(0, 80)}..."`);

      // Stream response text back to ElevenLabs for TTS
      await session.sendResponse(response.text);
    },
    onClose: (session) => {
      const convId = session.conversationId || 'unknown';
      console.log(`[WS] Session geschlossen: ${convId}`);
      if (session.conversationId) clearSession(session.conversationId);
    },
    onDisconnect: (session) => {
      const convId = session.conversationId || 'unknown';
      console.log(`[WS] Verbindung verloren: ${convId}`);
      if (session.conversationId) clearSession(session.conversationId);
    },
    onError: (error, session) => {
      const convId = session.conversationId || 'unknown';
      console.error(`[WS] Fehler (${convId}):`, error);
    },
  });

  httpServer.listen(PORT, () => {
    console.log(`[WS] Speech Engine Server laeuft auf http://localhost:${PORT}`);
    console.log(`[WS] WebSocket Endpunkt: ws://localhost:${PORT}/ws`);
    console.log(`[WS] Engine ID: ${ENGINE_ID}`);
  });
}

main().catch((err) => {
  console.error('[WS] Start fehlgeschlagen:', err);
  process.exit(1);
});
