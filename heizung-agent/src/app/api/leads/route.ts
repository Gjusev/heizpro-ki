import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/leads
 * Listet alle Leads mit Filteroptionen
 *
 * Query-Parameter:
 *   status?: LeadStatus
 *   search?: string
 *   niche?: string
 *   limit?: number (default: 50)
 *   offset?: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const niche = searchParams.get('niche');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // MVP: Mock-Daten zurückgeben
  // TODO: Datenbankanbindung (Prisma, Supabase, etc.)
  return NextResponse.json({
    leads: [],
    total: 0,
    limit,
    offset,
    filters: { status, search, niche },
    hinweis: 'MVP-Modus: Verbinden Sie eine Datenbank für echte Daten.',
  });
}

/**
 * POST /api/leads
 * Erstellt einen neuen Lead
 *
 * Body: Omit<Lead, 'id' | 'erstelltAm' | 'aktualisiertAm'>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validierung
    const required = ['vorname', 'nachname', 'telefon', 'plz', 'ort'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Fehlende Pflichtfelder: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // MVP: Simulierte Antwort
    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Lead erfolgreich erstellt',
      lead: {
        id: leadId,
        ...body,
        status: body.status || 'neu',
        quelle: body.quelle || 'kaltakquise',
        erstelltAm: new Date().toISOString(),
        aktualisiertAm: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Lead konnte nicht erstellt werden' },
      { status: 500 }
    );
  }
}
