import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseUserAgent(ua: string) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };
  
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';
  
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return { browser, os };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visitorId = params.id;

    const visitorResult = await sql`
      SELECT id, anonymous_id, email, name, phone, first_seen_at, last_seen_at, visit_count, is_identified
      FROM visitors
      WHERE id = ${visitorId}
    `;

    if (visitorResult.length === 0) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    const events = await sql`
      SELECT id, event_type, page_path, page_url, timestamp, device_type, user_agent, 
             country, city, region, referrer, utm_source, utm_medium, utm_campaign, properties
      FROM events
      WHERE visitor_id = ${visitorId}
      ORDER BY timestamp DESC
    `;

    const processedEvents = events.map((event: Record<string, unknown>) => {
      const { browser, os } = parseUserAgent(String(event.user_agent || ''));
      return { ...event, browser, os };
    });

    return NextResponse.json({ 
      visitor: visitorResult[0],
      events: processedEvents 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Visitor profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch visitor' }, { status: 500 });
  }
}
