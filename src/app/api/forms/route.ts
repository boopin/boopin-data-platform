import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Get form events
    const formEvents = await sql`
      SELECT
        event_type,
        properties->>'form_id' as form_id,
        properties->>'form_name' as form_name,
        properties->>'time_to_complete' as time_to_complete,
        properties->>'fields_completed' as fields_completed,
        properties->>'fields_count' as fields_count,
        timestamp,
        visitor_id
      FROM events
      WHERE event_type IN ('form_start', 'form_submit', 'form_abandon')
        AND site_id = ${siteId}
        AND timestamp >= NOW() - INTERVAL '30 days'
      ORDER BY timestamp DESC
    `;

    // Group by form
    const formStats: { [key: string]: any } = {};

    formEvents.forEach((event: any) => {
      const formId = event.form_id || 'unknown';
      const formName = event.form_name || formId;

      if (!formStats[formId]) {
        formStats[formId] = {
          form_id: formId,
          form_name: formName,
          starts: 0,
          submits: 0,
          abandons: 0,
          totalTimeToComplete: 0,
          completionTimes: [],
          fieldsAbandoned: [],
          uniqueVisitors: new Set()
        };
      }

      formStats[formId].uniqueVisitors.add(event.visitor_id);

      if (event.event_type === 'form_start') {
        formStats[formId].starts++;
      } else if (event.event_type === 'form_submit') {
        formStats[formId].submits++;
        const time = parseInt(event.time_to_complete);
        if (!isNaN(time)) {
          formStats[formId].totalTimeToComplete += time;
          formStats[formId].completionTimes.push(time);
        }
      } else if (event.event_type === 'form_abandon') {
        formStats[formId].abandons++;
        const fieldsCount = parseInt(event.fields_count);
        if (!isNaN(fieldsCount)) {
          formStats[formId].fieldsAbandoned.push(fieldsCount);
        }
      }
    });

    // Calculate metrics for each form
    const forms = Object.values(formStats).map((form: any) => {
      const conversionRate = form.starts > 0 ? (form.submits / form.starts) * 100 : 0;
      const abandonRate = form.starts > 0 ? (form.abandons / form.starts) * 100 : 0;
      const avgTimeToComplete = form.completionTimes.length > 0
        ? form.totalTimeToComplete / form.completionTimes.length
        : 0;
      const avgFieldsAbandoned = form.fieldsAbandoned.length > 0
        ? form.fieldsAbandoned.reduce((a: number, b: number) => a + b, 0) / form.fieldsAbandoned.length
        : 0;

      return {
        form_id: form.form_id,
        form_name: form.form_name,
        starts: form.starts,
        submits: form.submits,
        abandons: form.abandons,
        conversionRate: Math.round(conversionRate * 10) / 10,
        abandonRate: Math.round(abandonRate * 10) / 10,
        avgTimeToComplete: Math.round(avgTimeToComplete),
        avgFieldsAbandoned: Math.round(avgFieldsAbandoned * 10) / 10,
        uniqueVisitors: form.uniqueVisitors.size
      };
    });

    // Sort by starts (most active forms first)
    forms.sort((a, b) => b.starts - a.starts);

    // Overall stats
    const totalStarts = forms.reduce((sum, f) => sum + f.starts, 0);
    const totalSubmits = forms.reduce((sum, f) => sum + f.submits, 0);
    const totalAbandons = forms.reduce((sum, f) => sum + f.abandons, 0);
    const overallConversionRate = totalStarts > 0 ? (totalSubmits / totalStarts) * 100 : 0;

    return NextResponse.json({
      forms,
      stats: {
        totalForms: forms.length,
        totalStarts,
        totalSubmits,
        totalAbandons,
        overallConversionRate: Math.round(overallConversionRate * 10) / 10
      }
    });
  } catch (error) {
    console.error('Failed to fetch form analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch form analytics' }, { status: 500 });
  }
}
