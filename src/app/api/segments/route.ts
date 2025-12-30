import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get all segments
export async function GET() {
  try {
    const segments = await sql`
      SELECT id, name, description, rules, created_at, updated_at
      FROM segments
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ segments });
  } catch (error) {
    console.error('Segments GET error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Create new segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received body:', JSON.stringify(body));
    
    const { name, description, rules } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json({ error: 'Rules array is required' }, { status: 400 });
    }

    // Try direct SQL with explicit casting
    const result = await sql`
      INSERT INTO segments (name, description, rules)
      VALUES (
        ${name}, 
        ${description || ''}, 
        ${JSON.stringify(rules)}::jsonb
      )
      RETURNING id, name, description, rules, created_at
    `;

    console.log('Insert result:', result);

    return NextResponse.json({ segment: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Create segment error:', error);
    // Return the actual error message for debugging
    return NextResponse.json({ 
      error: 'Failed to create segment',
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
