import { sql } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get segment with matching users
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const segmentId = params.id;

    const segmentResult = await sql`
      SELECT id, name, description, rules, created_at, updated_at
      FROM segments
      WHERE id = ${segmentId}
    `;

    if (segmentResult.length === 0) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    const segment = segmentResult[0];
    const rules = segment.rules as object[];

    // Get matching users
    const visitors = await sql`
      SELECT id, anonymous_id, email, name, phone, first_seen_at, last_seen_at, visit_count, is_identified
      FROM visitors
    `;

    const events = await sql`
      SELECT visitor_id, event_type, page_path, device_type, country, city, utm_source, timestamp
      FROM events
    `;

    // Group events by visitor
    const visitorEvents: Record<string, Record<string, unknown>[]> = {};
    events.forEach((e: Record<string, unknown>) => {
      const vid = e.visitor_id as string;
      if (!visitorEvents[vid]) visitorEvents[vid] = [];
      visitorEvents[vid].push(e);
    });

    // Find matching visitors
    const matchingUsers = visitors.filter((visitor: Record<string, unknown>) => {
      const vEvents = visitorEvents[visitor.id as string] || [];
      return matchesRules(vEvents, rules, visitor);
    });

    return NextResponse.json({ 
      segment,
      users: matchingUsers,
      user_count: matchingUsers.length
    });
  } catch (error) {
    console.error('Segment detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch segment' }, { status: 500 });
  }
}

// Update segment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const segmentId = params.id;
    const body = await request.json();
    const { name, description, rules } = body;

    const result = await sql`
      UPDATE segments
      SET name = ${name}, description = ${description || ''}, rules = ${JSON.stringify(rules)}, updated_at = NOW()
      WHERE id = ${segmentId}
      RETURNING id, name, description, rules, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    return NextResponse.json({ segment: result[0] });
  } catch (error) {
    console.error('Update segment error:', error);
    return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 });
  }
}

// Delete segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const segmentId = params.id;

    await sql`DELETE FROM segments WHERE id = ${segmentId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete segment error:', error);
    return NextResponse.json({ error: 'Failed to delete segment' }, { status: 500 });
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

      case 'city':
        const cityMatch = events.some(e => e.city === value);
        if (operator === 'equals' && !cityMatch) return false;
        if (operator === 'not_equals' && cityMatch) return false;
        break;

      case 'device':
        const deviceMatch = events.some(e => e.device_type === value);
        if (operator === 'equals' && !deviceMatch) return false;
        if (operator === 'not_equals' && deviceMatch) return false;
        break;

      case 'utm_source':
        const utmMatch = events.some(e => e.utm_source === value);
        if (operator === 'equals' && !utmMatch) return false;
        if (operator === 'not_equals' && utmMatch) return false;
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
