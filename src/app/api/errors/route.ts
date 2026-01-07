import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Fetch JavaScript errors from events table
    const errors = await sql`
      SELECT
        id,
        visitor_id,
        properties->>'message' as message,
        properties->>'error_type' as error_type,
        properties->>'filename' as filename,
        properties->>'lineno' as lineno,
        properties->>'colno' as colno,
        properties->>'stack' as stack,
        properties->>'page_url' as page_url,
        properties->>'user_agent' as user_agent,
        timestamp,
        page_path,
        device_type,
        browser,
        os,
        country
      FROM events
      WHERE event_type = 'javascript_error'
        AND site_id = ${siteId}
      ORDER BY timestamp DESC
      LIMIT 500
    `;

    // Group errors by message to show frequency
    const errorMap = new Map();
    const allErrors: any[] = [];

    errors.forEach((error: any) => {
      const key = `${error.message}-${error.filename}-${error.lineno}`;

      if (errorMap.has(key)) {
        const existing = errorMap.get(key);
        existing.count++;
        existing.last_seen = error.timestamp;
        existing.affected_users.add(error.visitor_id);
      } else {
        errorMap.set(key, {
          ...error,
          count: 1,
          first_seen: error.timestamp,
          last_seen: error.timestamp,
          affected_users: new Set([error.visitor_id])
        });
      }

      allErrors.push(error);
    });

    // Convert grouped errors to array
    const groupedErrors = Array.from(errorMap.values()).map(err => ({
      ...err,
      affected_users_count: err.affected_users.size,
      affected_users: undefined // Remove Set from response
    }));

    return NextResponse.json({
      errors: allErrors,
      groupedErrors,
      total: errors.length
    });
  } catch (error) {
    console.error('Failed to fetch errors:', error);
    return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 });
  }
}
