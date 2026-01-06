import { sql } from '../../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const funnelId = params.id;
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    // Get funnel details
    const funnelResult = await sql`
      SELECT * FROM funnels WHERE id = ${funnelId}
    `;

    if (funnelResult.rows.length === 0) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    }

    const funnel = funnelResult.rows[0];

    // Calculate funnel analysis (same logic as analyze endpoint)
    const steps = funnel.steps as Array<{ type: string; value: string }>;
    const stepResults = [];

    let previousStepVisitors = new Set<string>();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const { type: stepType, value: stepValue } = step;

      let visitorQuery;

      // Query based on step type with date filters
      if (stepType === 'event') {
        if (dateFrom && dateTo) {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM events
            WHERE event_type = ${stepValue}
            AND timestamp >= ${dateFrom}::timestamp
            AND timestamp <= ${dateTo}::timestamp
            GROUP BY visitor_id
          `;
        } else if (dateFrom) {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM events
            WHERE event_type = ${stepValue}
            AND timestamp >= ${dateFrom}::timestamp
            GROUP BY visitor_id
          `;
        } else if (dateTo) {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM events
            WHERE event_type = ${stepValue}
            AND timestamp <= ${dateTo}::timestamp
            GROUP BY visitor_id
          `;
        } else {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM events
            WHERE event_type = ${stepValue}
            GROUP BY visitor_id
          `;
        }
      } else {
        // URL-based step
        if (dateFrom && dateTo) {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM page_views
            WHERE url = ${stepValue}
            AND timestamp >= ${dateFrom}::timestamp
            AND timestamp <= ${dateTo}::timestamp
            GROUP BY visitor_id
          `;
        } else if (dateFrom) {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM page_views
            WHERE url = ${stepValue}
            AND timestamp >= ${dateFrom}::timestamp
            GROUP BY visitor_id
          `;
        } else if (dateTo) {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM page_views
            WHERE url = ${stepValue}
            AND timestamp <= ${dateTo}::timestamp
            GROUP BY visitor_id
          `;
        } else {
          visitorQuery = await sql`
            SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
            FROM page_views
            WHERE url = ${stepValue}
            GROUP BY visitor_id
          `;
        }
      }

      let currentStepVisitors = new Map<string, Date>();
      visitorQuery.rows.forEach((row: any) => {
        currentStepVisitors.set(row.visitor_id, new Date(row.first_occurrence));
      });

      // For steps after the first, filter by funnel order
      if (i > 0) {
        const filteredVisitors = new Map<string, Date>();
        currentStepVisitors.forEach((currentTimestamp, visitorId) => {
          if (previousStepVisitors.has(visitorId)) {
            filteredVisitors.set(visitorId, currentTimestamp);
          }
        });
        currentStepVisitors = filteredVisitors;
      }

      const count = currentStepVisitors.size;
      const conversionRate = i === 0 ? 100 : (count / stepResults[0].count) * 100;
      const dropOffRate = i === 0 ? 0 : ((stepResults[i - 1].count - count) / stepResults[i - 1].count) * 100;

      stepResults.push({
        step: i + 1,
        name: stepValue,
        type: stepType,
        count,
        conversionRate: conversionRate.toFixed(2),
        dropOffRate: dropOffRate.toFixed(2),
      });

      previousStepVisitors = new Set(currentStepVisitors.keys());
    }

    // Generate CSV
    const csvHeaders = 'Step,Name,Type,Visitors,Conversion Rate (%),Drop-off Rate (%)';
    const csvRows = stepResults.map(result =>
      `${result.step},"${result.name}",${result.type},${result.count},${result.conversionRate},${result.dropOffRate}`
    ).join('\n');

    const csv = `${csvHeaders}\n${csvRows}`;

    // Generate filename with date range
    const dateRangeStr = dateFrom && dateTo
      ? `_${dateFrom}_to_${dateTo}`
      : dateFrom
        ? `_from_${dateFrom}`
        : dateTo
          ? `_to_${dateTo}`
          : '';
    const filename = `funnel_${funnel.name.replace(/[^a-z0-9]/gi, '_')}${dateRangeStr}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting funnel:', error);
    return NextResponse.json({ error: 'Failed to export funnel' }, { status: 500 });
  }
}
