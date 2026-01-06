import { sql } from '../../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET site stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;

    // Get visitor count
    const visitorCount = await sql`
      SELECT COUNT(*) as count
      FROM visitors
      WHERE site_id = ${siteId}
    `;

    // Get event count
    const eventCount = await sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE site_id = ${siteId}
    `;

    // Get page view count (from events with event_type = 'page_view')
    const pageViewCount = await sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE site_id = ${siteId} AND event_type = 'page_view'
    `;

    // Get goals count (use conditional query if table exists)
    let goalsCount;
    try {
      goalsCount = await sql`
        SELECT COUNT(*) as count
        FROM goals
        WHERE site_id = ${siteId}
      `;
    } catch {
      goalsCount = [{ count: '0' }];
    }

    // Get funnels count
    let funnelsCount;
    try {
      funnelsCount = await sql`
        SELECT COUNT(*) as count
        FROM funnels
        WHERE site_id = ${siteId}
      `;
    } catch {
      funnelsCount = [{ count: '0' }];
    }

    // Get cohorts count
    let cohortsCount;
    try {
      cohortsCount = await sql`
        SELECT COUNT(*) as count
        FROM cohorts
        WHERE site_id = ${siteId}
      `;
    } catch {
      cohortsCount = [{ count: '0' }];
    }

    // Get last event timestamp
    const lastEvent = await sql`
      SELECT MAX(timestamp) as last_event
      FROM events
      WHERE site_id = ${siteId}
    `;

    return NextResponse.json({
      visitors: parseInt(visitorCount[0].count || '0'),
      events: parseInt(eventCount[0].count || '0'),
      pageViews: parseInt(pageViewCount[0].count || '0'),
      goals: parseInt(goalsCount[0].count || '0'),
      funnels: parseInt(funnelsCount[0].count || '0'),
      cohorts: parseInt(cohortsCount[0].count || '0'),
      lastEvent: lastEvent[0].last_event
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    return NextResponse.json({ error: 'Failed to fetch site stats' }, { status: 500 });
  }
}
