import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Get all distinct event types for this site, ordered by frequency
    const eventTypes = await sql`
      SELECT
        event_type,
        COUNT(*) as count
      FROM events
      WHERE site_id = ${siteId}
      GROUP BY event_type
      ORDER BY count DESC
    `;

    // Return just the event type names as an array
    const types = eventTypes.map(row => row.event_type);

    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching event types:', error);
    return NextResponse.json({ error: 'Failed to fetch event types' }, { status: 500 });
  }
}
