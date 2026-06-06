import { NextResponse } from 'next/server';
import { dbGetScripts, dbSaveScript, dbDeleteScript } from '@/lib/db/queries';

/**
 * GET /api/db/scripts
 */
export async function GET() {
  try {
    const scripts = await dbGetScripts();
    return NextResponse.json({ scripts });
  } catch (error) {
    console.error('[DB Scripts GET] Error:', error);
    return NextResponse.json({ scripts: [], error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/db/scripts — create or update
 */
export async function POST(req: Request) {
  try {
    const script = await req.json();
    const id = await dbSaveScript(script);
    return NextResponse.json({ saved: true, id });
  } catch (error) {
    console.error('[DB Scripts POST] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/db/scripts?id=xxx
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await dbDeleteScript(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[DB Scripts DELETE] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
