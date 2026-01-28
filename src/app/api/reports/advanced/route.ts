import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const sqlClient = neon(process.env.DATABASE_URL!);

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
  let query = `
    SELECT
      CASE
        WHEN e.utm_source IS NOT NULL THEN e.utm_source
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'google'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'facebook'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'bing'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
        WHEN e.page_url LIKE '%twclid=%' THEN 'twitter'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'tiktok'
        ELSE 'direct'
      END as source,
      CASE
        WHEN e.utm_medium IS NOT NULL THEN e.utm_medium
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'cpc'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'cpc'
        WHEN e.page_url LIKE '%twclid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'cpc'
        ELSE 'none'
      END as medium,
      COALESCE(e.utm_campaign, '(not set)') as campaign,
      COUNT(DISTINCT e.visitor_id) as unique_visitors,
      COUNT(DISTINCT e.session_id) as sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('pageview', 'page_view') THEN e.id END) as pageviews,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.id END) as conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.id END)::numeric /
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
      WHERE site_id = $1
      GROUP BY session_id
    ) session_duration ON session_duration.session_id = e.session_id
    WHERE e.site_id = $1
  `;

  const params: any[] = [siteId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND e.timestamp >= $${paramIndex}::timestamp`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND e.timestamp <= $${paramIndex}::timestamp`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.source) {
    query += ` AND e.utm_source = $${paramIndex}`;
    params.push(filters.source);
    paramIndex++;
  }
  if (filters.medium) {
    query += ` AND e.utm_medium = $${paramIndex}`;
    params.push(filters.medium);
    paramIndex++;
  }
  if (filters.campaign) {
    query += ` AND e.utm_campaign = $${paramIndex}`;
    params.push(filters.campaign);
    paramIndex++;
  }
  if (filters.country) {
    query += ` AND e.country = $${paramIndex}`;
    params.push(filters.country);
    paramIndex++;
  }

  query += `
    GROUP BY source, medium, campaign
    ORDER BY unique_visitors DESC
    LIMIT 100
  `;

  const results = await sqlClient(query, params);
  return results;
}

// Conversions Report
async function getConversionsReport(siteId: string, filters: ReportFilters) {
  let query = `
    SELECT
      e.event_type,
      CASE
        WHEN e.utm_source IS NOT NULL THEN e.utm_source
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'google'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'facebook'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'bing'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
        WHEN e.page_url LIKE '%twclid=%' THEN 'twitter'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'tiktok'
        ELSE 'direct'
      END as source,
      CASE
        WHEN e.utm_medium IS NOT NULL THEN e.utm_medium
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'cpc'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
        WHEN e.page_url LIKE '%twclid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'cpc'
        ELSE 'none'
      END as medium,
      COUNT(*) as conversion_count,
      COUNT(DISTINCT e.visitor_id) as unique_converters,
      COUNT(DISTINCT e.session_id) as converting_sessions,
      DATE(e.timestamp) as conversion_date
    FROM events e
    WHERE e.site_id = $1
      AND e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form', 'cta_click', 'form_start')
  `;

  const params: any[] = [siteId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND e.timestamp >= $${paramIndex}::timestamp`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND e.timestamp <= $${paramIndex}::timestamp`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.source) {
    query += ` AND e.utm_source = $${paramIndex}`;
    params.push(filters.source);
    paramIndex++;
  }
  if (filters.medium) {
    query += ` AND e.utm_medium = $${paramIndex}`;
    params.push(filters.medium);
    paramIndex++;
  }
  if (filters.event_type) {
    query += ` AND e.event_type = $${paramIndex}`;
    params.push(filters.event_type);
    paramIndex++;
  }

  query += `
    GROUP BY e.event_type, source, medium, DATE(e.timestamp)
    ORDER BY conversion_date DESC, conversion_count DESC
    LIMIT 500
  `;

  const results = await sqlClient(query, params);
  return results;
}

// User Behavior Report
async function getUserBehaviorReport(siteId: string, filters: ReportFilters) {
  let query1 = `
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
    WHERE site_id = $1
      AND event_type IN ('pageview', 'page_view')
      AND page_url IS NOT NULL
  `;

  const params1: any[] = [siteId];
  let paramIndex1 = 2;

  if (filters.date_from) {
    query1 += ` AND timestamp >= $${paramIndex1}::timestamp`;
    params1.push(filters.date_from);
    paramIndex1++;
  }
  if (filters.date_to) {
    query1 += ` AND timestamp <= $${paramIndex1}::timestamp`;
    params1.push(filters.date_to);
    paramIndex1++;
  }

  query1 += `
    GROUP BY page_url, page_title
    ORDER BY pageviews DESC
    LIMIT 50
  `;

  // Top Pages
  const topPages = await sqlClient(query1, params1);

  // Entry and Exit Pages
  let query2 = `
    WITH session_pages AS (
      SELECT
        session_id,
        page_url,
        timestamp,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp ASC) as entry_rank,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp DESC) as exit_rank
      FROM events
      WHERE site_id = $1
        AND event_type IN ('pageview', 'page_view')
        AND page_url IS NOT NULL
  `;

  const params2: any[] = [siteId];
  let paramIndex2 = 2;

  if (filters.date_from) {
    query2 += ` AND timestamp >= $${paramIndex2}::timestamp`;
    params2.push(filters.date_from);
    paramIndex2++;
  }
  if (filters.date_to) {
    query2 += ` AND timestamp <= $${paramIndex2}::timestamp`;
    params2.push(filters.date_to);
    paramIndex2++;
  }

  query2 += `
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
  `;

  const entryExitPages = await sqlClient(query2, params2);

  return {
    topPages,
    entryExitPages
  };
}

// Geographic Report
async function getGeographicReport(siteId: string, filters: ReportFilters) {
  let query = `
    SELECT
      COALESCE(country, 'Unknown') as country,
      COALESCE(city, 'Unknown') as city,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN id END) as conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN id END)::numeric /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
      ) as conversion_rate
    FROM events
    WHERE site_id = $1
  `;

  const params: any[] = [siteId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND timestamp >= $${paramIndex}::timestamp`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND timestamp <= $${paramIndex}::timestamp`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.country) {
    query += ` AND country = $${paramIndex}`;
    params.push(filters.country);
    paramIndex++;
  }

  query += `
    GROUP BY country, city
    ORDER BY unique_visitors DESC
    LIMIT 100
  `;

  const results = await sqlClient(query, params);
  return results;
}

// Devices Report
async function getDevicesReport(siteId: string, filters: ReportFilters) {
  let query = `
    SELECT
      COALESCE(device_type, 'Unknown') as device_type,
      COALESCE(browser, 'Unknown') as browser,
      COALESCE(os, 'Unknown') as os,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN id END) as conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN id END)::numeric /
        NULLIF(COUNT(DISTINCT session_id), 0) * 100,
        2
      ) as conversion_rate
    FROM events
    WHERE site_id = $1
  `;

  const params: any[] = [siteId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND timestamp >= $${paramIndex}::timestamp`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND timestamp <= $${paramIndex}::timestamp`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.device_type) {
    query += ` AND device_type = $${paramIndex}`;
    params.push(filters.device_type);
    paramIndex++;
  }

  query += `
    GROUP BY device_type, browser, os
    ORDER BY unique_visitors DESC
    LIMIT 100
  `;

  const results = await sqlClient(query, params);
  return results;
}

// Forms Report
async function getFormsReport(siteId: string, filters: ReportFilters) {
  let query = `
    SELECT
      COALESCE(e.page_url, 'Unknown') as form_page,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_start' THEN e.visitor_id END) as form_starts,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.visitor_id END) as form_submits,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_start' THEN e.session_id END) as sessions_with_start,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.session_id END) as sessions_with_submit,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.visitor_id END)::numeric /
        NULLIF(COUNT(DISTINCT CASE WHEN e.event_type = 'form_start' THEN e.visitor_id END), 0) * 100,
        2
      ) as completion_rate,
      CASE
        WHEN e.utm_source IS NOT NULL THEN e.utm_source
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'google'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'facebook'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'bing'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
        WHEN e.page_url LIKE '%twclid=%' THEN 'twitter'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'tiktok'
        ELSE 'direct'
      END as source,
      CASE
        WHEN e.utm_medium IS NOT NULL THEN e.utm_medium
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'cpc'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
        WHEN e.page_url LIKE '%twclid=%' THEN 'cpc'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'cpc'
        ELSE 'none'
      END as medium
    FROM events e
    WHERE e.site_id = $1
      AND e.event_type IN ('form_start', 'form_submit')
  `;

  const params: any[] = [siteId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND e.timestamp >= $${paramIndex}::timestamp`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND e.timestamp <= $${paramIndex}::timestamp`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.source) {
    query += ` AND e.utm_source = $${paramIndex}`;
    params.push(filters.source);
    paramIndex++;
  }
  if (filters.medium) {
    query += ` AND e.utm_medium = $${paramIndex}`;
    params.push(filters.medium);
    paramIndex++;
  }

  query += `
    GROUP BY e.page_url, source, medium
    ORDER BY form_starts DESC
    LIMIT 100
  `;

  const results = await sqlClient(query, params);
  return results;
}

// Custom Report - Overview with Filters
async function getCustomReport(siteId: string, filters: ReportFilters) {
  let query = `
    SELECT
      COUNT(DISTINCT e.visitor_id) as total_visitors,
      COUNT(DISTINCT e.session_id) as total_sessions,
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('pageview', 'page_view') THEN e.id END) as total_pageviews,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.id END) as total_conversions,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_start' THEN e.id END) as total_form_starts,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.id END) as total_form_submits,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.id END)::numeric /
        NULLIF(COUNT(DISTINCT e.session_id), 0) * 100,
        2
      ) as conversion_rate,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.id END)::numeric /
        NULLIF(COUNT(DISTINCT CASE WHEN e.event_type = 'form_start' THEN e.id END), 0) * 100,
        2
      ) as form_completion_rate,
      ROUND(AVG(session_metrics.pageviews_per_session), 2) as avg_pageviews_per_session,
      ROUND(AVG(session_metrics.duration), 0) as avg_session_duration,
      ROUND(
        COUNT(DISTINCT CASE WHEN session_metrics.pageviews_per_session = 1 THEN session_metrics.session_id END)::numeric /
        NULLIF(COUNT(DISTINCT e.session_id), 0) * 100,
        2
      ) as bounce_rate
    FROM events e
    LEFT JOIN (
      SELECT
        session_id,
        COUNT(*) as pageviews_per_session,
        EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration
      FROM events
      WHERE site_id = $1
      GROUP BY session_id
    ) session_metrics ON session_metrics.session_id = e.session_id
    WHERE e.site_id = $1
  `;

  const params: any[] = [siteId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND e.timestamp >= $${paramIndex}::timestamp`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND e.timestamp <= $${paramIndex}::timestamp`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.source) {
    query += ` AND e.utm_source = $${paramIndex}`;
    params.push(filters.source);
    paramIndex++;
  }
  if (filters.medium) {
    query += ` AND e.utm_medium = $${paramIndex}`;
    params.push(filters.medium);
    paramIndex++;
  }

  const overview = await sqlClient(query, params);
  return overview[0] || {};
}

// Entry/Exit Pages by Source Report
async function getEntryExitBySourceReport(siteId: string, filters: ReportFilters) {
  // First, get comprehensive metrics for this source
  const metricsQuery = `
    SELECT
      COUNT(DISTINCT e.visitor_id) as total_visitors,
      COUNT(DISTINCT e.session_id) as total_sessions,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('pageview', 'page_view') THEN e.id END) as total_pageviews,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.id END) as total_conversions,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_start' THEN e.id END) as form_starts,
      COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.id END) as form_submits,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.id END)::numeric /
        NULLIF(COUNT(DISTINCT e.session_id), 0) * 100,
        2
      ) as conversion_rate,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type = 'form_submit' THEN e.id END)::numeric /
        NULLIF(COUNT(DISTINCT CASE WHEN e.event_type = 'form_start' THEN e.id END), 0) * 100,
        2
      ) as form_completion_rate,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type IN ('pageview', 'page_view') THEN e.id END)::numeric /
        NULLIF(COUNT(DISTINCT e.session_id), 0),
        2
      ) as avg_pages_per_session,
      ROUND(AVG(session_duration.duration), 0) as avg_session_duration,
      ROUND(
        COUNT(DISTINCT CASE WHEN session_pageviews.pageviews = 1 THEN session_pageviews.session_id END)::numeric /
        NULLIF(COUNT(DISTINCT e.session_id), 0) * 100,
        2
      ) as bounce_rate
    FROM events e
    LEFT JOIN (
      SELECT
        session_id,
        EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration
      FROM events
      WHERE site_id = $1
      GROUP BY session_id
    ) session_duration ON session_duration.session_id = e.session_id
    LEFT JOIN (
      SELECT
        session_id,
        COUNT(*) as pageviews
      FROM events
      WHERE site_id = $1 AND event_type IN ('pageview', 'page_view')
      GROUP BY session_id
    ) session_pageviews ON session_pageviews.session_id = e.session_id
    WHERE e.site_id = $1
  `;

  const metricsParams: any[] = [siteId];
  let metricsIndex = 2;
  let metricsConditions = '';

  if (filters.date_from) {
    metricsConditions += ` AND e.timestamp >= $${metricsIndex}::timestamp`;
    metricsParams.push(filters.date_from);
    metricsIndex++;
  }
  if (filters.date_to) {
    metricsConditions += ` AND e.timestamp <= $${metricsIndex}::timestamp`;
    metricsParams.push(filters.date_to);
    metricsIndex++;
  }
  if (filters.source) {
    metricsConditions += ` AND (
      CASE
        WHEN e.utm_source IS NOT NULL THEN e.utm_source
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'google'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'facebook'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'bing'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
        WHEN e.page_url LIKE '%twclid=%' THEN 'twitter'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'tiktok'
        ELSE 'direct'
      END
    ) = $${metricsIndex}`;
    metricsParams.push(filters.source);
    metricsIndex++;
  }

  const metricsResult = await sqlClient(metricsQuery + metricsConditions, metricsParams);
  const metrics = metricsResult[0] || {};

  // Get top converting pages for this source
  const topPagesQuery = `
    SELECT
      e.page_url,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('pageview', 'page_view') THEN e.visitor_id END) as visitors,
      COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.visitor_id END) as conversions,
      ROUND(
        COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.visitor_id END)::numeric /
        NULLIF(COUNT(DISTINCT CASE WHEN e.event_type IN ('pageview', 'page_view') THEN e.visitor_id END), 0) * 100,
        2
      ) as conversion_rate
    FROM events e
    WHERE e.site_id = $1
      AND e.page_url IS NOT NULL
      ${metricsConditions}
    GROUP BY e.page_url
    HAVING COUNT(DISTINCT CASE WHEN e.event_type IN ('form_submit', 'purchase', 'sign_up', 'lead_form') THEN e.visitor_id END) > 0
    ORDER BY conversions DESC
    LIMIT 10
  `;

  const topPages = await sqlClient(topPagesQuery, metricsParams);

  // First, get debug info about what events exist
  const debugQuery = `
    SELECT
      COUNT(*) as total_events,
      COUNT(DISTINCT CASE WHEN event_type IN ('pageview', 'page_view') THEN id END) as pageview_events,
      COUNT(DISTINCT CASE WHEN page_url IS NOT NULL THEN id END) as events_with_url,
      COUNT(DISTINCT CASE WHEN event_type IN ('pageview', 'page_view') AND page_url IS NOT NULL THEN id END) as pageview_with_url,
      COUNT(DISTINCT session_id) as total_sessions,
      ARRAY_AGG(DISTINCT event_type) as event_types,
      ARRAY_AGG(DISTINCT
        CASE
          WHEN utm_source IS NOT NULL THEN utm_source
          WHEN page_url LIKE '%gclid=%' OR page_url LIKE '%gad_source=%' THEN 'google'
          WHEN page_url LIKE '%fbclid=%' THEN 'facebook'
          WHEN page_url LIKE '%msclkid=%' THEN 'bing'
          WHEN page_url LIKE '%li_fat_id=%' THEN 'linkedin'
          WHEN page_url LIKE '%twclid=%' THEN 'twitter'
          WHEN page_url LIKE '%ttclid=%' THEN 'tiktok'
          ELSE 'direct'
        END
      ) as sources
    FROM events
    WHERE site_id = $1
  `;

  const debugResults = await sqlClient(debugQuery, [siteId]);
  console.log('Debug info for site', siteId, ':', debugResults[0]);

  let query = `
    WITH session_pages AS (
      SELECT
        e.session_id,
        e.page_url,
        e.timestamp,
        CASE
          WHEN e.utm_source IS NOT NULL THEN e.utm_source
          WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'google'
          WHEN e.page_url LIKE '%fbclid=%' THEN 'facebook'
          WHEN e.page_url LIKE '%msclkid=%' THEN 'bing'
          WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
          WHEN e.page_url LIKE '%twclid=%' THEN 'twitter'
          WHEN e.page_url LIKE '%ttclid=%' THEN 'tiktok'
          ELSE 'direct'
        END as source,
        ROW_NUMBER() OVER (PARTITION BY e.session_id ORDER BY e.timestamp ASC) as entry_rank,
        ROW_NUMBER() OVER (PARTITION BY e.session_id ORDER BY e.timestamp DESC) as exit_rank
      FROM events e
      WHERE e.site_id = $1
        AND e.event_type IN ('pageview', 'page_view')
        AND e.page_url IS NOT NULL
  `;

  const params: any[] = [siteId];
  let paramIndex = 2;

  if (filters.date_from) {
    query += ` AND e.timestamp >= $${paramIndex}::timestamp`;
    params.push(filters.date_from);
    paramIndex++;
  }
  if (filters.date_to) {
    query += ` AND e.timestamp <= $${paramIndex}::timestamp`;
    params.push(filters.date_to);
    paramIndex++;
  }
  if (filters.source) {
    query += ` AND (
      CASE
        WHEN e.utm_source IS NOT NULL THEN e.utm_source
        WHEN e.page_url LIKE '%gclid=%' OR e.page_url LIKE '%gad_source=%' THEN 'google'
        WHEN e.page_url LIKE '%fbclid=%' THEN 'facebook'
        WHEN e.page_url LIKE '%msclkid=%' THEN 'bing'
        WHEN e.page_url LIKE '%li_fat_id=%' THEN 'linkedin'
        WHEN e.page_url LIKE '%twclid=%' THEN 'twitter'
        WHEN e.page_url LIKE '%ttclid=%' THEN 'tiktok'
        ELSE 'direct'
      END
    ) = $${paramIndex}`;
    params.push(filters.source);
    paramIndex++;
  }

  query += `
    )
    SELECT
      'entry' as page_type,
      page_url,
      source,
      COUNT(*) as sessions,
      COUNT(DISTINCT session_id) as unique_sessions
    FROM session_pages
    WHERE entry_rank = 1
    GROUP BY page_url, source
    UNION ALL
    SELECT
      'exit' as page_type,
      page_url,
      source,
      COUNT(*) as sessions,
      COUNT(DISTINCT session_id) as unique_sessions
    FROM session_pages
    WHERE exit_rank = 1
    GROUP BY page_url, source
    ORDER BY page_type, sessions DESC
    LIMIT 200
  `;

  const results = await sqlClient(query, params);
  console.log('Query returned', results.length, 'results for filters:', filters);

  // Separate into entry and exit pages
  const entryPages = results.filter((r: any) => r.page_type === 'entry');
  const exitPages = results.filter((r: any) => r.page_type === 'exit');

  return {
    metrics,
    topConvertingPages: topPages,
    entryPages,
    exitPages,
    debug: debugResults[0] // Include debug info in response
  };
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
      case 'forms':
        reportData = await getFormsReport(siteId, filters);
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
      case 'entry_exit_by_source':
        reportData = await getEntryExitBySourceReport(siteId, filters);
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
