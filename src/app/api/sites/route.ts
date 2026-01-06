import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET all sites
export async function GET() {
  try {
    const sites = await sql`
      SELECT
        id,
        name,
        domain,
        description,
        created_at,
        updated_at
      FROM sites
      ORDER BY created_at DESC
    `;

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

// POST create new site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, description } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existing = await sql`
      SELECT id FROM sites WHERE domain = ${domain}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A site with this domain already exists' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO sites (name, domain, description)
      VALUES (${name}, ${domain}, ${description || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}
