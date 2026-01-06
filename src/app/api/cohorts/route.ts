import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function ensureCohortsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS cohorts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      cohort_type VARCHAR(50) NOT NULL,
      date_field VARCHAR(100) NOT NULL,
      interval_type VARCHAR(20) NOT NULL,
      retention_periods INTEGER[] DEFAULT ARRAY[1, 7, 14, 30, 60, 90],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// GET - List all cohorts
export async function GET(request: NextRequest) {
  try {
    await ensureCohortsTable();

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    const cohorts = await sql`
      SELECT * FROM cohorts
      WHERE site_id = ${siteId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ cohorts });
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json({ error: 'Failed to fetch cohorts' }, { status: 500 });
  }
}

// POST - Create new cohort
export async function POST(request: NextRequest) {
  try {
    await ensureCohortsTable();

    const { name, description, cohort_type, date_field, interval_type, retention_periods, site_id } = await request.json();

    // Site ID is required for multi-site support
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    if (!name || !cohort_type || !date_field || !interval_type) {
      return NextResponse.json(
        { error: 'Cohort name, type, date field, and interval are required' },
        { status: 400 }
      );
    }

    // Use default retention periods if not provided
    const periods = retention_periods || [1, 7, 14, 30, 60, 90];

    const result = await sql`
      INSERT INTO cohorts (name, description, cohort_type, date_field, interval_type, retention_periods, site_id)
      VALUES (
        ${name},
        ${description || null},
        ${cohort_type},
        ${date_field},
        ${interval_type},
        ${periods},
        ${site_id}
      )
      RETURNING *
    `;

    return NextResponse.json({ cohort: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating cohort:', error);
    return NextResponse.json({ error: 'Failed to create cohort' }, { status: 500 });
  }
}

// PUT - Update cohort
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const siteId = searchParams.get('site_id');

    if (!id) {
      return NextResponse.json({ error: 'Cohort ID is required' }, { status: 400 });
    }

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    const { name, description, retention_periods } = await request.json();

    const result = await sql`
      UPDATE cohorts
      SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description || null}, description),
        retention_periods = COALESCE(${retention_periods || null}, retention_periods),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND site_id = ${siteId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    return NextResponse.json({ cohort: result[0] });
  } catch (error) {
    console.error('Error updating cohort:', error);
    return NextResponse.json({ error: 'Failed to update cohort' }, { status: 500 });
  }
}

// DELETE - Delete cohort
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const siteId = searchParams.get('site_id');

    if (!id) {
      return NextResponse.json({ error: 'Cohort ID is required' }, { status: 400 });
    }

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM cohorts
      WHERE id = ${id} AND site_id = ${siteId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cohort:', error);
    return NextResponse.json({ error: 'Failed to delete cohort' }, { status: 500 });
  }
}
