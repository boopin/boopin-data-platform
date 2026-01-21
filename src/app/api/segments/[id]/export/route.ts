import { sql } from '../../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Hash for ad platforms (SHA-256 lowercase hex)
// Note: Data in database is already hashed, so just return it as-is
function hashForAds(value: string): string {
  if (!value) return '';
  // Database stores email/phone/name as hashed values already
  // Check if already hashed (64 character hex string from SHA-256)
  if (/^[a-f0-9]{64}$/i.test(value)) {
    return value; // Already hashed from database, use as-is
  }
  // Shouldn't reach here, but hash it anyway for safety
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

// Export segment users as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: segmentId } = await params;
    const { searchParams } = request.nextUrl;
    const format = searchParams.get('format') || 'csv';
    const siteId = searchParams.get('site_id');

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Get segment
    const segmentResult = await sql`
      SELECT id, name, description, rules
      FROM segments
      WHERE id = ${segmentId} AND site_id = ${siteId}
    `;

    if (segmentResult.length === 0) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    const segment = segmentResult[0];
    const rules = segment.rules as object[];

    // Get all visitors and events
    const visitors = await sql`
      SELECT id, anonymous_id, email, name, phone, first_seen_at, last_seen_at, visit_count, is_identified
      FROM visitors
      WHERE site_id = ${siteId}
    `;

    const events = await sql`
      SELECT visitor_id, event_type, page_path, device_type, country, city, utm_source, timestamp
      FROM events
      WHERE site_id = ${siteId}
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

    if (format === 'json') {
      return NextResponse.json({
        segment: segment.name,
        exported_at: new Date().toISOString(),
        total_users: matchingUsers.length,
        users: matchingUsers.map((u: Record<string, unknown>) => ({
          email: u.email,
          name: u.name,
          phone: u.phone,
          first_seen: u.first_seen_at,
          last_seen: u.last_seen_at,
          visits: u.visit_count
        }))
      });
    }

    // Generate CSV based on format
    let headers: string[];
    let csvRows: string[];
    let filename: string;

    if (format === 'google_ads') {
      // Google Ads Customer Match format (hashed)
      headers = ['Email', 'Phone', 'First Name', 'Last Name', 'Country', 'Zip'];
      csvRows = [headers.join(',')];

      matchingUsers.forEach((user: Record<string, unknown>) => {
        const email = user.email as string || '';
        const phone = user.phone as string || '';
        const nameParts = (user.name as string || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const row = [
          hashForAds(email),
          hashForAds(phone),
          hashForAds(firstName),
          hashForAds(lastName),
          '', // Country - would need to be added to visitors table
          ''  // Zip - would need to be added to visitors table
        ];
        csvRows.push(row.join(','));
      });

      filename = `google-ads-${segment.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (format === 'meta_ads') {
      // Meta (Facebook) Custom Audiences format (hashed)
      headers = ['email', 'phone', 'fn', 'ln', 'ct', 'st', 'zip', 'country'];
      csvRows = [headers.join(',')];

      matchingUsers.forEach((user: Record<string, unknown>) => {
        const email = user.email as string || '';
        const phone = user.phone as string || '';
        const nameParts = (user.name as string || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const row = [
          hashForAds(email),
          hashForAds(phone),
          hashForAds(firstName),
          hashForAds(lastName),
          '', // City
          '', // State
          '', // Zip
          ''  // Country
        ];
        csvRows.push(row.join(','));
      });

      filename = `meta-ads-${segment.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv`;

    } else {
      // Standard format (unhashed)
      headers = ['email', 'name', 'phone', 'first_seen', 'last_seen', 'visits', 'visitor_id'];
      csvRows = [headers.join(',')];

      matchingUsers.forEach((user: Record<string, unknown>) => {
        const row = [
          escapeCSV(user.email as string || ''),
          escapeCSV(user.name as string || ''),
          escapeCSV(user.phone as string || ''),
          user.first_seen_at ? new Date(user.first_seen_at as string).toISOString() : '',
          user.last_seen_at ? new Date(user.last_seen_at as string).toISOString() : '',
          String(user.visit_count || 0),
          user.id as string
        ];
        csvRows.push(row.join(','));
      });

      filename = `segment-${segment.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
