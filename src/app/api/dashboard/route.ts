import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const visitorsResult = await sql`SELECT COUNT(*) as count FROM visitors`;
    const pageViewsResult = await sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'page_view'`;
    const eventsResult = await sql`SELECT COUNT(*) as count FROM events`;
    const identifiedResult = await sql`SELECT COUNT(*) as count FROM visitors WHERE is_identified = true`;

    const recentEvents = await sql`
      SELECT id, event_type, page_path, timestamp, visitor_id 
      FROM events 
      ORDER BY timestamp DESC 
      LIMIT 20
    `;

    return NextResponse.json({
      stats: {
        totalVisitors: Number(visitorsResult[0].count),
        totalPageViews: Number(pageViewsResult[0].count),
        totalEvents: Number(eventsResult[0].count),
        identifiedVisitors: Number(identifiedResult[0].count),
      },
      recentEvents,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
