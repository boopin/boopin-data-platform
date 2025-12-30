import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const eventType = searchParams.get('eventType');
    const dateFrom = searchParams.get('dateFrom');

    // Build WHERE conditions
    let conditions = [];
    let eventConditions = [];
    
    if (country) {
      conditions.push(`country = '${country}'`);
      eventConditions.push(`e.country = '${country}'`);
    }
    if (eventType) {
      conditions.push(`event_type = '${eventType}'`);
      eventConditions.push(`e.event_type = '${eventType}'`);
    }
    if (dateFrom) {
      conditions.push(`timestamp >= '${dateFrom}'`);
      eventConditions.push(`e.timestamp >= '${dateFrom}'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const eventWhereClause = eventConditions.length > 0 ? `WHERE ${eventConditions.join(' AND ')}` : '';

    // Stats
    const statsResult = await sql.unsafe(`
      SELECT 
        (SELECT COUNT(*) FROM visitors) as total_visitors,
        (SELECT COUNT(*) FROM events ${whereClause.replace('timestamp', 'timestamp').replace('country', 'country').replace('event_type', 'event_type')} ${conditions.length > 0 && !conditions.some(c => c.includes('event_type')) ? (whereClause ? ' AND' : 'WHERE') + " event_type = 'page_view'" : conditions.length > 0 ? '' : "WHERE event_type = 'page_view'"}) as total_page_views,
        (SELECT COUNT(*) FROM events ${whereClause}) as total_events,
        (SELECT COUNT(*) FROM visitors WHERE is_identified = true) as identified_visitors
    `);

    // Recent events with visitor info
    const recentEvents = await sql.unsafe(`
      SELECT 
        e.id,
        e.event_type,
        e.page_path,
        e.page_url,
        e.timestamp,
        e.visitor_id,
        e.user_agent,
        e.device_type,
        e.ip_address,
        e.referrer,
        e.utm_source,
        e.utm_medium,
        e.utm_campaign,
        e.country,
        e.city,
        e.region,
        e.properties,
        v.email,
        v.name,
        e.browser,
        e.os
      FROM events e
      LEFT JOIN visitors v ON e.visitor_id = v.id
      ${eventWhereClause}
      ORDER BY e.timestamp DESC
      LIMIT 100
    `);

    // Device breakdown
    const deviceBreakdown = await sql.unsafe(`
      SELECT device_type, COUNT(*) as count
      FROM events
      ${whereClause ? whereClause + ' AND' : 'WHERE'} device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY count DESC
    `);

    // Browser breakdown
    const browserBreakdown = await sql.unsafe(`
      SELECT browser as name, COUNT(*) as count
      FROM events
      ${whereClause ? whereClause + ' AND' : 'WHERE'} browser IS NOT NULL
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 10
    `);

    // OS breakdown
    const osBreakdown = await sql.unsafe(`
      SELECT os as name, COUNT(*) as count
      FROM events
      ${whereClause ? whereClause + ' AND' : 'WHERE'} os IS NOT NULL
      GROUP BY os
      ORDER BY count DESC
      LIMIT 10
    `);

    // Top pages
    const topPages = await sql.unsafe(`
      SELECT page_path, COUNT(*) as count
      FROM events
      ${whereClause ? whereClause + ' AND' : 'WHERE'} event_type = 'page_view' AND page_path IS NOT NULL
      GROUP BY page_path
      ORDER BY count DESC
      LIMIT 10
    `);

    // Event breakdown
    const eventBreakdown = await sql.unsafe(`
      SELECT event_type, COUNT(*) as count
      FROM events
      ${whereClause}
      GROUP BY event_type
      ORDER BY count DESC
    `);

    // Traffic sources
    const trafficSources = await sql.unsafe(`
      SELECT 
        COALESCE(utm_source, 'Direct') as source,
        COUNT(*) as count
      FROM events
      ${whereClause ? whereClause + ' AND' : 'WHERE'} event_type = 'page_view'
      GROUP BY COALESCE(utm_source, 'Direct')
      ORDER BY count DESC
      LIMIT 10
    `);

    // Country breakdown
    const countryBreakdown = await sql.unsafe(`
      SELECT country, COUNT(*) as count
      FROM events
      ${whereClause ? whereClause + ' AND' : 'WHERE'} country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 20
    `);

    // City breakdown
    const cityBreakdown = await sql.unsafe(`
      SELECT city, country, COUNT(*) as count
      FROM events
      ${whereClause ? whereClause + ' AND' : 'WHERE'} city IS NOT NULL
      GROUP BY city, country
      ORDER BY count DESC
      LIMIT 20
    `);

    // Identified users
    const identifiedUsers = await sql`
      SELECT 
        v.id,
        v.email,
        v.name,
        v.phone,
        v.anonymous_id,
        v.first_seen_at,
        v.last_seen_at,
        v.visit_count
      FROM visitors v
      WHERE v.is_identified = true
      ORDER BY v.last_seen_at DESC
      LIMIT 50
    `;

    // Get filter options (always unfiltered)
    const countries = await sql`
      SELECT DISTINCT country FROM events WHERE country IS NOT NULL ORDER BY country
    `;
    const eventTypes = await sql`
      SELECT DISTINCT event_type FROM events ORDER BY event_type
    `;

    return NextResponse.json({
      stats: {
        totalVisitors: parseInt(statsResult[0]?.total_visitors) || 0,
        totalPageViews: parseInt(statsResult[0]?.total_page_views) || 0,
        totalEvents: parseInt(statsResult[0]?.total_events) || 0,
        identifiedVisitors: parseInt(statsResult[0]?.identified_visitors) || 0,
      },
      recentEvents,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      topPages,
      eventBreakdown,
      trafficSources,
      countryBreakdown,
      cityBreakdown,
      identifiedUsers,
      filters: {
        countries: countries.map((c) => c.country),
        eventTypes: eventTypes.map((e) => e.event_type),
      }
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
