import crypto from 'crypto';

/**
 * Hash sensitive PII data using SHA-256
 * Used for GDPR compliance and privacy protection
 */

const HASH_ALGORITHM = 'sha256';
const HASH_SALT = process.env.HASH_SALT || 'boopin-default-salt-change-in-production';

/**
 * Hash a string value (email, phone, IP address, etc.)
 */
export function hashValue(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Normalize the value (lowercase, trim)
  const normalized = value.toLowerCase().trim();

  if (!normalized) {
    return null;
  }

  // Create hash with salt
  const hash = crypto
    .createHash(HASH_ALGORITHM)
    .update(normalized + HASH_SALT)
    .digest('hex');

  return hash;
}

/**
 * Hash an email address
 */
export function hashEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return null;
  }

  return hashValue(email);
}

/**
 * Hash a phone number
 */
export function hashPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 7) {
    return null;
  }

  return hashValue(digits);
}

/**
 * Hash an IP address
 */
export function hashIP(ip: string | null | undefined): string | null {
  if (!ip) return null;

  // Validate IP format (basic check)
  if (!ip.includes('.') && !ip.includes(':')) {
    return null;
  }

  return hashValue(ip);
}

/**
 * Hash multiple values at once
 */
export function hashBatch(values: Record<string, string | null | undefined>): Record<string, string | null> {
  const hashed: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(values)) {
    hashed[key] = hashValue(value);
  }

  return hashed;
}

/**
 * Check if a value matches a hash (for verification)
 */
export function verifyHash(value: string, hash: string): boolean {
  const computedHash = hashValue(value);
  return computedHash === hash;
}
