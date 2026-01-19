import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server-side event tracking endpoint
// Use this from your backend to track conversions, subscriptions, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify API key from header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key and get site_id
    const keyResult = await sql`
      SELECT site_id FROM api_keys
      WHERE key = ${apiKey} AND is_active = true
    `;

    if (keyResult.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const siteId = keyResult[0].site_id;

    // Extract required fields
    const {
      eventType,
      anonymousId,
      userId,
      email,
      properties = {},
      timestamp,
      ip,
      userAgent
    } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    // Resolve or create visitor
    let visitorId = null;

    if (userId || email) {
      // Look up identified visitor
      const emailHash = email ? crypto.createHash('sha256').update(email.toLowerCase()).digest('hex') : null;

      const identifiedVisitor = await sql`
        SELECT id FROM visitors
        WHERE site_id = ${siteId}
        AND (
          ${userId ? sql`user_id = ${userId}` : sql`1=0`}
          OR ${emailHash ? sql`email = ${emailHash}` : sql`1=0`}
        )
        LIMIT 1
      `;

      if (identifiedVisitor.length > 0) {
        visitorId = identifiedVisitor[0].id;
      } else {
        // Create new identified visitor
        const newVisitor = await sql`
          INSERT INTO visitors (site_id, user_id, email, is_identified, first_seen, last_seen)
          VALUES (
            ${siteId},
            ${userId || null},
            ${emailHash},
            true,
            NOW(),
            NOW()
          )
          RETURNING id
        `;
        visitorId = newVisitor[0].id;
      }
    } else if (anonymousId) {
      // Look up anonymous visitor
      const anonVisitor = await sql`
        SELECT id FROM visitors
        WHERE site_id = ${siteId} AND anonymous_id = ${anonymousId}
        LIMIT 1
      `;

      if (anonVisitor.length > 0) {
        visitorId = anonVisitor[0].id;
      } else {
        // Create new anonymous visitor
        const newVisitor = await sql`
          INSERT INTO visitors (site_id, anonymous_id, first_seen, last_seen)
          VALUES (${siteId}, ${anonymousId}, NOW(), NOW())
          RETURNING id
        `;
        visitorId = newVisitor[0].id;
      }
    } else {
      return NextResponse.json({
        error: 'Either anonymousId, userId, or email is required'
      }, { status: 400 });
    }

    // Hash IP if provided
    const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;

    // Insert event
    const eventTimestamp = timestamp ? new Date(timestamp) : new Date();

    await sql`
      INSERT INTO events (
        site_id,
        visitor_id,
        event_type,
        properties,
        ip_address,
        user_agent,
        timestamp,
        server_side
      ) VALUES (
        ${siteId},
        ${visitorId},
        ${eventType},
        ${JSON.stringify(properties)},
        ${ipHash},
        ${userAgent || null},
        ${eventTimestamp.toISOString()},
        true
      )
    `;

    // Update visitor last_seen
    await sql`
      UPDATE visitors
      SET last_seen = NOW()
      WHERE id = ${visitorId}
    `;

    return NextResponse.json({
      success: true,
      visitorId,
      message: 'Server-side event tracked successfully'
    });

  } catch (error) {
    console.error('Server-side tracking error:', error);
    return NextResponse.json({
      error: 'Failed to track event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
