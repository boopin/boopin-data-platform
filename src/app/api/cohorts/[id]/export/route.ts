import { sql } from '../../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cohortId } = await params;

    // Get cohort definition
    const cohortResult = await sql`
      SELECT * FROM cohorts
      WHERE id = ${cohortId}
    `;

    if (cohortResult.length === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    const cohort = cohortResult[0];
    const retentionPeriods = cohort.retention_periods || [1, 7, 14, 30, 60, 90];

    // Get all visitors with their first seen date
    const visitors = await sql`
      SELECT
        visitor_id,
        MIN(timestamp) as first_seen
      FROM events
      GROUP BY visitor_id
      ORDER BY first_seen
    `;

    // Group visitors into cohorts based on interval_type
    const cohortGroups = new Map<string, Set<string>>();
    const visitorFirstSeen = new Map<string, Date>();

    visitors.forEach((visitor: any) => {
      const firstSeen = new Date(visitor.first_seen);
      visitorFirstSeen.set(visitor.visitor_id, firstSeen);

      let cohortKey: string;

      if (cohort.interval_type === 'daily') {
        cohortKey = firstSeen.toISOString().split('T')[0];
      } else if (cohort.interval_type === 'weekly') {
        const weekStart = new Date(firstSeen);
        weekStart.setDate(firstSeen.getDate() - firstSeen.getDay());
        cohortKey = weekStart.toISOString().split('T')[0];
      } else if (cohort.interval_type === 'monthly') {
        cohortKey = `${firstSeen.getFullYear()}-${String(firstSeen.getMonth() + 1).padStart(2, '0')}`;
      } else {
        cohortKey = firstSeen.toISOString().split('T')[0];
      }

      if (!cohortGroups.has(cohortKey)) {
        cohortGroups.set(cohortKey, new Set());
      }
      cohortGroups.get(cohortKey)!.add(visitor.visitor_id);
    });

    // Calculate retention for each cohort group
    const cohortAnalysis: Array<{
      cohortPeriod: string;
      cohortSize: number;
      retentionData: Array<{
        period: number;
        visitorsReturned: number;
        retentionRate: number;
      }>;
    }> = [];

    for (const [cohortPeriod, visitorSet] of Array.from(cohortGroups.entries())) {
      const cohortSize = visitorSet.size;
      const retentionData = [];

      // Calculate retention for each period
      for (const period of retentionPeriods) {
        const visitorIds = Array.from(visitorSet);

        if (visitorIds.length === 0) {
          retentionData.push({
            period,
            visitorsReturned: 0,
            retentionRate: 0
          });
          continue;
        }

        // Calculate the date range for this retention period
        const cohortStartDate = new Date(cohortPeriod);
        const periodStartDate = new Date(cohortStartDate);
        periodStartDate.setDate(periodStartDate.getDate() + period);

        const periodEndDate = new Date(periodStartDate);
        if (cohort.interval_type === 'daily') {
          periodEndDate.setDate(periodEndDate.getDate() + 1);
        } else if (cohort.interval_type === 'weekly') {
          periodEndDate.setDate(periodEndDate.getDate() + 7);
        } else if (cohort.interval_type === 'monthly') {
          periodEndDate.setMonth(periodEndDate.getMonth() + 1);
        }

        // Count unique visitors who returned in this period
        const returnedVisitors = await sql`
          SELECT COUNT(DISTINCT visitor_id) as count
          FROM events
          WHERE visitor_id = ANY(${visitorIds})
          AND timestamp >= ${periodStartDate.toISOString()}
          AND timestamp < ${periodEndDate.toISOString()}
        `;

        const visitorsReturned = parseInt(returnedVisitors[0]?.count || '0');
        const retentionRate = cohortSize > 0 ? (visitorsReturned / cohortSize) * 100 : 0;

        retentionData.push({
          period,
          visitorsReturned,
          retentionRate: Math.round(retentionRate * 100) / 100
        });
      }

      cohortAnalysis.push({
        cohortPeriod,
        cohortSize,
        retentionData
      });
    }

    // Sort by cohort period (most recent first)
    cohortAnalysis.sort((a, b) => b.cohortPeriod.localeCompare(a.cohortPeriod));

    // Generate CSV
    // Headers: Cohort Period, Cohort Size, Day 1, Day 7, Day 14, etc.
    const periodHeaders = retentionPeriods.map((p: number) => `Day ${p}`).join(',');
    const csvHeaders = `Cohort Period,Cohort Size,${periodHeaders}`;

    const csvRows = cohortAnalysis.map((cohortData: any) => {
      const periodValues = cohortData.retentionData
        .map((retention: any) => `"${retention.retentionRate}% (${retention.visitorsReturned}/${cohortData.cohortSize})"`)
        .join(',');
      return `${cohortData.cohortPeriod},${cohortData.cohortSize},${periodValues}`;
    }).join('\n');

    const csv = `${csvHeaders}\n${csvRows}`;

    // Generate filename
    const filename = `cohort_${cohort.name.replace(/[^a-z0-9]/gi, '_')}_retention_analysis.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting cohort:', error);
    return NextResponse.json({ error: 'Failed to export cohort' }, { status: 500 });
  }
}
