import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Ensure funnels table exists
async function ensureFunnelsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS funnels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        steps JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error creating funnels table:', error);
  }
}

// GET - List all funnels
export async function GET() {
  try {
    await ensureFunnelsTable();

    const funnels = await sql`
      SELECT id, name, description, steps, created_at, updated_at
      FROM funnels
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ funnels });
  } catch (error) {
    console.error('Funnels GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch funnels' }, { status: 500 });
  }
}

// POST - Create a new funnel
export async function POST(request: NextRequest) {
  try {
    await ensureFunnelsTable();

    const body = await request.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps) || steps.length < 2) {
      return NextResponse.json(
        { error: 'Funnel name and at least 2 steps are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO funnels (name, description, steps)
      VALUES (${name}, ${description || null}, ${JSON.stringify(steps)})
      RETURNING *
    `;

    return NextResponse.json({ funnel: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Funnels POST error:', error);
    return NextResponse.json({ error: 'Failed to create funnel' }, { status: 500 });
  }
}

// PUT - Update a funnel
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, steps } = body;

    if (!id) {
      return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
    }

    const result = await sql`
      UPDATE funnels
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        steps = COALESCE(${steps ? JSON.stringify(steps) : null}, steps),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    }

    return NextResponse.json({ funnel: result[0] });
  } catch (error) {
    console.error('Funnels PUT error:', error);
    return NextResponse.json({ error: 'Failed to update funnel' }, { status: 500 });
  }
}

// DELETE - Delete a funnel
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Funnel ID is required' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM funnels WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Funnels DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete funnel' }, { status: 500 });
  }
}
