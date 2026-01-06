import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return true;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}

function parseUserAgent(ua: string) {
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Device type detection
  if (ua.includes('Mobile') || ua.includes('Android')) deviceType = 'mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) deviceType = 'tablet';

  return { browser, os, deviceType };
}

async function getGeolocation(ip: string) {
  try {
    // Skip for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: null, city: null, region: null };
    }
    
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName`, {
      signal: AbortSignal.timeout(2000)
    });
    
    if (!response.ok) return { country: null, city: null, region: null };
    
    const data = await response.json();
    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null,
        region: data.regionName || null
      };
    }
    return { country: null, city: null, region: null };
  } catch (error) {
    console.error('Geolocation error:', error);
    return { country: null, city: null, region: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    // Rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    // API Key validation
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    // Validate API key against clients table
    const clients = await sql`SELECT id FROM clients WHERE api_key = ${apiKey} AND is_active = true`;
    if (clients.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    const clientId = clients[0].id;

    const body = await request.json();
    const {
      siteId,
      anonymousId,
      sessionId,
      eventType,
      properties = {},
      pageUrl,
      pagePath,
      pageTitle,
      referrer,
      userAgent,
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      timeOnPage,
      timeOnSite,
      engagedTime,
      scrollDepth,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    } = body;

    if (!anonymousId || !eventType || !siteId) {
      return NextResponse.json({ error: 'Missing required fields (siteId, anonymousId, eventType)' }, { status: 400 });
    }

    // Validate site exists
    const siteCheck = await sql`SELECT id FROM sites WHERE id = ${siteId}`;
    if (siteCheck.length === 0) {
      return NextResponse.json({ error: 'Invalid site_id' }, { status: 400 });
    }

    // Parse user agent
    const { browser, os, deviceType } = parseUserAgent(userAgent || '');

    // Get geolocation
    const geo = await getGeolocation(ip);

    // Find or create visitor
    let visitor = await sql`
      SELECT id, email, name, phone FROM visitors
      WHERE anonymous_id = ${anonymousId} AND site_id = ${siteId}
    `;

    let visitorId: string;
    let isNewVisitor = false;

    if (visitor.length === 0) {
      // Create new visitor
      const newVisitor = await sql`
        INSERT INTO visitors (site_id, anonymous_id, first_seen_at, last_seen_at, visit_count, is_identified)
        VALUES (${siteId}, ${anonymousId}, NOW(), NOW(), 1, false)
        RETURNING id
      `;
      visitorId = newVisitor[0].id;
      isNewVisitor = true;
    } else {
      visitorId = visitor[0].id;
      // Update last seen and visit count
      await sql`
        UPDATE visitors
        SET last_seen_at = NOW(),
            visit_count = visit_count + 1
        WHERE id = ${visitorId}
      `;
    }

    // Handle identify event - update visitor with user info
    if (eventType === 'identify' || eventType === 'lead_form') {
      const email = properties.email || properties.user_id || null;
      const name = properties.name || null;
      const phone = properties.phone || null;

      if (email || name || phone) {
        await sql`
          UPDATE visitors 
          SET email = COALESCE(${email}, email),
              name = COALESCE(${name}, name),
              phone = COALESCE(${phone}, phone),
              is_identified = true
          WHERE id = ${visitorId}
        `;
      }
    }

    // Merge all properties including enhanced tracking data
    const enhancedProperties = {
      ...properties,
      screen_width: screenWidth,
      screen_height: screenHeight,
      viewport_width: viewportWidth,
      viewport_height: viewportHeight,
      time_on_page: timeOnPage,
      time_on_site: timeOnSite,
      engaged_time: engagedTime,
      scroll_depth: scrollDepth
    };

    // Insert event
    const result = await sql`
      INSERT INTO events (
        site_id, visitor_id, session_id, event_type,
        page_url, page_path, page_title, referrer,
        user_agent, browser, os, device_type,
        ip_address, country, city, region,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        properties
      ) VALUES (
        ${siteId}, ${visitorId}, ${sessionId || null}, ${eventType},
        ${pageUrl || null}, ${pagePath || null}, ${pageTitle || null}, ${referrer || null},
        ${userAgent || null}, ${browser}, ${os}, ${deviceType},
        ${ip}, ${geo.country}, ${geo.city}, ${geo.region},
        ${utmSource || null}, ${utmMedium || null}, ${utmCampaign || null}, ${utmTerm || null}, ${utmContent || null},
        ${JSON.stringify(enhancedProperties)}
      )
      RETURNING id, timestamp
    `;

    // Trigger webhooks (fire-and-forget)
    try {
      await triggerWebhooks(eventType, {
        event_id: result[0].id,
        visitor_id: visitorId,
        event_type: eventType,
        properties: enhancedProperties,
        page_url: pageUrl,
        page_path: pagePath,
        timestamp: result[0].timestamp
      });
    } catch (webhookError) {
      console.error('Webhook trigger error:', webhookError);
      // Don't fail the tracking request if webhooks fail
    }

    return NextResponse.json({
      success: true,
      visitorId,
      isNewVisitor
    });

  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}

// Trigger webhooks for this event
async function triggerWebhooks(eventType: string, eventData: any) {
  try {
    // Get all active webhooks for this event type
    const webhooks = await sql`
      SELECT * FROM webhooks
      WHERE is_active = true
      AND (
        event_types IS NULL
        OR event_types @> ${JSON.stringify([eventType])}
      )
    `;

    // Trigger each webhook (fire-and-forget)
    for (const webhook of webhooks) {
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pulse-Analytics-Signature': webhook.secret || '',
          'User-Agent': 'PulseAnalytics-Webhook/1.0'
        },
        body: JSON.stringify({
          webhook_id: webhook.id,
          event_type: eventType,
          data: eventData,
          timestamp: new Date().toISOString()
        })
      }).then(async (response) => {
        // Update webhook statistics
        await sql`
          UPDATE webhooks
          SET
            total_triggers = total_triggers + 1,
            last_triggered_at = NOW(),
            last_status = ${response.status},
            last_error = NULL
          WHERE id = ${webhook.id}
        `;
      }).catch(async (error) => {
        console.error(`Webhook ${webhook.id} delivery failed:`, error);
        // Update webhook with error
        await sql`
          UPDATE webhooks
          SET
            last_triggered_at = NOW(),
            last_error = ${error.message}
          WHERE id = ${webhook.id}
        `;
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
}
