import { sql } from './db';
import crypto from 'crypto';

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; permissions?: any }> {
  try {
    // Hash the provided API key
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Look up the key in the database
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

    // Check if key has expired
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return { valid: false };
    }

    // Update last_used_at
    await sql`
      UPDATE api_keys
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE id = ${key.id}
    `;

    return {
      valid: true,
      permissions: key.permissions
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { valid: false };
  }
}
