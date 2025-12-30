import { sql } from '../../../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Trigger webhook for a segment (send current matching users)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: segmentId } = await params;
    const body = await request.json();
    const { webhook_type } = body;

    // Get segment
    const segmentResult = await sql`
      SELECT id, name, rules FROM segments WHERE id = ${segmentId}
    `;

    if (segmentResult.length === 0) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    const segment = segmentResult[0];

    // Get webhook config
    const webhookResult = await sql`
      SELECT webhook_url, webhook_type FROM segment_webhooks
      WHERE segment_id = ${segmentId} 
      AND webhook_type = ${webhook_type || 'generic'}
      AND is_active = true
    `;

    if (webhookResult.length === 0) {
      return NextResponse.json({ error: 'No active webhook found' }, { status: 404 });
    }

    const webhook = webhookResult[0];

    // Get matching users
    const visitors = await sql`
      SELECT id, email, name, phone, first_seen_at, last_seen_at, visit_count
      FROM visitors
      WHERE is_identified = true AND email IS NOT NULL
    `;

    const events = await sql`
      SELECT visitor_id, event_type, page_path, device_type, country, city, utm_source, timestamp
      FROM events
    `;

    const visitorEvents: Record<string, Record<string, unknown>[]> = {};
    events.forEach((e: Record<string, unknown>) => {
      const vid = e.visitor_id as string;
      if (!visitorEvents[vid]) visitorEvents[vid] = [];
      visitorEvents[vid].push(e);
    });

    const rules = segment.rules as object[];
    const matchingUsers = visitors.filter((visitor: Record<string, unknown>) => {
      const vEvents = visitorEvents[visitor.id as string] || [];
      return matchesRules(vEvents, rules, visitor);
    });

    // Format payload based on webhook type
    let payload: Record<string, unknown>;

    switch (webhook.webhook_type) {
      case 'meta_ads':
        // Meta Custom Audiences format
        payload = {
          schema: ['EMAIL', 'PHONE', 'FN'],
          data: matchingUsers.map((u: Record<string, unknown>) => [
            u.email || '',
            (u.phone as string || '').replace(/[^0-9]/g, ''),
            u.name || ''
          ])
        };
        break;

      case 'google_ads':
        // Google Customer Match format
        payload = {
          customerMatchUserListMetadata: {
            userList: segment.name
          },
          operations: matchingUsers.map((u: Record<string, unknown>) => ({
            create: {
              userIdentifiers: [
                { hashedEmail: u.email },
                { hashedPhoneNumber: (u.phone as string || '').replace(/[^0-9]/g, '') }
              ]
            }
          }))
        };
        break;

      case 'slack':
        // Slack webhook format
        payload = {
          text: `🎯 Segment Update: ${segment.name}`,
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: `🎯 Segment: ${segment.name}` }
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*${matchingUsers.length} users* currently match this segment` }
            },
            {
              type: 'section',
              fields: matchingUsers.slice(0, 10).map((u: Record<string, unknown>) => ({
                type: 'mrkdwn',
                text: `• ${u.email || u.name || 'Anonymous'}`
              }))
            }
          ]
        };
        break;

      case 'zapier':
      case 'make':
      case 'generic':
      default:
        // Generic webhook format
        payload = {
          event: 'segment_sync',
          segment: {
            id: segment.id,
            name: segment.name
          },
          triggered_at: new Date().toISOString(),
          total_users: matchingUsers.length,
          users: matchingUsers.map((u: Record<string, unknown>) => ({
            email: u.email,
            name: u.name,
            phone: u.phone,
            first_seen: u.first_seen_at,
            last_seen: u.last_seen_at,
            visits: u.visit_count
          }))
        };
    }

    // Send webhook
    try {
      const response = await fetch(webhook.webhook_url as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Update last triggered
      await sql`
        UPDATE segment_webhooks
        SET last_triggered = NOW()
        WHERE segment_id = ${segmentId} AND webhook_type = ${webhook.webhook_type}
      `;

      if (!response.ok) {
        return NextResponse.json({ 
          success: false, 
          error: `Webhook returned ${response.status}`,
          users_sent: matchingUsers.length 
        });
      }

      return NextResponse.json({ 
        success: true, 
        users_sent: matchingUsers.length,
        webhook_type: webhook.webhook_type
      });
    } catch (fetchError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to reach webhook URL',
        users_sent: 0 
      }, { status: 502 });
    }
  } catch (error) {
    console.error('Trigger webhook error:', error);
    return NextResponse.json({ error: 'Failed to trigger webhook' }, { status: 500 });
  }
}

function matchesRules(events: Record<string, unknown>[], rules: object[], visitor: Record<string, unknown>): boolean {
  if (!rules || rules.length === 0) return true;

  for (const rule of rules as Record<string, unknown>[]) {
    const { type, operator, value } = rule;

    switch (type) {
      case 'page_views':
        const pageViewCount = events.filter(e => e.event_type === 'page_view').length;
        if (!compareNumber(pageViewCount, operator as string, Number(value))) return false;
        break;

      case 'total_events':
        if (!compareNumber(events.length, operator as string, Number(value))) return false;
        break;

      case 'visited_page':
        const visitedPage = events.some(e => 
          e.event_type === 'page_view' && 
          (e.page_path as string || '').includes(value as string)
        );
        if (operator === 'contains' && !visitedPage) return false;
        if (operator === 'not_contains' && visitedPage) return false;
        break;

      case 'country':
        const countryMatch = events.some(e => e.country === value);
        if (operator === 'equals' && !countryMatch) return false;
        if (operator === 'not_equals' && countryMatch) return false;
        break;

      case 'device':
        const deviceMatch = events.some(e => e.device_type === value);
        if (operator === 'equals' && !deviceMatch) return false;
        if (operator === 'not_equals' && deviceMatch) return false;
        break;

      case 'event_type':
        const eventMatch = events.some(e => e.event_type === value);
        if (operator === 'equals' && !eventMatch) return false;
        if (operator === 'not_equals' && eventMatch) return false;
        break;

      case 'is_identified':
        const isIdentified = Boolean(visitor.is_identified);
        if (value === 'true' && !isIdentified) return false;
        if (value === 'false' && isIdentified) return false;
        break;

      case 'last_seen_days':
        const lastEvent = events.sort((a, b) => 
          new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime()
        )[0];
        if (lastEvent) {
          const daysSince = (Date.now() - new Date(lastEvent.timestamp as string).getTime()) / (1000 * 60 * 60 * 24);
          if (!compareNumber(daysSince, operator as string, Number(value))) return false;
        }
        break;
    }
  }

  return true;
}

function compareNumber(actual: number, operator: string, expected: number): boolean {
  switch (operator) {
    case 'greater_than': return actual > expected;
    case 'less_than': return actual < expected;
    case 'equals': return actual === expected;
    case 'greater_or_equal': return actual >= expected;
    case 'less_or_equal': return actual <= expected;
    default: return false;
  }
}
