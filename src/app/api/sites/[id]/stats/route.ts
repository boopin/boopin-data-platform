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
      SELECT COUNT(DISTINCT visitor_id) as count
      FROM events
      WHERE site_id = ${siteId}
    `;

    // Get event count
    const eventCount = await sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE site_id = ${siteId}
    `;

    // Get page view count
    const pageViewCount = await sql`
      SELECT COUNT(*) as count
      FROM page_views
      WHERE site_id = ${siteId}
    `;

    // Get goals count
    const goalsCount = await sql`
      SELECT COUNT(*) as count
      FROM goals
      WHERE site_id = ${siteId}
    `;

    // Get funnels count
    const funnelsCount = await sql`
      SELECT COUNT(*) as count
      FROM funnels
      WHERE site_id = ${siteId}
    `;

    // Get cohorts count
    const cohortsCount = await sql`
      SELECT COUNT(*) as count
      FROM cohorts
      WHERE site_id = ${siteId}
    `;

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
