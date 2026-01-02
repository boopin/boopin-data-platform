import { sql } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Ensure API keys table exists
async function ensureApiKeysTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(20) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        permissions JSONB DEFAULT '{"track_events": true, "read_data": false}'::jsonb,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `;
  } catch (error) {
    console.error('Error creating api_keys table:', error);
  }
}

// Generate a secure API key
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `pk_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = key.substring(0, 12); // pk_xxxxxxxx
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

// GET - List all API keys (without revealing full keys)
export async function GET() {
  try {
    await ensureApiKeysTable();

    const keys = await sql`
      SELECT
        id,
        name,
        key_prefix,
        permissions,
        last_used_at,
        created_at,
        expires_at,
        is_active
      FROM api_keys
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('API Keys GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    await ensureApiKeysTable();

    const body = await request.json();
    const { name, permissions, expires_in_days } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    const { key, prefix, hash } = generateApiKey();

    // Calculate expiration date if specified
    let expiresAt = null;
    if (expires_in_days) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expires_in_days));
      expiresAt = expirationDate.toISOString();
    }

    const defaultPermissions = {
      track_events: true,
      read_data: false,
      manage_goals: false,
      manage_segments: false
    };

    const result = await sql`
      INSERT INTO api_keys (name, key_prefix, key_hash, permissions, expires_at)
      VALUES (
        ${name},
        ${prefix},
        ${hash},
        ${JSON.stringify(permissions || defaultPermissions)},
        ${expiresAt}
      )
      RETURNING id, name, key_prefix, permissions, created_at, expires_at
    `;

    // Return the full key ONLY on creation (never again)
    return NextResponse.json({
      apiKey: result[0],
      key: key, // ⚠️ Only shown once!
      warning: 'Save this key securely - it will not be shown again!'
    }, { status: 201 });
  } catch (error) {
    console.error('API Keys POST error:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

// DELETE - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM api_keys WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Keys DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}

// PATCH - Toggle API key active status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    const result = await sql`
      UPDATE api_keys
      SET is_active = ${is_active}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiKey: result[0] });
  } catch (error) {
    console.error('API Keys PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

// Utility function to validate API key (used by other endpoints)
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; permissions?: any }> {
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

    // Check if key is active
    if (!key.is_active) {
      return { valid: false };
    }

    // Check if key is expired
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
