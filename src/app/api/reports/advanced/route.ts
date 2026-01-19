import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ReportFilters {
  date_from?: string;
  date_to?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  country?: string;
  device_type?: string;
  event_type?: string;
}

// Traffic Sources Report
async function getTrafficSourcesReport(siteId: string, filters: ReportFilters) {
  const whereConditions = [`e.site_id = ${siteId}`];

  if (filters.date_from) {
    whereConditions.push(`e.timestamp >= '${filters.date_from}'::timestamp`);
  }
  if (filters.date_to) {
    whereConditions.push(`e.timestamp <= '${filters.date_to}'::timestamp`);
  }
  if (filters.source) {
    whereConditions.push(`e.source = '${filters.source}'`);
  }
  if (filters.medium) {
    whereConditions.push(`e.medium = '${filters.medium}'`);
  }
  if (filters.campaign) {
    whereConditions.push(`e.campaign = '${filters.campaign}'`);
  }
  if (filters.country) {
    whereConditions.push(`e.country = '${filters.country}'`);
  }

  const whereClause = whereConditions.join(' AND ');

  const results = await sql.unsafe(`
    SELECT
      COALESCE(e.source, 'direct') as source,
      COALESCE(e.medium, 'none') as medium,
      COALESCE(e.campaign, '(not set)') as campaign,
      COUNT(DISTINCT e.visitor_id) as unique_visitors,
      COUNT(DISTINCT e.session_id) as sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN e.event_type = 'pageview' THEN e.id END) as pageviews,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('lead_form', 'purchase', 'signup') THEN e.id END) as conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type IN ('lead_form', 'purchase', 'signup') THEN e.id END)::numeric /
        NULLIF(COUNT(DISTINCT e.session_id), 0) * 100,
        2
      ) as conversion_rate,
      ROUND(AVG(session_duration.duration), 0) as avg_session_duration
    FROM events e
    LEFT JOIN (
      SELECT
        session_id,
        EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration
      FROM events
      WHERE site_id = '${siteId}'
      GROUP BY session_id
    ) session_duration ON session_duration.session_id = e.session_id
    WHERE ${whereClause}
    GROUP BY e.source, e.medium, e.campaign
    ORDER BY unique_visitors DESC
    LIMIT 100
  `);

  return results;
}

// Conversions Report
async function getConversionsReport(siteId: string, filters: ReportFilters) {
  const whereConditions = [`e.site_id = ${siteId}`];
  whereConditions.push(`e.event_type IN ('lead_form', 'purchase', 'signup', 'cta_click')`);

  if (filters.date_from) {
    whereConditions.push(`e.timestamp >= '${filters.date_from}'::timestamp`);
  }
  if (filters.date_to) {
    whereConditions.push(`e.timestamp <= '${filters.date_to}'::timestamp`);
  }
  if (filters.source) {
    whereConditions.push(`e.source = '${filters.source}'`);
  }
  if (filters.medium) {
    whereConditions.push(`e.medium = '${filters.medium}'`);
  }
  if (filters.event_type) {
    whereConditions.push(`e.event_type = '${filters.event_type}'`);
  }

  const whereClause = whereConditions.join(' AND ');

  const results = await sql.unsafe(`
    SELECT
      e.event_type,
      COALESCE(e.source, 'direct') as source,
      COALESCE(e.medium, 'none') as medium,
      COUNT(*) as conversion_count,
      COUNT(DISTINCT e.visitor_id) as unique_converters,
      COUNT(DISTINCT e.session_id) as converting_sessions,
      DATE(e.timestamp) as conversion_date
    FROM events e
    WHERE ${whereClause}
    GROUP BY e.event_type, e.source, e.medium, DATE(e.timestamp)
    ORDER BY conversion_date DESC, conversion_count DESC
    LIMIT 500
  `);

  return results;
}

// User Behavior Report
async function getUserBehaviorReport(siteId: string, filters: ReportFilters) {
  const whereConditions = [`site_id = '${siteId}'`];

  if (filters.date_from) {
    whereConditions.push(`timestamp >= '${filters.date_from}'::timestamp`);
  }
  if (filters.date_to) {
    whereConditions.push(`timestamp <= '${filters.date_to}'::timestamp`);
  }

  const whereClause = whereConditions.join(' AND ');

  // Top Pages
  const topPages = await sql.unsafe(`
    SELECT
      page_url,
      page_title,
      COUNT(*) as pageviews,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      COUNT(DISTINCT session_id) as sessions,
      ROUND(AVG(
        CASE
          WHEN (properties->>'time_on_page')::numeric > 0
          THEN (properties->>'time_on_page')::numeric
        END
      ), 0) as avg_time_on_page
    FROM events
    WHERE ${whereClause}
      AND event_type = 'pageview'
      AND page_url IS NOT NULL
    GROUP BY page_url, page_title
    ORDER BY pageviews DESC
    LIMIT 50
  `);

  // Entry and Exit Pages
  const entryExitPages = await sql.unsafe(`
    WITH session_pages AS (
      SELECT
        session_id,
        page_url,
        timestamp,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp ASC) as entry_rank,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp DESC) as exit_rank
      FROM events
      WHERE ${whereClause}
        AND event_type = 'pageview'
        AND page_url IS NOT NULL
    )
    SELECT
      'entry' as page_type,
      page_url,
      COUNT(*) as count
    FROM session_pages
    WHERE entry_rank = 1
    GROUP BY page_url
    UNION ALL
    SELECT
      'exit' as page_type,
      page_url,
      COUNT(*) as count
    FROM session_pages
    WHERE exit_rank = 1
    GROUP BY page_url
    ORDER BY page_type, count DESC
    LIMIT 100
  `);

  return {
    topPages,
    entryExitPages
  };
}

// Geographic Report
async function getGeographicReport(siteId: string, filters: ReportFilters) {
  const whereConditions = [`site_id = '${siteId}'`];

  if (filters.date_from) {
    whereConditions.push(`timestamp >= '${filters.date_from}'::timestamp`);
  }
  if (filters.date_to) {
    whereConditions.push(`timestamp <= '${filters.date_to}'::timestamp`);
  }
  if (filters.country) {
    whereConditions.push(`country = '${filters.country}'`);
  }

  const whereClause = whereConditions.join(' AND ');

  const results = await sql.unsafe(`
    SELECT
      COALESCE(country, 'Unknown') as country,
      COALESCE(city, 'Unknown') as city,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN event_type IN ('lead_form', 'purchase', 'signup') THEN id END) as conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN event_type IN ('lead_form', 'purchase', 'signup') THEN id END)::numeric /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
      ) as conversion_rate
    FROM events
    WHERE ${whereClause}
    GROUP BY country, city
    ORDER BY unique_visitors DESC
    LIMIT 100
  `);

  return results;
}

// Devices Report
async function getDevicesReport(siteId: string, filters: ReportFilters) {
  const whereConditions = [`site_id = '${siteId}'`];

  if (filters.date_from) {
    whereConditions.push(`timestamp >= '${filters.date_from}'::timestamp`);
  }
  if (filters.date_to) {
    whereConditions.push(`timestamp <= '${filters.date_to}'::timestamp`);
  }
  if (filters.device_type) {
    whereConditions.push(`device_type = '${filters.device_type}'`);
  }

  const whereClause = whereConditions.join(' AND ');

  const results = await sql.unsafe(`
    SELECT
      COALESCE(device_type, 'Unknown') as device_type,
      COALESCE(browser, 'Unknown') as browser,
      COALESCE(os, 'Unknown') as os,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN event_type IN ('lead_form', 'purchase', 'signup') THEN id END) as conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN event_type IN ('lead_form', 'purchase', 'signup') THEN id END)::numeric /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
      ) as conversion_rate
    FROM events
    WHERE ${whereClause}
    GROUP BY device_type, browser, os
    ORDER BY unique_visitors DESC
    LIMIT 100
  `);

  return results;
}

// Custom Report - Overview with Filters
async function getCustomReport(siteId: string, filters: ReportFilters) {
  const whereConditions = [`site_id = '${siteId}'`];

  if (filters.date_from) {
    whereConditions.push(`timestamp >= '${filters.date_from}'::timestamp`);
  }
  if (filters.date_to) {
    whereConditions.push(`timestamp <= '${filters.date_to}'::timestamp`);
  }
  if (filters.source) {
    whereConditions.push(`source = '${filters.source}'`);
  }
  if (filters.medium) {
    whereConditions.push(`medium = '${filters.medium}'`);
  }

  const whereClause = whereConditions.join(' AND ');

  const overview = await sql.unsafe(`
    SELECT
      COUNT(DISTINCT visitor_id) as total_visitors,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN event_type = 'pageview' THEN id END) as total_pageviews,
      COUNT(DISTINCT CASE WHEN event_type IN ('lead_form', 'purchase', 'signup') THEN id END) as total_conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN event_type IN ('lead_form', 'purchase', 'signup') THEN id END)::numeric /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
      ) as conversion_rate,
      ROUND(AVG(session_metrics.pageviews_per_session), 2) as avg_pageviews_per_session,
      ROUND(AVG(session_metrics.duration), 0) as avg_session_duration,
      ROUND(
        COUNT(DISTINCT CASE WHEN session_metrics.pageviews_per_session = 1 THEN session_metrics.session_id END)::numeric /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
      ) as bounce_rate
    FROM events e
    LEFT JOIN (
      SELECT
        session_id,
        COUNT(*) as pageviews_per_session,
        EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration
      FROM events
      WHERE site_id = '${siteId}'
      GROUP BY session_id
    ) session_metrics ON session_metrics.session_id = e.session_id
    WHERE ${whereClause}
  `);

  return overview[0] || {};
}

// Main GET endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const reportType = searchParams.get('report_type') || 'overview';

    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Build filters object
    const filters: ReportFilters = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      source: searchParams.get('source') || undefined,
      medium: searchParams.get('medium') || undefined,
      campaign: searchParams.get('campaign') || undefined,
      country: searchParams.get('country') || undefined,
      device_type: searchParams.get('device_type') || undefined,
      event_type: searchParams.get('event_type') || undefined,
    };

    let reportData;

    switch (reportType) {
      case 'traffic_sources':
        reportData = await getTrafficSourcesReport(siteId, filters);
        break;
      case 'conversions':
        reportData = await getConversionsReport(siteId, filters);
        break;
      case 'user_behavior':
        reportData = await getUserBehaviorReport(siteId, filters);
        break;
      case 'geographic':
        reportData = await getGeographicReport(siteId, filters);
        break;
      case 'devices':
        reportData = await getDevicesReport(siteId, filters);
        break;
      case 'overview':
      default:
        reportData = await getCustomReport(siteId, filters);
        break;
    }

    return NextResponse.json({
      reportType,
      filters,
      data: reportData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
