import { NextResponse } from 'next/server';
import { dbGetAgents, dbSaveAgents, dbSetActiveAgent } from '@/lib/db/queries';

/**
 * GET /api/db/agents
 * Returns all agents from PostgreSQL.
 */
export async function GET() {
  try {
    const agents = await dbGetAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('[DB Agents GET] Error:', error);
    return NextResponse.json({ agents: [], error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/db/agents
 * Save all agents to PostgreSQL.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agents } = body as { agents: any[] };
    if (!agents || !Array.isArray(agents)) {
      return NextResponse.json({ error: 'agents array required' }, { status: 400 });
    }
    await dbSaveAgents(agents);
    return NextResponse.json({ saved: true, count: agents.length });
  } catch (error) {
    console.error('[DB Agents POST] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * PATCH /api/db/agents
 * Set active agent by ID.
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { activeId } = body as { activeId: string };
    if (!activeId) {
      return NextResponse.json({ error: 'activeId required' }, { status: 400 });
    }
    await dbSetActiveAgent(activeId);
    return NextResponse.json({ active: activeId });
  } catch (error) {
    console.error('[DB Agents PATCH] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
