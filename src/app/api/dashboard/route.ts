import { sql } from '../../../lib/db';
import { NextResponse } from 'next/server';

function parseUserAgent(ua: string) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };
  
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // Detect Browser
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'IE';
  
  // Detect OS
  if (ua.includes('Windows NT 10')) os = 'Windows 10';
  else if (ua.includes('Windows NT 11') || (ua.includes('Windows NT 10') && ua.includes('rv:'))) os = 'Windows 11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return { browser, os };
}

export async function GET() {
  try {
    // Get basic stats
    const visitorsResult = await sql`SELECT COUNT(*) as count FROM visitors`;
    const pageViewsResult = await sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'page_view'`;
    const eventsResult = await sql`SELECT COUNT(*) as count FROM events`;
    const identifiedResult = await sql`SELECT COUNT(*) as count FROM visitors WHERE is_identified = true`;

    // Get recent events with more details
    const recentEvents = await sql`
      SELECT e.id, e.event_type, e.page_path, e.page_url, e.timestamp, e.visitor_id, 
             e.user_agent, e.device_type, e.ip_address, e.referrer,
             e.utm_source, e.utm_medium, e.utm_campaign,
             v.email, v.name
      FROM events e
      LEFT JOIN visitors v ON e.visitor_id = v.id
      ORDER BY e.timestamp DESC 
      LIMIT 20
    `;

    // Get device type breakdown
    const deviceBreakdown = await sql`
      SELECT device_type, COUNT(*) as count 
      FROM events 
      WHERE device_type IS NOT NULL
      GROUP BY device_type
    `;

    // Get browser breakdown from user agents
    const userAgents = await sql`
      SELECT user_agent, COUNT(*) as count 
      FROM events 
      WHERE user_agent IS NOT NULL
      GROUP BY user_agent
    `;

    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    
    userAgents.forEach((row: { user_agent: string; count: string }) => {
      const { browser, os } = parseUserAgent(row.user_agent);
      browserCounts[browser] = (browserCounts[browser] || 0) + parseInt(row.count);
      osCounts[os] = (osCounts[os] || 0) + parseInt(row.count);
    });

    // Get top pages
    const topPages = await sql`
      SELECT page_path, COUNT(*) as count 
      FROM events 
      WHERE event_type = 'page_view' AND page_path IS NOT NULL
      GROUP BY page_path
      ORDER BY count DESC
      LIMIT 5
    `;

    // Get event type breakdown
    const eventBreakdown = await sql`
      SELECT event_type, COUNT(*) as count 
      FROM events 
      GROUP BY event_type
      ORDER BY count DESC
    `;

    // Get traffic sources
    const trafficSources = await sql`
      SELECT 
        COALESCE(utm_source, 
          CASE 
            WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
            WHEN referrer LIKE '%google%' THEN 'Google'
            WHEN referrer LIKE '%facebook%' THEN 'Facebook'
            WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter'
            WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
            ELSE 'Other'
          END
        ) as source,
        COUNT(*) as count
      FROM events
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    `;

    // Process recent events with parsed user agent
    const processedEvents = recentEvents.map((event: {
      id: string;
      event_type: string;
      page_path: string;
      page_url: string;
      timestamp: string;
      visitor_id: string;
      user_agent: string;
      device_type: string;
      ip_address: string;
      referrer: string;
      utm_source: string;
      utm_medium: string;
      utm_campaign: string;
      email: string;
      name: string;
    }) => {
      const { browser, os } = parseUserAgent(event.user_agent);
      return {
        ...event,
        browser,
        os,
      };
    });

    return NextResponse.json({
      stats: {
        totalVisitors: Number(visitorsResult[0].count),
        totalPageViews: Number(pageViewsResult[0].count),
        totalEvents: Number(eventsResult[0].count),
        identifiedVisitors: Number(identifiedResult[0].count),
      },
      recentEvents: processedEvents,
      deviceBreakdown,
      browserBreakdown: Object.entries(browserCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      osBreakdown: Object.entries(osCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      topPages,
      eventBreakdown,
      trafficSources,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
