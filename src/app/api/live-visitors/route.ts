import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get visitors who had activity in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const liveVisitors = await sql`
      WITH recent_events AS (
        SELECT DISTINCT ON (visitor_id)
          visitor_id,
          page_path,
          page_url,
          timestamp,
          device_type,
          browser,
          os,
          country,
          city,
          utm_source,
          utm_medium,
          utm_campaign
        FROM events
        WHERE timestamp >= ${fiveMinutesAgo.toISOString()}
        ORDER BY visitor_id, timestamp DESC
      )
      SELECT
        v.id,
        v.email,
        v.name,
        v.anonymous_id,
        v.is_identified,
        re.page_path,
        re.page_url,
        re.timestamp as last_activity,
        re.device_type,
        re.browser,
        re.os,
        re.country,
        re.city,
        re.utm_source,
        re.utm_medium,
        re.utm_campaign,
        (
          SELECT COUNT(*)
          FROM events e
          WHERE e.visitor_id = v.id
          AND e.timestamp >= ${fiveMinutesAgo.toISOString()}
        ) as event_count,
        (
          SELECT COUNT(DISTINCT page_path)
          FROM events e
          WHERE e.visitor_id = v.id
          AND e.event_type = 'page_view'
          AND e.timestamp >= ${fiveMinutesAgo.toISOString()}
        ) as pages_viewed,
        v.first_seen_at
      FROM visitors v
      INNER JOIN recent_events re ON v.id = re.visitor_id
      ORDER BY re.timestamp DESC
    `;

    // Calculate time on site for each visitor
    const visitorsWithTimeOnSite = await Promise.all(
      liveVisitors.map(async (visitor) => {
        const firstEventResult = await sql`
          SELECT MIN(timestamp) as first_event
          FROM events
          WHERE visitor_id = ${visitor.id}
          AND timestamp >= ${fiveMinutesAgo.toISOString()}
        `;

        const firstEvent = firstEventResult[0]?.first_event;
        const timeOnSite = firstEvent
          ? Math.floor((new Date(visitor.last_activity).getTime() - new Date(firstEvent).getTime()) / 1000)
          : 0;

        return {
          ...visitor,
          time_on_site: timeOnSite
        };
      })
    );

    // Get overall stats
    const stats = {
      totalLiveVisitors: liveVisitors.length,
      identifiedVisitors: liveVisitors.filter(v => v.is_identified).length,
      anonymousVisitors: liveVisitors.filter(v => !v.is_identified).length,
      totalEvents: liveVisitors.reduce((sum, v) => sum + parseInt(v.event_count), 0),
    };

    return NextResponse.json({
      visitors: visitorsWithTimeOnSite,
      stats,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Live visitors error:', error);
    return NextResponse.json({ error: 'Failed to fetch live visitors' }, { status: 500 });
  }
}
