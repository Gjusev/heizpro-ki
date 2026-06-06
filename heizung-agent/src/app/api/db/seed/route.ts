import { NextResponse } from 'next/server';
import { dbSeedDefaults } from '@/lib/db/queries';

/**
 * POST /api/db/seed
 * Seeds the database with default agents and scripts.
 * Safe to call multiple times — won't duplicate.
 */
export async function POST() {
  try {
    const result = await dbSeedDefaults();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Seed] Error:', error);
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 });
  }
}
