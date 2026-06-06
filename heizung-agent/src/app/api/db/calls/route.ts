import { NextResponse } from 'next/server';
import { dbGetCalls, dbSaveCall, dbDeleteCall } from '@/lib/db/queries';

/**
 * GET /api/db/calls
 */
export async function GET() {
  try {
    const calls = await dbGetCalls();
    return NextResponse.json({ calls });
  } catch (error) {
    console.error('[DB Calls GET] Error:', error);
    return NextResponse.json({ calls: [], error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/db/calls — save a new call
 */
export async function POST(req: Request) {
  try {
    const call = await req.json();
    const id = await dbSaveCall(call);
    return NextResponse.json({ saved: true, id });
  } catch (error) {
    console.error('[DB Calls POST] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/db/calls?id=xxx
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await dbDeleteCall(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DB Calls DELETE] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
