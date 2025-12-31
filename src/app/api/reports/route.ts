import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DateRange {
  from: Date;
  to: Date;
}

function calculateDateRanges(mode: string, customFrom?: string, customTo?: string): { current: DateRange; comparison: DateRange } {
  const now = new Date();

  if (mode === 'custom' && customFrom && customTo) {
    const currentFrom = new Date(customFrom);
    const currentTo = new Date(customTo);
    const duration = currentTo.getTime() - currentFrom.getTime();
    const comparisonFrom = new Date(currentFrom.getTime() - duration);
    const comparisonTo = new Date(currentFrom);

    return {
      current: { from: currentFrom, to: currentTo },
      comparison: { from: comparisonFrom, to: comparisonTo }
    };
  }

  switch (mode) {
    case 'wow': { // Week over Week
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - 7);
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - 14);
      const lastWeekEnd = new Date(now);
      lastWeekEnd.setDate(now.getDate() - 7);

      return {
        current: { from: currentWeekStart, to: now },
        comparison: { from: lastWeekStart, to: lastWeekEnd }
      };
    }

    case 'mom': { // Month over Month
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      return {
        current: { from: currentMonthStart, to: now },
        comparison: { from: lastMonthStart, to: lastMonthEnd }
      };
    }

    case 'qoq': { // Quarter over Quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const currentQuarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
      const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59);

      return {
        current: { from: currentQuarterStart, to: now },
        comparison: { from: lastQuarterStart, to: lastQuarterEnd }
      };
    }

    case 'yoy': { // Year over Year
      const currentYearStart = new Date(now.getFullYear(), 0, 1);
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

      return {
        current: { from: currentYearStart, to: now },
        comparison: { from: lastYearStart, to: lastYearEnd }
      };
    }

    default: // Default to WoW
      const defaultWeekStart = new Date(now);
      defaultWeekStart.setDate(now.getDate() - 7);
      const defaultLastWeekStart = new Date(now);
      defaultLastWeekStart.setDate(now.getDate() - 14);
      const defaultLastWeekEnd = new Date(now);
      defaultLastWeekEnd.setDate(now.getDate() - 7);

      return {
        current: { from: defaultWeekStart, to: now },
        comparison: { from: defaultLastWeekStart, to: defaultLastWeekEnd }
      };
  }
}

async function getStats(from: Date, to: Date) {
  const result = await sql`
    SELECT
      (SELECT COUNT(DISTINCT visitor_id) FROM events WHERE timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as total_visitors,
      (SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as total_page_views,
      (SELECT COUNT(*) FROM events WHERE timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as total_events,
      (SELECT COUNT(DISTINCT visitor_id) FROM events e JOIN visitors v ON e.visitor_id = v.id WHERE v.is_identified = true AND e.timestamp >= ${from.toISOString()} AND e.timestamp <= ${to.toISOString()}) as identified_visitors,
      (SELECT COUNT(*) FROM events WHERE event_type = 'form_submit' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as form_submits,
      (SELECT COUNT(*) FROM events WHERE event_type = 'purchase' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as purchases,
      (SELECT COUNT(*) FROM events WHERE event_type = 'add_to_cart' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as add_to_carts,
      (SELECT COUNT(*) FROM events WHERE event_type = 'cart_abandon' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as cart_abandons,
      (SELECT COUNT(*) FROM events WHERE event_type = 'form_start' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as form_starts,
      (SELECT COUNT(*) FROM events WHERE event_type = 'sign_up' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as signups,
      (SELECT COUNT(*) FROM events WHERE event_type = 'login' AND timestamp >= ${from.toISOString()} AND timestamp <= ${to.toISOString()}) as logins
  `;

  const deviceBreakdown = await sql`
    SELECT device_type, COUNT(*) as count
    FROM events
    WHERE device_type IS NOT NULL
    AND timestamp >= ${from.toISOString()}
    AND timestamp <= ${to.toISOString()}
    GROUP BY device_type
    ORDER BY count DESC
  `;

  const topPages = await sql`
    SELECT page_path, COUNT(*) as count
    FROM events
    WHERE event_type = 'page_view'
    AND page_path IS NOT NULL
    AND timestamp >= ${from.toISOString()}
    AND timestamp <= ${to.toISOString()}
    GROUP BY page_path
    ORDER BY count DESC
    LIMIT 10
  `;

  const trafficSources = await sql`
    SELECT COALESCE(utm_source, 'Direct') as source, COUNT(*) as count
    FROM events
    WHERE event_type = 'page_view'
    AND timestamp >= ${from.toISOString()}
    AND timestamp <= ${to.toISOString()}
    GROUP BY COALESCE(utm_source, 'Direct')
    ORDER BY count DESC
    LIMIT 10
  `;

  const countryBreakdown = await sql`
    SELECT country, COUNT(*) as count
    FROM events
    WHERE country IS NOT NULL
    AND timestamp >= ${from.toISOString()}
    AND timestamp <= ${to.toISOString()}
    GROUP BY country
    ORDER BY count DESC
    LIMIT 10
  `;

  return {
    totalVisitors: parseInt(result[0]?.total_visitors) || 0,
    totalPageViews: parseInt(result[0]?.total_page_views) || 0,
    totalEvents: parseInt(result[0]?.total_events) || 0,
    identifiedVisitors: parseInt(result[0]?.identified_visitors) || 0,
    formSubmits: parseInt(result[0]?.form_submits) || 0,
    purchases: parseInt(result[0]?.purchases) || 0,
    addToCarts: parseInt(result[0]?.add_to_carts) || 0,
    cartAbandons: parseInt(result[0]?.cart_abandons) || 0,
    formStarts: parseInt(result[0]?.form_starts) || 0,
    signups: parseInt(result[0]?.signups) || 0,
    logins: parseInt(result[0]?.logins) || 0,
    deviceBreakdown,
    topPages,
    trafficSources,
    countryBreakdown
  };
}

function calculateChange(current: number, previous: number): { value: number; percentage: number; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return { value: current, percentage: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
  }

  const diff = current - previous;
  const percentage = (diff / previous) * 100;

  return {
    value: diff,
    percentage: Math.round(percentage * 10) / 10,
    trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'wow';
    const customFrom = searchParams.get('from');
    const customTo = searchParams.get('to');

    const { current, comparison } = calculateDateRanges(mode, customFrom || undefined, customTo || undefined);

    const currentStats = await getStats(current.from, current.to);
    const comparisonStats = await getStats(comparison.from, comparison.to);

    return NextResponse.json({
      mode,
      currentPeriod: {
        from: current.from.toISOString(),
        to: current.to.toISOString(),
        stats: currentStats
      },
      comparisonPeriod: {
        from: comparison.from.toISOString(),
        to: comparison.to.toISOString(),
        stats: comparisonStats
      },
      changes: {
        totalVisitors: calculateChange(currentStats.totalVisitors, comparisonStats.totalVisitors),
        totalPageViews: calculateChange(currentStats.totalPageViews, comparisonStats.totalPageViews),
        totalEvents: calculateChange(currentStats.totalEvents, comparisonStats.totalEvents),
        identifiedVisitors: calculateChange(currentStats.identifiedVisitors, comparisonStats.identifiedVisitors),
        formSubmits: calculateChange(currentStats.formSubmits, comparisonStats.formSubmits),
        purchases: calculateChange(currentStats.purchases, comparisonStats.purchases),
        addToCarts: calculateChange(currentStats.addToCarts, comparisonStats.addToCarts),
        cartAbandons: calculateChange(currentStats.cartAbandons, comparisonStats.cartAbandons),
        formStarts: calculateChange(currentStats.formStarts, comparisonStats.formStarts),
        signups: calculateChange(currentStats.signups, comparisonStats.signups),
        logins: calculateChange(currentStats.logins, comparisonStats.logins),
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports data' }, { status: 500 });
  }
}
