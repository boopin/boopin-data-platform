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
    const dateFrom = searchParams.get('dateFrom') || '2020-01-01';
    const dateTo = searchParams.get('dateTo') || '2099-12-31';
    const eventType = searchParams.get('eventType') || 'all';
    const country = searchParams.get('country') || 'all';
    const device = searchParams.get('device') || 'all';

    // Get all events first, then filter in JS (simpler than dynamic SQL)
    const allEvents = await sql`
      SELECT e.id, e.event_type, e.page_path, e.page_url, e.timestamp, e.visitor_id, 
             e.user_agent, e.device_type, e.ip_address, e.referrer,
             e.utm_source, e.utm_medium, e.utm_campaign,
             e.country, e.city, e.region,
             v.email, v.name
      FROM events e
      LEFT JOIN visitors v ON e.visitor_id = v.id
      ORDER BY e.timestamp DESC
    `;

    // Apply filters
    let filteredEvents = allEvents.filter((e: Record<string, unknown>) => {
      const eventDate = new Date(e.timestamp as string).toISOString().split('T')[0];
      if (eventDate < dateFrom || eventDate > dateTo) return false;
      if (eventType !== 'all' && e.event_type !== eventType) return false;
      if (country !== 'all' && e.country !== country) return false;
      if (device !== 'all' && e.device_type !== device) return false;
      return true;
    });

    // Calculate stats from filtered events
    const uniqueVisitors = new Set(filteredEvents.map((e: Record<string, unknown>) => e.visitor_id));
    const pageViews = filteredEvents.filter((e: Record<string, unknown>) => e.event_type === 'page_view');

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    filteredEvents.forEach((e: Record<string, unknown>) => {
      const d = (e.device_type as string) || 'unknown';
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });

    // Browser and OS breakdown
    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    filteredEvents.forEach((e: Record<string, unknown>) => {
      const { browser, os } = parseUserAgent(String(e.user_agent || ''));
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      osCounts[os] = (osCounts[os] || 0) + 1;
    });

    // Event type breakdown
    const eventCounts: Record<string, number> = {};
    filteredEvents.forEach((e: Record<string, unknown>) => {
      const t = e.event_type as string;
      eventCounts[t] = (eventCounts[t] || 0) + 1;
    });

    // Country breakdown
    const countryCounts: Record<string, number> = {};
    filteredEvents.forEach((e: Record<string, unknown>) => {
      const c = (e.country as string) || '';
      if (c && c !== 'Unknown') {
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      }
    });

    // City breakdown
    const cityCounts: Record<string, { count: number; country: string }> = {};
    filteredEvents.forEach((e: Record<string, unknown>) => {
      const city = (e.city as string) || '';
      const country = (e.country as string) || '';
      if (city && city !== 'Unknown') {
        if (!cityCounts[city]) cityCounts[city] = { count: 0, country };
        cityCounts[city].count += 1;
      }
    });

    // Top pages
    const pageCounts: Record<string, number> = {};
    pageViews.forEach((e: Record<string, unknown>) => {
      const p = (e.page_path as string) || '/';
      pageCounts[p] = (pageCounts[p] || 0) + 1;
    });

    // Traffic sources
    const sourceCounts: Record<string, number> = {};
    filteredEvents.forEach((e: Record<string, unknown>) => {
      let source = (e.utm_source as string) || '';
      if (!source) {
        const ref = (e.referrer as string) || '';
        if (!ref) source = 'Direct';
        else if (ref.includes('google')) source = 'Google';
        else if (ref.includes('facebook')) source = 'Facebook';
        else if (ref.includes('twitter') || ref.includes('t.co')) source = 'Twitter';
        else if (ref.includes('linkedin')) source = 'LinkedIn';
        else source = 'Other';
      }
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Identified users
    const identifiedUsers = await sql`
      SELECT id, email, name, phone, anonymous_id, first_seen_at, last_seen_at, visit_count
      FROM visitors
      WHERE is_identified = true
      ORDER BY last_seen_at DESC
      LIMIT 20
    `;

    // Get unique values for filters
    const uniqueCountries = [...new Set(allEvents.map((e: Record<string, unknown>) => e.country).filter((c): c is string => !!c && c !== 'Unknown'))].sort();
    const uniqueEventTypes = [...new Set(allEvents.map((e: Record<string, unknown>) => e.event_type).filter((t): t is string => !!t))].sort();

    // Process events for display
    const processedEvents = filteredEvents.slice(0, 100).map((event: Record<string, unknown>) => {
      const { browser, os } = parseUserAgent(String(event.user_agent || ''));
      return { ...event, browser, os };
    });

    return NextResponse.json({
      stats: {
        totalVisitors: uniqueVisitors.size,
        totalPageViews: pageViews.length,
        totalEvents: filteredEvents.length,
        identifiedVisitors: identifiedUsers.length,
      },
      recentEvents: processedEvents,
      deviceBreakdown: Object.entries(deviceCounts).map(([device_type, count]) => ({ device_type, count })).sort((a, b) => b.count - a.count),
      browserBreakdown: Object.entries(browserCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      osBreakdown: Object.entries(osCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      topPages: Object.entries(pageCounts).map(([page_path, count]) => ({ page_path, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      eventBreakdown: Object.entries(eventCounts).map(([event_type, count]) => ({ event_type, count })).sort((a, b) => b.count - a.count),
      trafficSources: Object.entries(sourceCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      countryBreakdown: Object.entries(countryCounts).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      cityBreakdown: Object.entries(cityCounts).map(([city, data]) => ({ city, country: data.country, count: data.count })).sort((a, b) => b.count - a.count).slice(0, 10),
      identifiedUsers,
      filters: {
        countries: uniqueCountries,
        eventTypes: uniqueEventTypes,
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
