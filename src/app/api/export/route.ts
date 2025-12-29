import { sql } from '../../../lib/db';
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const eventType = searchParams.get('eventType');
    const country = searchParams.get('country');
    const device = searchParams.get('device');
    const exportType = searchParams.get('type') || 'events';

    let whereConditions = [];
    if (dateFrom) whereConditions.push(`e.timestamp >= '${dateFrom}'`);
    if (dateTo) whereConditions.push(`e.timestamp <= '${dateTo}T23:59:59'`);
    if (eventType && eventType !== 'all') whereConditions.push(`e.event_type = '${eventType}'`);
    if (country && country !== 'all') whereConditions.push(`e.country = '${country}'`);
    if (device && device !== 'all') whereConditions.push(`e.device_type = '${device}'`);
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let csv = '';
    let filename = '';

    if (exportType === 'events') {
      const events = await sql.unsafe(`
        SELECT e.id, e.event_type, e.page_path, e.page_url, e.timestamp, 
               e.device_type, e.user_agent, e.ip_address, e.referrer,
               e.utm_source, e.utm_medium, e.utm_campaign,
               e.country, e.city, e.region,
               v.email, v.name, v.phone
        FROM events e
        LEFT JOIN visitors v ON e.visitor_id = v.id
        ${whereClause}
        ORDER BY e.timestamp DESC
        LIMIT 10000
      `);

      csv = 'ID,Event Type,Page Path,Page URL,Timestamp,Device,Browser,OS,Country,City,UTM Source,UTM Medium,UTM Campaign,Email,Name,Phone\n';
      
      for (const event of events) {
        const { browser, os } = parseUserAgent(String(event.user_agent || ''));
        csv += `"${event.id}","${event.event_type}","${event.page_path || ''}","${event.page_url || ''}","${event.timestamp}","${event.device_type || ''}","${browser}","${os}","${event.country || ''}","${event.city || ''}","${event.utm_source || ''}","${event.utm_medium || ''}","${event.utm_campaign || ''}","${event.email || ''}","${event.name || ''}","${event.phone || ''}"\n`;
      }
      filename = `events_export_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (exportType === 'users') {
      const users = await sql`
        SELECT id, email, name, phone, anonymous_id, first_seen_at, last_seen_at, visit_count, is_identified
        FROM visitors
        ORDER BY last_seen_at DESC
        LIMIT 10000
      `;

      csv = 'ID,Email,Name,Phone,Anonymous ID,First Seen,Last Seen,Visit Count,Identified\n';
      
      for (const user of users) {
        csv += `"${user.id}","${user.email || ''}","${user.name || ''}","${user.phone || ''}","${user.anonymous_id}","${user.first_seen_at}","${user.last_seen_at}","${user.visit_count}","${user.is_identified}"\n`;
      }
      filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    }

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
