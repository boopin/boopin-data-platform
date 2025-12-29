import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

async function getGeoLocation(ip: string) {
  try {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: 'Local', city: 'Local', region: 'Local' };
    }
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    const data = await response.json();
    if (data.status === 'success') {
      return { country: data.country || 'Unknown', city: data.city || 'Unknown', region: data.regionName || 'Unknown' };
    }
    return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
  } catch {
    return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const clientResult = await sql`SELECT id, domain, allowed_domains, is_active FROM clients WHERE api_key = ${apiKey}`;
    if (clientResult.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const client = clientResult[0];
    if (!client.is_active) {
      return NextResponse.json({ error: 'Client is inactive' }, { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const body = await request.json();
    const { anonymousId, eventType, properties = {}, pageUrl, pagePath, pageTitle, referrer, userAgent, sessionId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = body;

    if (!anonymousId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';
    const ua = userAgent || request.headers.get('user-agent') || '';
    const deviceType = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop';

    const geo = await getGeoLocation(ip);

    const visitorResult = await sql`
      INSERT INTO visitors (client_id, anonymous_id)
      VALUES (${client.id}, ${anonymousId})
      ON CONFLICT (client_id, anonymous_id) 
      DO UPDATE SET last_seen_at = NOW(), visit_count = visitors.visit_count + 1
      RETURNING id
    `;
    const visitorId = visitorResult[0].id;

    await sql`
      INSERT INTO events (client_id, visitor_id, event_type, properties, page_url, page_path, page_title, referrer, user_agent, ip_address, device_type, session_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, country, city, region)
      VALUES (${client.id}, ${visitorId}, ${eventType}, ${JSON.stringify(properties)}, ${pageUrl || null}, ${pagePath || null}, ${pageTitle || null}, ${referrer || null}, ${ua || null}, ${ip || null}, ${deviceType}, ${sessionId || null}, ${utmSource || null}, ${utmMedium || null}, ${utmCampaign || null}, ${utmTerm || null}, ${utmContent || null}, ${geo.country}, ${geo.city}, ${geo.region})
    `;

    if (eventType === 'identify' && properties) {
      const { email, phone, name } = properties;
      if (email || phone || name) {
        await sql`
          UPDATE visitors SET email = COALESCE(${email || null}, email), phone = COALESCE(${phone || null}, phone), name = COALESCE(${name || null}, name), is_identified = true
          WHERE id = ${visitorId}
        `;
      }
    }

    return NextResponse.json({ success: true, visitorId }, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
