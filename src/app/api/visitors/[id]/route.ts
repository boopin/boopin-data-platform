import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get visitor details with all events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: visitorId } = await params;

    // Get visitor info
    const visitorResult = await sql`
      SELECT 
        id, 
        anonymous_id, 
        email, 
        name, 
        phone, 
        first_seen_at, 
        last_seen_at, 
        visit_count, 
        is_identified,
        properties
      FROM visitors
      WHERE id = ${visitorId}
    `;

    if (visitorResult.length === 0) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    const visitor = visitorResult[0];

    // Get all events for this visitor
    const events = await sql`
      SELECT 
        id,
        event_type,
        page_path,
        page_title,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        device_type,
        browser,
        os,
        country,
        city,
        properties,
        timestamp
      FROM events
      WHERE visitor_id = ${visitorId}
      ORDER BY timestamp DESC
    `;

    return NextResponse.json({ 
      visitor,
      events,
      total_events: events.length
    });
  } catch (error) {
    console.error('Visitor detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch visitor' }, { status: 500 });
  }
}
