import { sql } from '../../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: funnelId } = await params;
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    // Get the funnel definition
    const funnelResult = await sql`
      SELECT id, name, description, steps
      FROM funnels
      WHERE id = ${funnelId}
    `;

    if (funnelResult.length === 0) {
      return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
    }

    const funnel = funnelResult[0];
    const steps = funnel.steps;

    if (!Array.isArray(steps) || steps.length < 2) {
      return NextResponse.json({ error: 'Invalid funnel steps' }, { status: 400 });
    }

    // Build date filter
    let dateFilter = sql`TRUE`;
    if (dateFrom && dateTo) {
      dateFilter = sql`timestamp >= ${dateFrom}::timestamp AND timestamp <= ${dateTo}::timestamp`;
    } else if (dateFrom) {
      dateFilter = sql`timestamp >= ${dateFrom}::timestamp`;
    } else if (dateTo) {
      dateFilter = sql`timestamp <= ${dateTo}::timestamp`;
    }

    // Analyze each step
    const stepAnalysis = [];
    let previousStepVisitors: Set<string> = new Set();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepType = step.type; // 'event' or 'url'
      const stepValue = step.value; // event name or URL pattern

      let visitorQuery;

      if (stepType === 'event') {
        // Find visitors who triggered this event
        visitorQuery = await sql`
          SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
          FROM events
          WHERE event_type = ${stepValue}
          AND ${dateFilter}
          GROUP BY visitor_id
        `;
      } else if (stepType === 'url') {
        // Find visitors who visited this URL
        visitorQuery = await sql`
          SELECT DISTINCT visitor_id, MIN(timestamp) as first_occurrence
          FROM events
          WHERE page_path LIKE ${stepValue}
          AND ${dateFilter}
          GROUP BY visitor_id
        `;
      }

      const currentStepVisitors = new Map(
        visitorQuery.map((row: any) => [row.visitor_id, new Date(row.first_occurrence)])
      );

      // Calculate metrics
      const totalVisitors = currentStepVisitors.size;
      let convertedFromPrevious = 0;
      let dropoffFromPrevious = 0;
      let conversionRate = 0;
      let dropoffRate = 0;
      let avgTimeToConvert = 0;

      if (i === 0) {
        // First step - everyone starts here
        conversionRate = 100;
      } else {
        // Check how many from previous step made it to this step
        const timeDeltas: number[] = [];

        for (const visitorId of previousStepVisitors) {
          if (currentStepVisitors.has(visitorId)) {
            convertedFromPrevious++;

            // Calculate time to convert from previous step
            const prevStepData = stepAnalysis[i - 1].visitorTimestamps.get(visitorId);
            const currStepTime = currentStepVisitors.get(visitorId);

            if (prevStepData && currStepTime) {
              const timeDelta = currStepTime.getTime() - prevStepData.getTime();
              timeDeltas.push(timeDelta);
            }
          }
        }

        const previousStepCount = previousStepVisitors.size;
        dropoffFromPrevious = previousStepCount - convertedFromPrevious;
        conversionRate = previousStepCount > 0 ? (convertedFromPrevious / previousStepCount) * 100 : 0;
        dropoffRate = previousStepCount > 0 ? (dropoffFromPrevious / previousStepCount) * 100 : 0;

        // Calculate average time to convert
        if (timeDeltas.length > 0) {
          avgTimeToConvert = timeDeltas.reduce((sum, delta) => sum + delta, 0) / timeDeltas.length;
        }
      }

      stepAnalysis.push({
        stepIndex: i,
        stepName: step.name || stepValue,
        stepType,
        stepValue,
        totalVisitors,
        convertedFromPrevious,
        dropoffFromPrevious,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropoffRate: Math.round(dropoffRate * 100) / 100,
        avgTimeToConvert: Math.round(avgTimeToConvert / 1000), // Convert to seconds
        visitorTimestamps: currentStepVisitors // Store for next iteration
      });

      // Update previous step visitors for next iteration
      previousStepVisitors = new Set(currentStepVisitors.keys());
    }

    // Calculate overall funnel metrics
    const overallConversionRate = stepAnalysis.length > 0 && stepAnalysis[0].totalVisitors > 0
      ? (stepAnalysis[stepAnalysis.length - 1].totalVisitors / stepAnalysis[0].totalVisitors) * 100
      : 0;

    const totalTimeToConvert = stepAnalysis
      .slice(1)
      .reduce((sum, step) => sum + (step.avgTimeToConvert || 0), 0);

    // Remove visitorTimestamps from response (internal use only)
    const cleanStepAnalysis = stepAnalysis.map(step => {
      const { visitorTimestamps, ...rest } = step;
      return rest;
    });

    return NextResponse.json({
      funnel: {
        id: funnel.id,
        name: funnel.name,
        description: funnel.description
      },
      analysis: {
        steps: cleanStepAnalysis,
        overall: {
          totalEntries: stepAnalysis[0]?.totalVisitors || 0,
          totalCompletions: stepAnalysis[stepAnalysis.length - 1]?.totalVisitors || 0,
          overallConversionRate: Math.round(overallConversionRate * 100) / 100,
          avgTotalTimeToConvert: totalTimeToConvert
        }
      }
    });

  } catch (error) {
    console.error('Funnel analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze funnel' }, { status: 500 });
  }
}
