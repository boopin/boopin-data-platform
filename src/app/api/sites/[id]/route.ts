import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET single site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT
        id,
        name,
        domain,
        description,
        created_at,
        updated_at
      FROM sites
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json({ error: 'Failed to fetch site' }, { status: 500 });
  }
}

// PUT update site
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, domain, description } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // Check if domain already exists for a different site
    const existing = await sql`
      SELECT id FROM sites WHERE domain = ${domain} AND id != ${id}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A site with this domain already exists' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE sites
      SET
        name = ${name},
        domain = ${domain},
        description = ${description || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

// DELETE site
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if this is the last site
    const allSites = await sql`SELECT COUNT(*) as count FROM sites`;
    const siteCount = parseInt(allSites[0].count);

    if (siteCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last site' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM sites
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}
