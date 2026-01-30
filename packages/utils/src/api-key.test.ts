import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  validateApiKeyFormat,
  getApiKeyPrefix,
  extractApiKeyPrefix,
  maskApiKey,
  verifyApiKey,
} from './api-key.js';
import { API_KEY_PREFIX, LEGACY_API_KEY_PREFIX, API_KEY_LENGTH } from './constants.js';

describe('API key utilities', () => {
  describe('generateApiKey', () => {
    it('should generate a key with correct prefix', () => {
      const { key } = generateApiKey();
      expect(key.startsWith(API_KEY_PREFIX)).toBe(true);
    });

    it('should generate a key with correct length', () => {
      const { key } = generateApiKey();
      expect(key.length).toBe(API_KEY_PREFIX.length + API_KEY_LENGTH);
    });

    it('should generate a hash', () => {
      const { hash } = generateApiKey();
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 hex
    });

    it('should generate a prefix for identification', () => {
      const { key, prefix } = generateApiKey();
      expect(prefix.length).toBe(API_KEY_PREFIX.length + 8);
      expect(key.startsWith(prefix)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1.key).not.toBe(key2.key);
      expect(key1.hash).not.toBe(key2.hash);
    });
  });

  describe('hashApiKey', () => {
    it('should return consistent hash for same key', () => {
      const key = 'os_12345678901234567890123456789012';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different keys', () => {
      const hash1 = hashApiKey('os_12345678901234567890123456789012');
      const hash2 = hashApiKey('os_09876543210987654321098765432109');
      expect(hash1).not.toBe(hash2);
    });

    it('should return 64 character hex string', () => {
      const hash = hashApiKey('os_test');
      expect(hash.length).toBe(64);
      expect(/^[a-f0-9]+$/i.test(hash)).toBe(true);
    });
  });

  describe('getApiKeyPrefix', () => {
    it('should return os_ for new prefix', () => {
      expect(getApiKeyPrefix('os_12345678901234567890123456789012')).toBe('os_');
    });

    it('should return cf_ for legacy prefix', () => {
      expect(getApiKeyPrefix('cf_12345678901234567890123456789012')).toBe('cf_');
    });

    it('should return null for invalid prefix', () => {
      expect(getApiKeyPrefix('xx_12345678901234567890123456789012')).toBeNull();
    });
  });

  describe('validateApiKeyFormat', () => {
    it('should return true for valid key with new prefix', () => {
      const { key } = generateApiKey();
      expect(validateApiKeyFormat(key)).toBe(true);
    });

    it('should return true for valid key with legacy prefix (backward compatibility)', () => {
      expect(validateApiKeyFormat('cf_12345678901234567890123456789012')).toBe(true);
    });

    it('should return false for wrong prefix', () => {
      expect(validateApiKeyFormat('xx_12345678901234567890123456789012')).toBe(false);
    });

    it('should return false for wrong length', () => {
      expect(validateApiKeyFormat('os_123')).toBe(false);
      expect(validateApiKeyFormat('os_1234567890123456789012345678901234567890')).toBe(false);
      expect(validateApiKeyFormat('cf_123')).toBe(false);
      expect(validateApiKeyFormat('cf_1234567890123456789012345678901234567890')).toBe(false);
    });

    it('should return false for non-hex characters', () => {
      expect(validateApiKeyFormat('os_1234567890123456789012345678901g')).toBe(false);
      expect(validateApiKeyFormat('cf_1234567890123456789012345678901g')).toBe(false);
    });
  });

  describe('extractApiKeyPrefix', () => {
    it('should extract the correct prefix for new keys', () => {
      const key = 'os_12345678901234567890123456789012';
      const prefix = extractApiKeyPrefix(key);
      expect(prefix).toBe('os_12345678');
    });

    it('should extract the correct prefix for legacy keys', () => {
      const key = 'cf_12345678901234567890123456789012';
      const prefix = extractApiKeyPrefix(key);
      expect(prefix).toBe('cf_12345678');
    });
  });

  describe('maskApiKey', () => {
    it('should mask the key correctly for new keys', () => {
      const key = 'os_12345678901234567890123456789012';
      const masked = maskApiKey(key);
      expect(masked).toBe('os_12345678********');
    });

    it('should mask the key correctly for legacy keys', () => {
      const key = 'cf_12345678901234567890123456789012';
      const masked = maskApiKey(key);
      expect(masked).toBe('cf_12345678********');
    });

    it('should not reveal the full key', () => {
      const { key } = generateApiKey();
      const masked = maskApiKey(key);
      // The masked version should be shorter than the original
      expect(masked.length).toBeLessThan(key.length);
      // Should end with asterisks
      expect(masked.endsWith('********')).toBe(true);
    });
  });

  describe('verifyApiKey', () => {
    it('should verify a valid key-hash pair', () => {
      const { key, hash } = generateApiKey();
      expect(verifyApiKey(key, hash)).toBe(true);
    });

    it('should reject invalid key', () => {
      const { hash } = generateApiKey();
      expect(verifyApiKey('os_wrongkey01234567890123456789012', hash)).toBe(false);
    });

    it('should verify legacy keys correctly', () => {
      // Legacy keys should still work - hash is based on the full key string
      const legacyKey = 'cf_12345678901234567890123456789012';
      const hash = hashApiKey(legacyKey);
      expect(verifyApiKey(legacyKey, hash)).toBe(true);
    });

    it('should reject invalid hash', () => {
      const { key } = generateApiKey();
      const wrongHash = 'a'.repeat(64);
      expect(verifyApiKey(key, wrongHash)).toBe(false);
    });

    it('should reject mismatched lengths', () => {
      const { key } = generateApiKey();
      expect(verifyApiKey(key, 'shorthash')).toBe(false);
    });
  });
});
