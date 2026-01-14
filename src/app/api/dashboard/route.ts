import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const country = searchParams.get('country');
    const eventType = searchParams.get('eventType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // For filtered queries, we'll use conditional logic
    // Base stats (always unfiltered for visitor count)
    let statsResult;
    let recentEvents;
    let deviceBreakdown;
    let browserBreakdown;
    let osBreakdown;
    let topPages;
    let eventBreakdown;
    let trafficSources;
    let sourceAndMediumBreakdown;
    let countryBreakdown;
    let cityBreakdown;

    // Apply filters based on what's provided
    if (!country && !eventType && !dateFrom) {
      // No filters - use simple queries
      statsResult = await sql`
        SELECT
          (SELECT COUNT(*) FROM visitors WHERE site_id = ${siteId}) as total_visitors,
          (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND site_id = ${siteId}) as total_page_views,
          (SELECT COUNT(*) FROM events WHERE site_id = ${siteId}) as total_events,
          (SELECT COUNT(*) FROM visitors WHERE is_identified = true AND site_id = ${siteId}) as identified_visitors
      `;

      recentEvents = await sql`
        SELECT
          e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
          e.visitor_id, e.user_agent, e.device_type, e.ip_address,
          e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
          e.country, e.city, e.region, e.properties,
          v.email, v.name, e.browser, e.os
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        WHERE e.site_id = ${siteId}
        ORDER BY e.timestamp DESC
        LIMIT 100
      `;

      deviceBreakdown = await sql`
        SELECT device_type, COUNT(*) as count
        FROM events WHERE device_type IS NOT NULL AND site_id = ${siteId}
        GROUP BY device_type ORDER BY count DESC
      `;

      browserBreakdown = await sql`
        SELECT browser as name, COUNT(*) as count
        FROM events WHERE browser IS NOT NULL AND site_id = ${siteId}
        GROUP BY browser ORDER BY count DESC LIMIT 10
      `;

      osBreakdown = await sql`
        SELECT os as name, COUNT(*) as count
        FROM events WHERE os IS NOT NULL AND site_id = ${siteId}
        GROUP BY os ORDER BY count DESC LIMIT 10
      `;

      topPages = await sql`
        SELECT page_path, COUNT(*) as count
        FROM events WHERE event_type = 'page_view' AND page_path IS NOT NULL AND site_id = ${siteId}
        GROUP BY page_path ORDER BY count DESC LIMIT 10
      `;

      eventBreakdown = await sql`
        SELECT event_type, COUNT(*) as count
        FROM events WHERE site_id = ${siteId}
        GROUP BY event_type ORDER BY count DESC
      `;

      trafficSources = await sql`
        SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
        FROM events WHERE event_type = 'page_view' AND site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
      `;

      sourceAndMediumBreakdown = await sql`
        SELECT
          COALESCE(utm_source, 'Direct') as source,
          COALESCE(utm_medium, 'None') as medium,
          COUNT(*) as sessions,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
          COUNT(CASE WHEN event_type IN ('purchase', 'form_submit', 'sign_up') THEN 1 END) as conversions
        FROM events
        WHERE site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct'), COALESCE(utm_medium, 'None')
        ORDER BY sessions DESC
        LIMIT 50
      `;

      countryBreakdown = await sql`
        SELECT country, COUNT(*) as count
        FROM events WHERE country IS NOT NULL AND site_id = ${siteId}
        GROUP BY country ORDER BY count DESC LIMIT 20
      `;

      cityBreakdown = await sql`
        SELECT city, country, COUNT(*) as count
        FROM events WHERE city IS NOT NULL AND site_id = ${siteId}
        GROUP BY city, country ORDER BY count DESC LIMIT 20
      `;

    } else if (dateFrom && !country && !eventType) {
      // Date filter only
      if (dateTo) {
        // With end date
        statsResult = await sql`
          SELECT
            (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}) as total_visitors,
            (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}) as total_page_views,
            (SELECT COUNT(*) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}) as total_events,
            (SELECT COUNT(DISTINCT e.visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.timestamp >= ${dateFrom}::timestamp AND e.timestamp <= ${dateTo}::timestamp AND e.site_id = ${siteId}) as identified_visitors
        `;
      } else {
        // Without end date (from date onwards)
        statsResult = await sql`
          SELECT
            (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}) as total_visitors,
            (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}) as total_page_views,
            (SELECT COUNT(*) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}) as total_events,
            (SELECT COUNT(DISTINCT e.visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.timestamp >= ${dateFrom}::timestamp AND e.site_id = ${siteId}) as identified_visitors
        `;
      }

      if (dateTo) {
        // With end date
        recentEvents = await sql`
          SELECT
            e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
            e.visitor_id, e.user_agent, e.device_type, e.ip_address,
            e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
            e.country, e.city, e.region, e.properties,
            v.email, v.name, e.browser, e.os
          FROM events e
          LEFT JOIN visitors v ON e.visitor_id = v.id
          WHERE e.timestamp >= ${dateFrom}::timestamp AND e.timestamp <= ${dateTo}::timestamp AND e.site_id = ${siteId}
          ORDER BY e.timestamp DESC
          LIMIT 100
        `;

        deviceBreakdown = await sql`
          SELECT device_type, COUNT(*) as count
          FROM events WHERE device_type IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY device_type ORDER BY count DESC
        `;

        browserBreakdown = await sql`
          SELECT browser as name, COUNT(*) as count
          FROM events WHERE browser IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY browser ORDER BY count DESC LIMIT 10
        `;

        osBreakdown = await sql`
          SELECT os as name, COUNT(*) as count
          FROM events WHERE os IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY os ORDER BY count DESC LIMIT 10
        `;

        topPages = await sql`
          SELECT page_path, COUNT(*) as count
          FROM events WHERE event_type = 'page_view' AND page_path IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY page_path ORDER BY count DESC LIMIT 10
        `;

        eventBreakdown = await sql`
          SELECT event_type, COUNT(*) as count
          FROM events WHERE timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY event_type ORDER BY count DESC
        `;

        trafficSources = await sql`
          SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
          FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
        `;

        sourceAndMediumBreakdown = await sql`
          SELECT
            COALESCE(utm_source, 'Direct') as source,
            COALESCE(utm_medium, 'None') as medium,
            COUNT(*) as sessions,
            COUNT(DISTINCT visitor_id) as unique_visitors,
            COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
            COUNT(CASE WHEN event_type IN ('purchase', 'form_submit', 'sign_up') THEN 1 END) as conversions
          FROM events
          WHERE timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY COALESCE(utm_source, 'Direct'), COALESCE(utm_medium, 'None')
          ORDER BY sessions DESC
          LIMIT 50
        `;

        countryBreakdown = await sql`
          SELECT country, COUNT(*) as count
          FROM events WHERE country IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY country ORDER BY count DESC LIMIT 20
        `;

        cityBreakdown = await sql`
          SELECT city, country, COUNT(*) as count
          FROM events WHERE city IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp AND site_id = ${siteId}
          GROUP BY city, country ORDER BY count DESC LIMIT 20
        `;
      } else {
        // Without end date
        recentEvents = await sql`
          SELECT
            e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
            e.visitor_id, e.user_agent, e.device_type, e.ip_address,
            e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
            e.country, e.city, e.region, e.properties,
            v.email, v.name, e.browser, e.os
          FROM events e
          LEFT JOIN visitors v ON e.visitor_id = v.id
          WHERE e.timestamp >= ${dateFrom}::timestamp AND e.site_id = ${siteId}
          ORDER BY e.timestamp DESC
          LIMIT 100
        `;

        deviceBreakdown = await sql`
          SELECT device_type, COUNT(*) as count
          FROM events WHERE device_type IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY device_type ORDER BY count DESC
        `;

        browserBreakdown = await sql`
          SELECT browser as name, COUNT(*) as count
          FROM events WHERE browser IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY browser ORDER BY count DESC LIMIT 10
        `;

        osBreakdown = await sql`
          SELECT os as name, COUNT(*) as count
          FROM events WHERE os IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY os ORDER BY count DESC LIMIT 10
        `;

        topPages = await sql`
          SELECT page_path, COUNT(*) as count
          FROM events WHERE event_type = 'page_view' AND page_path IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY page_path ORDER BY count DESC LIMIT 10
        `;

        eventBreakdown = await sql`
          SELECT event_type, COUNT(*) as count
          FROM events WHERE timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY event_type ORDER BY count DESC
        `;

        trafficSources = await sql`
          SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
          FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
        `;

        sourceAndMediumBreakdown = await sql`
          SELECT
            COALESCE(utm_source, 'Direct') as source,
            COALESCE(utm_medium, 'None') as medium,
            COUNT(*) as sessions,
            COUNT(DISTINCT visitor_id) as unique_visitors,
            COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
            COUNT(CASE WHEN event_type IN ('purchase', 'form_submit', 'sign_up') THEN 1 END) as conversions
          FROM events
          WHERE timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY COALESCE(utm_source, 'Direct'), COALESCE(utm_medium, 'None')
          ORDER BY sessions DESC
          LIMIT 50
        `;

        countryBreakdown = await sql`
          SELECT country, COUNT(*) as count
          FROM events WHERE country IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY country ORDER BY count DESC LIMIT 20
        `;

        cityBreakdown = await sql`
          SELECT city, country, COUNT(*) as count
          FROM events WHERE city IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
          GROUP BY city, country ORDER BY count DESC LIMIT 20
        `;
      }

    } else if (country && !eventType && !dateFrom) {
      // Country filter only
      statsResult = await sql`
        SELECT
          (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE country = ${country} AND site_id = ${siteId}) as total_visitors,
          (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND country = ${country} AND site_id = ${siteId}) as total_page_views,
          (SELECT COUNT(*) FROM events WHERE country = ${country} AND site_id = ${siteId}) as total_events,
          (SELECT COUNT(DISTINCT visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.country = ${country} AND e.site_id = ${siteId}) as identified_visitors
      `;

      recentEvents = await sql`
        SELECT 
          e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
          e.visitor_id, e.user_agent, e.device_type, e.ip_address,
          e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
          e.country, e.city, e.region, e.properties,
          v.email, v.name, e.browser, e.os
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        WHERE e.country = ${country} AND e.site_id = ${siteId}
        ORDER BY e.timestamp DESC
        LIMIT 100
      `;

      deviceBreakdown = await sql`
        SELECT device_type, COUNT(*) as count
        FROM events WHERE device_type IS NOT NULL AND country = ${country} AND site_id = ${siteId}
        GROUP BY device_type ORDER BY count DESC
      `;

      browserBreakdown = await sql`
        SELECT browser as name, COUNT(*) as count
        FROM events WHERE browser IS NOT NULL AND country = ${country} AND site_id = ${siteId}
        GROUP BY browser ORDER BY count DESC LIMIT 10
      `;

      osBreakdown = await sql`
        SELECT os as name, COUNT(*) as count
        FROM events WHERE os IS NOT NULL AND country = ${country} AND site_id = ${siteId}
        GROUP BY os ORDER BY count DESC LIMIT 10
      `;

      topPages = await sql`
        SELECT page_path, COUNT(*) as count
        FROM events WHERE event_type = 'page_view' AND page_path IS NOT NULL AND country = ${country} AND site_id = ${siteId}
        GROUP BY page_path ORDER BY count DESC LIMIT 10
      `;

      eventBreakdown = await sql`
        SELECT event_type, COUNT(*) as count
        FROM events WHERE country = ${country} AND site_id = ${siteId}
        GROUP BY event_type ORDER BY count DESC
      `;

      trafficSources = await sql`
        SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
        FROM events WHERE event_type = 'page_view' AND country = ${country} AND site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
      `;

      countryBreakdown = await sql`
        SELECT country, COUNT(*) as count
        FROM events WHERE country IS NOT NULL AND country = ${country} AND site_id = ${siteId}
        GROUP BY country ORDER BY count DESC LIMIT 20
      `;

      cityBreakdown = await sql`
        SELECT city, country, COUNT(*) as count
        FROM events WHERE city IS NOT NULL AND country = ${country} AND site_id = ${siteId}
        GROUP BY city, country ORDER BY count DESC LIMIT 20
      `;

    } else if (eventType && !country && !dateFrom) {
      // Event type filter only
      statsResult = await sql`
        SELECT
          (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE event_type = ${eventType} AND site_id = ${siteId}) as total_visitors,
          (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND site_id = ${siteId}) as total_page_views,
          (SELECT COUNT(*) FROM events WHERE event_type = ${eventType} AND site_id = ${siteId}) as total_events,
          (SELECT COUNT(DISTINCT e.visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.event_type = ${eventType} AND e.site_id = ${siteId}) as identified_visitors
      `;

      recentEvents = await sql`
        SELECT 
          e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
          e.visitor_id, e.user_agent, e.device_type, e.ip_address,
          e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
          e.country, e.city, e.region, e.properties,
          v.email, v.name, e.browser, e.os
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        WHERE e.event_type = ${eventType} AND e.site_id = ${siteId}
        ORDER BY e.timestamp DESC
        LIMIT 100
      `;

      deviceBreakdown = await sql`
        SELECT device_type, COUNT(*) as count
        FROM events WHERE device_type IS NOT NULL AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY device_type ORDER BY count DESC
      `;

      browserBreakdown = await sql`
        SELECT browser as name, COUNT(*) as count
        FROM events WHERE browser IS NOT NULL AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY browser ORDER BY count DESC LIMIT 10
      `;

      osBreakdown = await sql`
        SELECT os as name, COUNT(*) as count
        FROM events WHERE os IS NOT NULL AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY os ORDER BY count DESC LIMIT 10
      `;

      topPages = await sql`
        SELECT page_path, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId} AND page_path IS NOT NULL
        GROUP BY page_path ORDER BY count DESC LIMIT 10
      `;

      eventBreakdown = await sql`
        SELECT event_type, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY event_type ORDER BY count DESC
      `;

      trafficSources = await sql`
        SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
      `;

      countryBreakdown = await sql`
        SELECT country, COUNT(*) as count
        FROM events WHERE country IS NOT NULL AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY country ORDER BY count DESC LIMIT 20
      `;

      cityBreakdown = await sql`
        SELECT city, country, COUNT(*) as count
        FROM events WHERE city IS NOT NULL AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY city, country ORDER BY count DESC LIMIT 20
      `;

    } else if (dateFrom && country && !eventType) {
      // Date + Country filter
      statsResult = await sql`
        SELECT
          (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND country = ${country} AND site_id = ${siteId}) as total_visitors,
          (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND country = ${country} AND site_id = ${siteId}) as total_page_views,
          (SELECT COUNT(*) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND country = ${country} AND site_id = ${siteId}) as total_events,
          (SELECT COUNT(DISTINCT e.visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.timestamp >= ${dateFrom}::timestamp AND e.country = ${country} AND e.site_id = ${siteId}) as identified_visitors
      `;

      recentEvents = await sql`
        SELECT 
          e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
          e.visitor_id, e.user_agent, e.device_type, e.ip_address,
          e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
          e.country, e.city, e.region, e.properties,
          v.email, v.name, e.browser, e.os
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        WHERE e.timestamp >= ${dateFrom}::timestamp AND e.country = ${country}
        ORDER BY e.timestamp DESC
        LIMIT 100
      `;

      deviceBreakdown = await sql`
        SELECT device_type, COUNT(*) as count
        FROM events WHERE device_type IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY device_type ORDER BY count DESC
      `;

      browserBreakdown = await sql`
        SELECT browser as name, COUNT(*) as count
        FROM events WHERE browser IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY browser ORDER BY count DESC LIMIT 10
      `;

      osBreakdown = await sql`
        SELECT os as name, COUNT(*) as count
        FROM events WHERE os IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY os ORDER BY count DESC LIMIT 10
      `;

      topPages = await sql`
        SELECT page_path, COUNT(*) as count
        FROM events WHERE event_type = 'page_view' AND page_path IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY page_path ORDER BY count DESC LIMIT 10
      `;

      eventBreakdown = await sql`
        SELECT event_type, COUNT(*) as count
        FROM events WHERE timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY event_type ORDER BY count DESC
      `;

      trafficSources = await sql`
        SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
        FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
      `;

      countryBreakdown = await sql`
        SELECT country, COUNT(*) as count
        FROM events WHERE country IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY country ORDER BY count DESC LIMIT 20
      `;

      cityBreakdown = await sql`
        SELECT city, country, COUNT(*) as count
        FROM events WHERE city IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY city, country ORDER BY count DESC LIMIT 20
      `;

    } else if (dateFrom && eventType && !country) {
      // Date + Event Type filter
      statsResult = await sql`
        SELECT
          (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND event_type = ${eventType} AND site_id = ${siteId}) as total_visitors,
          (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}) as total_page_views,
          (SELECT COUNT(*) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND event_type = ${eventType} AND site_id = ${siteId}) as total_events,
          (SELECT COUNT(DISTINCT e.visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.timestamp >= ${dateFrom}::timestamp AND e.event_type = ${eventType} AND e.site_id = ${siteId}) as identified_visitors
      `;

      recentEvents = await sql`
        SELECT 
          e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
          e.visitor_id, e.user_agent, e.device_type, e.ip_address,
          e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
          e.country, e.city, e.region, e.properties,
          v.email, v.name, e.browser, e.os
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        WHERE e.timestamp >= ${dateFrom}::timestamp AND e.event_type = ${eventType}
        ORDER BY e.timestamp DESC
        LIMIT 100
      `;

      deviceBreakdown = await sql`
        SELECT device_type, COUNT(*) as count
        FROM events WHERE device_type IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY device_type ORDER BY count DESC
      `;

      browserBreakdown = await sql`
        SELECT browser as name, COUNT(*) as count
        FROM events WHERE browser IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY browser ORDER BY count DESC LIMIT 10
      `;

      osBreakdown = await sql`
        SELECT os as name, COUNT(*) as count
        FROM events WHERE os IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY os ORDER BY count DESC LIMIT 10
      `;

      topPages = await sql`
        SELECT page_path, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId} AND page_path IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
        GROUP BY page_path ORDER BY count DESC LIMIT 10
      `;

      eventBreakdown = await sql`
        SELECT event_type, COUNT(*) as count
        FROM events WHERE timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY event_type ORDER BY count DESC
      `;

      trafficSources = await sql`
        SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId} AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
      `;

      countryBreakdown = await sql`
        SELECT country, COUNT(*) as count
        FROM events WHERE country IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY country ORDER BY count DESC LIMIT 20
      `;

      cityBreakdown = await sql`
        SELECT city, country, COUNT(*) as count
        FROM events WHERE city IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY city, country ORDER BY count DESC LIMIT 20
      `;

    } else if (country && eventType && !dateFrom) {
      // Country + Event Type filter
      statsResult = await sql`
        SELECT
          (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE country = ${country} AND event_type = ${eventType} AND site_id = ${siteId}) as total_visitors,
          (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND country = ${country} AND site_id = ${siteId}) as total_page_views,
          (SELECT COUNT(*) FROM events WHERE country = ${country} AND event_type = ${eventType} AND site_id = ${siteId}) as total_events,
          (SELECT COUNT(DISTINCT e.visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.country = ${country} AND e.event_type = ${eventType} AND e.site_id = ${siteId}) as identified_visitors
      `;

      recentEvents = await sql`
        SELECT 
          e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
          e.visitor_id, e.user_agent, e.device_type, e.ip_address,
          e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
          e.country, e.city, e.region, e.properties,
          v.email, v.name, e.browser, e.os
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        WHERE e.country = ${country} AND e.event_type = ${eventType}
        ORDER BY e.timestamp DESC
        LIMIT 100
      `;

      deviceBreakdown = await sql`
        SELECT device_type, COUNT(*) as count
        FROM events WHERE device_type IS NOT NULL AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY device_type ORDER BY count DESC
      `;

      browserBreakdown = await sql`
        SELECT browser as name, COUNT(*) as count
        FROM events WHERE browser IS NOT NULL AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY browser ORDER BY count DESC LIMIT 10
      `;

      osBreakdown = await sql`
        SELECT os as name, COUNT(*) as count
        FROM events WHERE os IS NOT NULL AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY os ORDER BY count DESC LIMIT 10
      `;

      topPages = await sql`
        SELECT page_path, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId} AND page_path IS NOT NULL AND country = ${country} AND site_id = ${siteId}
        GROUP BY page_path ORDER BY count DESC LIMIT 10
      `;

      eventBreakdown = await sql`
        SELECT event_type, COUNT(*) as count
        FROM events WHERE country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY event_type ORDER BY count DESC
      `;

      trafficSources = await sql`
        SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
      `;

      countryBreakdown = await sql`
        SELECT country, COUNT(*) as count
        FROM events WHERE country IS NOT NULL AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY country ORDER BY count DESC LIMIT 20
      `;

      cityBreakdown = await sql`
        SELECT city, country, COUNT(*) as count
        FROM events WHERE city IS NOT NULL AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY city, country ORDER BY count DESC LIMIT 20
      `;

    } else {
      // All three filters
      statsResult = await sql`
        SELECT
          (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND country = ${country} AND event_type = ${eventType} AND site_id = ${siteId}) as total_visitors,
          (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND timestamp >= ${dateFrom}::timestamp AND country = ${country} AND site_id = ${siteId}) as total_page_views,
          (SELECT COUNT(*) FROM events WHERE timestamp >= ${dateFrom}::timestamp AND country = ${country} AND event_type = ${eventType} AND site_id = ${siteId}) as total_events,
          (SELECT COUNT(DISTINCT e.visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.timestamp >= ${dateFrom}::timestamp AND e.country = ${country} AND e.event_type = ${eventType} AND e.site_id = ${siteId}) as identified_visitors
      `;

      recentEvents = await sql`
        SELECT 
          e.id, e.event_type, e.page_path, e.page_url, e.timestamp,
          e.visitor_id, e.user_agent, e.device_type, e.ip_address,
          e.referrer, e.utm_source, e.utm_medium, e.utm_campaign,
          e.country, e.city, e.region, e.properties,
          v.email, v.name, e.browser, e.os
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        WHERE e.timestamp >= ${dateFrom}::timestamp AND e.country = ${country} AND e.event_type = ${eventType}
        ORDER BY e.timestamp DESC
        LIMIT 100
      `;

      deviceBreakdown = await sql`
        SELECT device_type, COUNT(*) as count
        FROM events WHERE device_type IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY device_type ORDER BY count DESC
      `;

      browserBreakdown = await sql`
        SELECT browser as name, COUNT(*) as count
        FROM events WHERE browser IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY browser ORDER BY count DESC LIMIT 10
      `;

      osBreakdown = await sql`
        SELECT os as name, COUNT(*) as count
        FROM events WHERE os IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY os ORDER BY count DESC LIMIT 10
      `;

      topPages = await sql`
        SELECT page_path, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId} AND page_path IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY page_path ORDER BY count DESC LIMIT 10
      `;

      eventBreakdown = await sql`
        SELECT event_type, COUNT(*) as count
        FROM events WHERE timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY event_type ORDER BY count DESC
      `;

      trafficSources = await sql`
        SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
        FROM events WHERE event_type = ${eventType} AND site_id = ${siteId} AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId}
        GROUP BY COALESCE(utm_source, 'Direct') ORDER BY count DESC LIMIT 10
      `;

      countryBreakdown = await sql`
        SELECT country, COUNT(*) as count
        FROM events WHERE country IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY country ORDER BY count DESC LIMIT 20
      `;

      cityBreakdown = await sql`
        SELECT city, country, COUNT(*) as count
        FROM events WHERE city IS NOT NULL AND timestamp >= ${dateFrom}::timestamp AND site_id = ${siteId} AND country = ${country} AND site_id = ${siteId} AND event_type = ${eventType} AND site_id = ${siteId}
        GROUP BY city, country ORDER BY count DESC LIMIT 20
      `;
    }

    // Identified users (always unfiltered)
    const identifiedUsers = await sql`
      SELECT 
        v.id, v.email, v.name, v.phone, v.anonymous_id,
        v.first_seen_at, v.last_seen_at, v.visit_count
      FROM visitors v
      WHERE v.is_identified = true
      ORDER BY v.last_seen_at DESC
      LIMIT 50
    `;

    // Get filter options (always unfiltered)
    const countries = await sql`
      SELECT DISTINCT country FROM events WHERE country IS NOT NULL  AND site_id = ${siteId} ORDER BY country
    `;
    const eventTypes = await sql`
      SELECT DISTINCT event_type FROM events WHERE site_id = ${siteId} ORDER BY event_type
    `;

    // Get unique sources and mediums for filters
    const sources = await sql`
      SELECT DISTINCT COALESCE(utm_source, 'Direct') as source
      FROM events
      WHERE site_id = ${siteId}
      ORDER BY source
    `;

    const mediums = await sql`
      SELECT DISTINCT COALESCE(utm_medium, 'None') as medium
      FROM events
      WHERE site_id = ${siteId}
      ORDER BY medium
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
      sourceAndMediumBreakdown,
      countryBreakdown,
      cityBreakdown,
      identifiedUsers,
      filters: {
        countries: countries.map((c) => c.country),
        eventTypes: eventTypes.map((e) => e.event_type),
        sources: sources.map((s) => s.source),
        mediums: mediums.map((m) => m.medium),
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
