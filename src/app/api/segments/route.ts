import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get all segments
export async function GET() {
  try {
    const segments = await sql`
      SELECT id, name, description, rules, created_at
      FROM segments
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ segments });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Create new segment - minimal version for debugging
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, rules } = body;

    // Log what we received
    console.log('POST /api/segments received:', { name, description, rulesLength: rules?.length });

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // First, let's check what columns are NOT NULL
    // Try inserting with minimal fields first
    const result = await sql`
      INSERT INTO segments (name, description, rules)
      VALUES (
        ${name}, 
        ${description || ''}, 
        ${JSON.stringify(rules || [])}::jsonb
      )
      RETURNING *
    `;

    return NextResponse.json({ segment: result[0] }, { status: 201 });
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error('POST /api/segments error:', err);
    
    // Return detailed error for debugging
    return NextResponse.json({ 
      error: 'Failed to create segment',
      message: err.message,
      name: err.name,
      stack: err.stack?.split('\n').slice(0, 3)
    }, { status: 500 });
  }
}
