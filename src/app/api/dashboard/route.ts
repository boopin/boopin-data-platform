import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseUserAgent(ua: string) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };
  
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'IE';
  
  if (ua.includes('Windows NT 10')) os = 'Windows 10';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return { browser, os };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const eventType = searchParams.get('eventType');
    const country = searchParams.get('country');
    const device = searchParams.get('device');
    const browser = searchParams.get('browser');

    // Build dynamic WHERE clause
    let whereConditions = [];
    if (dateFrom) whereConditions.push(`e.timestamp >= '${dateFrom}'`);
    if (dateTo) whereConditions.push(`e.timestamp <= '${dateTo}T23:59:59'`);
    if (eventType && eventType !== 'all') whereConditions.push(`e.event_type = '${eventType}'`);
    if (country && country !== 'all') whereConditions.push(`e.country = '${country}'`);
    if (device && device !== 'all') whereConditions.push(`e.device_type = '${device}'`);
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Stats with filters
    const visitorsResult = await sql`SELECT COUNT(DISTINCT visitor_id) as count FROM events e ${whereClause ? sql.unsafe(whereClause) : sql``}`;
    const pageViewsResult = await sql`SELECT COUNT(*) as count FROM events e ${whereClause ? sql.unsafe(whereClause + (whereConditions.length > 0 ? " AND e.event_type = 'page_view'" : " WHERE e.event_type = 'page_view'")) : sql`WHERE event_type = 'page_view'`}`;
    const eventsResult = await sql`SELECT COUNT(*) as count FROM events e ${whereClause ? sql.unsafe(whereClause) : sql``}`;
    
    const recentEvents = await sql.unsafe(`
      SELECT e.id, e.event_type, e.page_path, e.page_url, e.timestamp, e.visitor_id, 
             e.user_agent, e.device_type, e.ip_address, e.referrer,
             e.utm_source, e.utm_medium, e.utm_campaign,
             e.country, e.city, e.region,
             v.email, v.name
      FROM events e
      LEFT JOIN visitors v ON e.visitor_id = v.id
      ${whereClause}
      ORDER BY e.timestamp DESC 
      LIMIT 100
    `);

    const deviceBreakdown = await sql.unsafe(`
      SELECT device_type, COUNT(*) as count 
      FROM events e
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} device_type IS NOT NULL
      GROUP BY device_type
    `);

    const userAgents = await sql.unsafe(`
      SELECT user_agent, COUNT(*) as count 
      FROM events e
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} user_agent IS NOT NULL
      GROUP BY user_agent
    `);

    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    
    for (let i = 0; i < userAgents.length; i++) {
      const row = userAgents[i];
      const parsed = parseUserAgent(String(row.user_agent || ''));
      const count = parseInt(String(row.count)) || 0;
      browserCounts[parsed.browser] = (browserCounts[parsed.browser] || 0) + count;
      osCounts[parsed.os] = (osCounts[parsed.os] || 0) + count;
    }

    const topPages = await sql.unsafe(`
      SELECT page_path, COUNT(*) as count 
      FROM events e
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} event_type = 'page_view' AND page_path IS NOT NULL
      GROUP BY page_path
      ORDER BY count DESC
      LIMIT 5
    `);

    const eventBreakdown = await sql.unsafe(`
      SELECT event_type, COUNT(*) as count 
      FROM events e
      ${whereClause}
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const trafficSources = await sql.unsafe(`
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
      FROM events e
      ${whereClause}
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    `);

    const countryBreakdown = await sql.unsafe(`
      SELECT country, COUNT(*) as count 
      FROM events e
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} country IS NOT NULL AND country != '' AND country != 'Unknown'
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `);

    const cityBreakdown = await sql.unsafe(`
      SELECT city, country, COUNT(*) as count 
      FROM events e
      ${whereClause}
      ${whereClause ? 'AND' : 'WHERE'} city IS NOT NULL AND city != '' AND city != 'Unknown'
      GROUP BY city, country
      ORDER BY count DESC
      LIMIT 10
    `);

    const identifiedUsers = await sql`
      SELECT id, email, name, phone, anonymous_id, first_seen_at, last_seen_at, visit_count
      FROM visitors
      WHERE is_identified = true
      ORDER BY last_seen_at DESC
      LIMIT 20
    `;

    // Get unique values for filter dropdowns
    const uniqueCountries = await sql`SELECT DISTINCT country FROM events WHERE country IS NOT NULL AND country != '' AND country != 'Unknown' ORDER BY country`;
    const uniqueEventTypes = await sql`SELECT DISTINCT event_type FROM events ORDER BY event_type`;

    const processedEvents = [];
    for (let i = 0; i < recentEvents.length; i++) {
      const event = recentEvents[i];
      const parsed = parseUserAgent(String(event.user_agent || ''));
      processedEvents.push({ ...event, browser: parsed.browser, os: parsed.os });
    }

    return NextResponse.json({
      stats: {
        totalVisitors: Number(visitorsResult[0].count),
        totalPageViews: Number(pageViewsResult[0].count),
        totalEvents: Number(eventsResult[0].count),
        identifiedVisitors: Number(identifiedUsers.length),
      },
      recentEvents: processedEvents,
      deviceBreakdown,
      browserBreakdown: Object.entries(browserCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      osBreakdown: Object.entries(osCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      topPages,
      eventBreakdown,
      trafficSources,
      countryBreakdown,
      cityBreakdown,
      identifiedUsers,
      filters: {
        countries: uniqueCountries.map(c => c.country),
        eventTypes: uniqueEventTypes.map(e => e.event_type),
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
