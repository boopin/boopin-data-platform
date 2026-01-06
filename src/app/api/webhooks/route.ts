import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Ensure webhooks table exists
async function ensureWebhooksTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        event_types JSONB,
        secret VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_triggered_at TIMESTAMP,
        total_triggers INTEGER DEFAULT 0,
        last_status INTEGER,
        last_error TEXT
      )
    `;
  } catch (error) {
    console.error('Error creating webhooks table:', error);
  }
}

// GET - List all webhooks
export async function GET(request: NextRequest) {
  try {
    await ensureWebhooksTable();

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    const webhooks = await sql`
      SELECT * FROM webhooks WHERE site_id = ${siteId} ORDER BY created_at DESC
    `;

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Webhooks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    await ensureWebhooksTable();

    const body = await request.json();
    const { name, url, event_types, site_id } = body;

    // Site ID is required for multi-site support
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    if (!name || !url) {
      return NextResponse.json(
        { error: 'name and url are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generate secret for webhook signature
    const secret = crypto.randomBytes(32).toString('hex');

    const result = await sql`
      INSERT INTO webhooks (name, url, event_types, secret, site_id)
      VALUES (
        ${name},
        ${url},
        ${event_types ? JSON.stringify(event_types) : null},
        ${secret},
        ${site_id}
      )
      RETURNING *
    `;

    return NextResponse.json({
      webhook: result[0],
      secret: secret // Only shown on creation
    }, { status: 201 });
  } catch (error) {
    console.error('Webhooks POST error:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}

// PUT - Update a webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, url, event_types, is_active, site_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
    }

    // Site ID is required for multi-site support
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    const result = await sql`
      UPDATE webhooks
      SET
        name = COALESCE(${name}, name),
        url = COALESCE(${url}, url),
        event_types = COALESCE(${event_types ? JSON.stringify(event_types) : null}, event_types),
        is_active = COALESCE(${is_active}, is_active)
      WHERE id = ${id} AND site_id = ${site_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ webhook: result[0] });
  } catch (error) {
    console.error('Webhooks PUT error:', error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

// DELETE - Delete a webhook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const siteId = searchParams.get('site_id');

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
    }

    // Site ID is required for multi-site support
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM webhooks WHERE id = ${id} AND site_id = ${siteId} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhooks DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}

// POST /test - Test a webhook
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, site_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
    }

    // Site ID is required for multi-site support
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 });
    }

    // Get webhook
    const webhooks = await sql`
      SELECT * FROM webhooks WHERE id = ${id} AND site_id = ${site_id}
    `;

    if (webhooks.length === 0) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhook = webhooks[0];

    // Send test payload
    const testPayload = {
      webhook_id: webhook.id,
      event_type: 'test',
      data: {
        message: 'This is a test webhook from Pulse Analytics',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Pulse-Analytics-Signature': webhook.secret || '',
          'User-Agent': 'PulseAnalytics-Webhook/1.0'
        },
        body: JSON.stringify(testPayload)
      });

      // Update webhook stats
      await sql`
        UPDATE webhooks
        SET
          last_triggered_at = CURRENT_TIMESTAMP,
          last_status = ${response.status},
          total_triggers = total_triggers + 1
        WHERE id = ${id}
      `;

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      });
    } catch (error: any) {
      // Update error
      await sql`
        UPDATE webhooks
        SET last_error = ${error.message}
        WHERE id = ${id}
      `;

      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: 'Failed to test webhook' }, { status: 500 });
  }
}
