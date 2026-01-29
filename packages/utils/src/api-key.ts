/**
 * API key utilities for Chronoflow
 */

import { createHash, randomBytes } from 'crypto';
import { API_KEY_PREFIX, API_KEY_LENGTH } from './constants.js';

/**
 * Result of generating a new API key
 */
export interface GeneratedApiKey {
  /** The full API key (show to user only once) */
  key: string;
  /** The hashed version of the key (store in database) */
  hash: string;
  /** The prefix of the key (for identification) */
  prefix: string;
}

/**
 * Generate a new API key
 * @returns Object containing the key, its hash, and prefix
 */
export function generateApiKey(): GeneratedApiKey {
  // Generate random bytes and convert to hex
  const randomPart = randomBytes(API_KEY_LENGTH).toString('hex').slice(0, API_KEY_LENGTH);
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(key);
  
  // Extract first 8 chars after prefix for identification
  const prefix = key.slice(0, API_KEY_PREFIX.length + 8);
  
  return { key, hash, prefix };
}

/**
 * Hash an API key for secure storage
 * @param key - The API key to hash
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate the format of an API key
 * @param key - The API key to validate
 * @returns True if the key format is valid
 */
export function validateApiKeyFormat(key: string): boolean {
  // Must start with the correct prefix
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false;
  }
  
  // Must have the correct total length
  const expectedLength = API_KEY_PREFIX.length + API_KEY_LENGTH;
  if (key.length !== expectedLength) {
    return false;
  }
  
  // The random part must be valid hex
  const randomPart = key.slice(API_KEY_PREFIX.length);
  const hexRegex = /^[a-f0-9]+$/i;
  return hexRegex.test(randomPart);
}

/**
 * Extract the prefix from an API key (for display/identification)
 * @param key - The full API key
 * @returns The prefix portion of the key
 */
export function extractApiKeyPrefix(key: string): string {
  return key.slice(0, API_KEY_PREFIX.length + 8);
}

/**
 * Mask an API key for display (show only prefix)
 * @param key - The full API key
 * @returns Masked key with asterisks
 */
export function maskApiKey(key: string): string {
  const prefix = extractApiKeyPrefix(key);
  return `${prefix}${'*'.repeat(8)}`;
}

/**
 * Compare an API key with its hash
 * @param key - The API key to verify
 * @param hash - The stored hash to compare against
 * @returns True if the key matches the hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = hashApiKey(key);
  // Use timing-safe comparison to prevent timing attacks
  if (keyHash.length !== hash.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < keyHash.length; i++) {
    result |= keyHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}
