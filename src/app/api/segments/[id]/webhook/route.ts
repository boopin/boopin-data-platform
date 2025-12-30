import { sql } from '../../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get webhook config for a segment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: segmentId } = await params;

    const result = await sql`
      SELECT id, segment_id, webhook_url, webhook_type, is_active, last_triggered, created_at
      FROM segment_webhooks
      WHERE segment_id = ${segmentId}
    `;

    return NextResponse.json({ webhooks: result });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json({ webhooks: [] });
  }
}

// Create/Update webhook for a segment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: segmentId } = await params;
    const body = await request.json();
    const { webhook_url, webhook_type, is_active } = body;

    if (!webhook_url) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
    }

    // Check if webhook already exists
    const existing = await sql`
      SELECT id FROM segment_webhooks
      WHERE segment_id = ${segmentId} AND webhook_type = ${webhook_type || 'generic'}
    `;

    if (existing.length > 0) {
      // Update existing
      const result = await sql`
        UPDATE segment_webhooks
        SET webhook_url = ${webhook_url}, is_active = ${is_active !== false}
        WHERE segment_id = ${segmentId} AND webhook_type = ${webhook_type || 'generic'}
        RETURNING *
      `;
      return NextResponse.json({ webhook: result[0] });
    } else {
      // Create new
      const result = await sql`
        INSERT INTO segment_webhooks (segment_id, webhook_url, webhook_type, is_active)
        VALUES (${segmentId}, ${webhook_url}, ${webhook_type || 'generic'}, ${is_active !== false})
        RETURNING *
      `;
      return NextResponse.json({ webhook: result[0] }, { status: 201 });
    }
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}

// Delete webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: segmentId } = await params;
    const { searchParams } = new URL(request.url);
    const webhookType = searchParams.get('type') || 'generic';

    await sql`
      DELETE FROM segment_webhooks
      WHERE segment_id = ${segmentId} AND webhook_type = ${webhookType}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
