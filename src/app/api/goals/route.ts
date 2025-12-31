import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create goals table if it doesn't exist
async function ensureGoalsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        target_value VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error creating goals table:', error);
  }
}

// GET - List all goals with completion stats
export async function GET() {
  try {
    await ensureGoalsTable();

    const goals = await sql`
      SELECT * FROM goals ORDER BY created_at DESC
    `;

    // Get completion stats for each goal
    const goalsWithStats = await Promise.all(
      goals.map(async (goal) => {
        let completions = 0;
        let completionsToday = 0;
        let completionsThisWeek = 0;
        let completionsThisMonth = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        if (goal.type === 'event') {
          // Count events of this type
          const results = await sql`
            SELECT
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE timestamp >= ${today.toISOString()}) as today,
              COUNT(*) FILTER (WHERE timestamp >= ${weekAgo.toISOString()}) as week,
              COUNT(*) FILTER (WHERE timestamp >= ${monthAgo.toISOString()}) as month
            FROM events
            WHERE event_type = ${goal.target_value}
          `;
          completions = parseInt(results[0]?.total) || 0;
          completionsToday = parseInt(results[0]?.today) || 0;
          completionsThisWeek = parseInt(results[0]?.week) || 0;
          completionsThisMonth = parseInt(results[0]?.month) || 0;
        } else if (goal.type === 'url') {
          // Count page views to this URL
          const results = await sql`
            SELECT
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE timestamp >= ${today.toISOString()}) as today,
              COUNT(*) FILTER (WHERE timestamp >= ${weekAgo.toISOString()}) as week,
              COUNT(*) FILTER (WHERE timestamp >= ${monthAgo.toISOString()}) as month
            FROM events
            WHERE event_type = 'page_view'
            AND page_path = ${goal.target_value}
          `;
          completions = parseInt(results[0]?.total) || 0;
          completionsToday = parseInt(results[0]?.today) || 0;
          completionsThisWeek = parseInt(results[0]?.week) || 0;
          completionsThisMonth = parseInt(results[0]?.month) || 0;
        }

        return {
          ...goal,
          stats: {
            completions,
            completionsToday,
            completionsThisWeek,
            completionsThisMonth
          }
        };
      })
    );

    return NextResponse.json({ goals: goalsWithStats });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST - Create a new goal
export async function POST(request: NextRequest) {
  try {
    await ensureGoalsTable();

    const body = await request.json();
    const { name, description, type, target_value } = body;

    if (!name || !type || !target_value) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, target_value' },
        { status: 400 }
      );
    }

    if (type !== 'event' && type !== 'url') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "event" or "url"' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO goals (name, description, type, target_value)
      VALUES (${name}, ${description || null}, ${type}, ${target_value})
      RETURNING *
    `;

    return NextResponse.json({ goal: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

// PUT - Update a goal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, type, target_value } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing goal ID' }, { status: 400 });
    }

    const result = await sql`
      UPDATE goals
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        type = COALESCE(${type}, type),
        target_value = COALESCE(${target_value}, target_value),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ goal: result[0] });
  } catch (error) {
    console.error('Goals PUT error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

// DELETE - Delete a goal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing goal ID' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM goals WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal: result[0] });
  } catch (error) {
    console.error('Goals DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
