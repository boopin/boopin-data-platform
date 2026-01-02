import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Validate API key
async function validateApiKey(apiKey: string): Promise<{ valid: boolean; permissions?: any }> {
  try {
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const result = await sql`
      SELECT id, permissions, is_active, expires_at
      FROM api_keys
      WHERE key_hash = ${hash}
    `;

    if (result.length === 0) {
      return { valid: false };
    }

    const key = result[0];

    if (!key.is_active) {
      return { valid: false };
    }

    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return { valid: false };
    }

    // Update last used timestamp
    await sql`
      UPDATE api_keys
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE id = ${key.id}
    `;

    return { valid: true, permissions: key.permissions };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

// POST - Track server-side event
export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    // Validate API key
    const { valid, permissions } = await validateApiKey(apiKey);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    // Check if API key has permission to track events
    if (!permissions?.track_events) {
      return NextResponse.json(
        { error: 'API key does not have permission to track events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      event_type,
      visitor_id,
      anonymous_id,
      properties = {},
      timestamp,
      user_agent,
      ip_address,
      page_path,
      page_url,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      device_type,
      browser,
      os,
      country,
      city,
      region
    } = body;

    // Validate required fields
    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      );
    }

    if (!visitor_id && !anonymous_id) {
      return NextResponse.json(
        { error: 'Either visitor_id or anonymous_id is required' },
        { status: 400 }
      );
    }

    // Find or create visitor
    let finalVisitorId = visitor_id;

    if (!finalVisitorId && anonymous_id) {
      // Check if anonymous visitor exists
      const existingVisitor = await sql`
        SELECT id FROM visitors WHERE anonymous_id = ${anonymous_id}
      `;

      if (existingVisitor.length > 0) {
        finalVisitorId = existingVisitor[0].id;
      } else {
        // Create new visitor
        const newVisitor = await sql`
          INSERT INTO visitors (anonymous_id, is_identified)
          VALUES (${anonymous_id}, false)
          RETURNING id
        `;
        finalVisitorId = newVisitor[0].id;
      }
    }

    // Insert event
    const eventTimestamp = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

    const result = await sql`
      INSERT INTO events (
        visitor_id,
        event_type,
        page_path,
        page_url,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        user_agent,
        device_type,
        browser,
        os,
        ip_address,
        country,
        city,
        region,
        properties,
        timestamp
      ) VALUES (
        ${finalVisitorId},
        ${event_type},
        ${page_path || null},
        ${page_url || null},
        ${referrer || null},
        ${utm_source || null},
        ${utm_medium || null},
        ${utm_campaign || null},
        ${user_agent || 'Server-Side'},
        ${device_type || 'server'},
        ${browser || null},
        ${os || null},
        ${ip_address || null},
        ${country || null},
        ${city || null},
        ${region || null},
        ${JSON.stringify(properties)},
        ${eventTimestamp}
      )
      RETURNING id, timestamp
    `;

    // Trigger webhooks (we'll implement this next)
    try {
      await triggerWebhooks(event_type, {
        event_id: result[0].id,
        event_type,
        visitor_id: finalVisitorId,
        properties,
        timestamp: result[0].timestamp
      });
    } catch (webhookError) {
      console.error('Webhook trigger error:', webhookError);
      // Don't fail the request if webhooks fail
    }

    return NextResponse.json({
      success: true,
      event_id: result[0].id,
      timestamp: result[0].timestamp,
      source: 'server-side'
    }, { status: 201 });

  } catch (error) {
    console.error('Server-side tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
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

    // Trigger each webhook
    for (const webhook of webhooks) {
      // Fire and forget - don't wait for webhook responses
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
      }).catch(error => {
        console.error(`Webhook ${webhook.id} delivery failed:`, error);
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
}
