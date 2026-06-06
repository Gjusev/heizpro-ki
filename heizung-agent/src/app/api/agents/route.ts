import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

/**
 * GET /api/agents
 * Lists all agents from the ElevenLabs Conversational AI platform.
 * Falls back to empty array if no API key configured.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      agents: [],
      configured: false,
      hint: 'ELEVENLABS_API_KEY nicht gesetzt',
    });
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const result = await client.conversationalAi.agents.list();

    const agents = (result as any).agents || result || [];

    return NextResponse.json({
      agents: agents.map((a: any) => ({
        id: a.agentId || a.agent_id,
        name: a.name,
        language: a.conversationConfig?.agent?.language || 'de',
        voiceId: a.conversationConfig?.tts?.voiceId || a.conversationConfig?.tts?.voice_id,
        llm: a.conversationConfig?.agent?.prompt?.llm,
        firstMessage: a.conversationConfig?.agent?.firstMessage || a.conversationConfig?.agent?.first_message,
        createdAt: a.createdAt || a.created_at,
      })),
      configured: true,
    });
  } catch (error) {
    console.error('[Agents API] List error:', error);
    return NextResponse.json({
      agents: [],
      configured: true,
      error: 'Fehler beim Laden der ElevenLabs Agents',
    }, { status: 500 });
  }
}
