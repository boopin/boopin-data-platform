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
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Get visitor info (with site_id validation)
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
      WHERE id = ${visitorId} AND site_id = ${siteId}
    `;

    if (visitorResult.length === 0) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    const visitor = visitorResult[0];

    // Get all events for this visitor (also filtered by site_id for extra security)
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
      WHERE visitor_id = ${visitorId} AND site_id = ${siteId}
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
