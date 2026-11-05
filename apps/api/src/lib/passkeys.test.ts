import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPasskeyConfig } from './passkeys.js';

afterEach(() => vi.unstubAllEnvs());

describe('passkey relying-party configuration', () => {
  function configure(origins = 'https://tasks.example.com', rpId = 'tasks.example.com') {
    vi.stubEnv('PASSKEY_ORIGINS', origins);
    vi.stubEnv('PASSKEY_RP_ID', rpId);
  }

  it('uses the configured website, not the API host', () => {
    configure();
    expect(getPasskeyConfig('https://tasks.example.com')).toEqual({ origin: 'https://tasks.example.com', rpID: 'tasks.example.com' });
  });

  it('rejects absent, unlisted and lookalike origins', () => {
    configure();
    for (const origin of [undefined, 'https://evil.example', 'https://tasks.example.com.evil.example', 'null']) {
      expect(() => getPasskeyConfig(origin)).toThrow();
    }
  });

  it('requires secure origins except localhost', () => {
    configure('http://tasks.example.com');
    expect(() => getPasskeyConfig('http://tasks.example.com')).toThrow(/HTTPS/);
    configure('http://localhost:3307', 'localhost');
    expect(getPasskeyConfig('http://localhost:3307').rpID).toBe('localhost');
    expect(() => getPasskeyConfig('http://localhost:3000')).toThrow();
  });

  it('only permits relying-party domains that are a suffix boundary of the origin', () => {
    configure('https://tasks.example.com', 'example.com');
    expect(getPasskeyConfig('https://tasks.example.com').rpID).toBe('example.com');
    configure('https://notexample.com', 'example.com');
    expect(() => getPasskeyConfig('https://notexample.com')).toThrow(/does not match/);
  });

  it('derives defaults from the configured web app', () => {
    vi.stubEnv('PASSKEY_ORIGINS', '');
    vi.stubEnv('PASSKEY_RP_ID', '');
    vi.stubEnv('WEB_APP_URL', 'https://self-hosted.example');
    expect(getPasskeyConfig('https://self-hosted.example').rpID).toBe('self-hosted.example');
  });
});
