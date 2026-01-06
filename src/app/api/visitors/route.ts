import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    const visitors = await sql`
      SELECT
        id,
        anonymous_id,
        email,
        name,
        phone,
        first_seen_at,
        last_seen_at,
        visit_count,
        is_identified
      FROM visitors
      WHERE site_id = ${siteId}
      ORDER BY last_seen_at DESC
      LIMIT 500
    `;

    return NextResponse.json({ visitors }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Visitors error:', error);
    return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 });
  }
}
