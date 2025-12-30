import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Default client ID (you can change this or make it dynamic later)
const DEFAULT_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

// Get all segments with user counts
export async function GET() {
  try {
    const segments = await sql`
      SELECT id, name, description, rules, created_at, updated_at, visitor_count, is_active
      FROM segments
      ORDER BY created_at DESC
    `;

    // Calculate user count for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment: Record<string, unknown>) => {
        const count = await getSegmentUserCount(segment.rules as object[]);
        return { ...segment, user_count: count };
      })
    );

    return NextResponse.json({ segments: segmentsWithCounts });
  } catch (error) {
    console.error('Segments error:', error);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
}

// Create new segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, rules } = body;

    if (!name || !rules) {
      return NextResponse.json({ error: 'Name and rules are required' }, { status: 400 });
    }

    const rulesJson = JSON.stringify(rules);

    const result = await sql`
      INSERT INTO segments (client_id, name, description, rules, is_active, visitor_count)
      VALUES (
        ${DEFAULT_CLIENT_ID}::uuid, 
        ${name}, 
        ${description || ''}, 
        ${rulesJson}::jsonb,
        true,
        0
      )
      RETURNING id, name, description, rules, created_at, is_active
    `;

    return NextResponse.json({ segment: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Create segment error:', error);
    return NextResponse.json({ 
      error: 'Failed to create segment',
      details: String(error)
    }, { status: 500 });
  }
}

async function getSegmentUserCount(rules: object[]): Promise<number> {
  try {
    const visitors = await sql`SELECT id, is_identified, email, phone FROM visitors`;
    const events = await sql`
      SELECT visitor_id, event_type, page_path, device_type, country, city, 
             utm_source, timestamp
      FROM events
    `;

    // Group events by visitor
    const visitorEvents: Record<string, Record<string, unknown>[]> = {};
    events.forEach((e: Record<string, unknown>) => {
      const vid = e.visitor_id as string;
      if (!visitorEvents[vid]) visitorEvents[vid] = [];
      visitorEvents[vid].push(e);
    });

    // Check each visitor against rules
    let matchCount = 0;
    for (const visitor of visitors) {
      const vEvents = visitorEvents[visitor.id as string] || [];
      if (matchesRules(vEvents, rules, visitor as Record<string, unknown>)) {
        matchCount++;
      }
    }

    return matchCount;
  } catch {
    return 0;
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

      case 'has_email':
        const hasEmail = Boolean(visitor.email);
        if (value === 'true' && !hasEmail) return false;
        if (value === 'false' && hasEmail) return false;
        break;

      case 'has_phone':
        const hasPhone = Boolean(visitor.phone);
        if (value === 'true' && !hasPhone) return false;
        if (value === 'false' && hasPhone) return false;
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
