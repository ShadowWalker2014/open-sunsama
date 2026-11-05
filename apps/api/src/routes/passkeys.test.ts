import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { PgDialect } from 'drizzle-orm/pg-core';
import { type SQL } from 'drizzle-orm';
import { signToken } from '../lib/jwt.js';
import { errorHandler } from '../middleware/error.js';

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(), verifyRegistrationResponse: vi.fn(), verifyAuthenticationResponse: vi.fn(),
}));
vi.mock('@open-sunsama/database', async (importOriginal) => ({
  ...await importOriginal<object>(), getDb: mocks.getDb,
}));
vi.mock('@simplewebauthn/server', async (importOriginal) => ({
  ...await importOriginal<object>(),
  verifyRegistrationResponse: mocks.verifyRegistrationResponse,
  verifyAuthenticationResponse: mocks.verifyAuthenticationResponse,
}));
import { passkeysRouter } from './passkeys.js';

const USER = 'b1593d7c-102c-49df-8fa8-5e5fc70abe03';
const CHALLENGE = '8d796a75-0c5f-47b3-8eb9-792663fbbdba';
const ORIGIN = 'https://tasks.example.com';
const ceremony = { challenge: 'random', origin: ORIGIN, rpId: 'tasks.example.com' };
const key = { id: 'credential', userId: USER, publicKey: 'AQID', counter: 1, transports: [] };
const body = { challengeId: CHALLENGE, response: { id: key.id, response: {} }, name: 'My passkey' };
const app = new Hono().route('/auth/passkeys', passkeysRouter).onError(errorHandler);

// The database is a queue of query results; predicates remain real Drizzle SQL
// so ownership, ceremony type, origin, and expiry constraints are inspected.
let results: unknown[][];
let predicates: SQL[];
const update = vi.fn();
const insert = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('PASSKEY_ORIGINS', ORIGIN);
  vi.stubEnv('PASSKEY_RP_ID', 'tasks.example.com');
  results = [];
  predicates = [];
  function chain() {
    return {
      from: () => chain(), set: () => chain(), values: () => chain(),
      where: (predicate: SQL) => { predicates.push(predicate); return chain(); },
      returning: async () => results.shift() || [],
      then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(results.shift() || []).then(resolve),
    };
  }
  update.mockImplementation(chain);
  insert.mockImplementation(chain);
  mocks.getDb.mockReturnValue({ select: chain, delete: chain, update, insert });
});
afterEach(() => vi.unstubAllEnvs());

function post(path: string, data = body, token?: string) {
  return app.request(`/auth/passkeys/${path}`, {
    method: 'POST', headers: {
      'Content-Type': 'application/json', Origin: ORIGIN,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, body: JSON.stringify(data),
  });
}

describe('passkey security boundaries', () => {
  it('requires a JWT session for enrollment and credential management', async () => {
    for (const token of [undefined, 'os_api-key', 'osat_connector-token']) {
      expect((await post('register/options', body, token)).status).toBe(401);
      expect((await app.request('/auth/passkeys', { headers: token ? { Authorization: `Bearer ${token}` } : {} })).status).toBe(401);
    }
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it('rejects an expired, consumed, or missing challenge before checking signatures', async () => {
    results = [[]];
    expect((await post('login/verify')).status).toBe(401);
    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
    const query = new PgDialect().sqlToQuery(predicates[0]!);
    expect(query.sql).toContain('"expires_at" >');
    expect(query.params).toEqual(expect.arrayContaining([CHALLENGE, 'login', ORIGIN]));
  });

  it('binds enrollment challenges to the signed-in account', async () => {
    results = [[]];
    expect((await post('register/verify', body, signToken(USER))).status).toBe(401);
    const query = new PgDialect().sqlToQuery(predicates[0]!);
    expect(query.sql).toContain('"user_id" =');
    expect(query.params).toEqual(expect.arrayContaining([USER, 'register', ORIGIN]));
    expect(insert).not.toHaveBeenCalled();
  });

  it('never creates a session after an invalid signature', async () => {
    results = [[ceremony], [key]];
    mocks.verifyAuthenticationResponse.mockRejectedValue(new Error('invalid signature'));
    expect((await post('login/verify')).status).toBe(401);
    expect(update).not.toHaveBeenCalled();
    expect(mocks.verifyAuthenticationResponse).toHaveBeenCalledWith(expect.objectContaining({
      expectedChallenge: ceremony.challenge, expectedOrigin: ORIGIN,
      expectedRPID: ceremony.rpId, requireUserVerification: true,
    }));
  });

  it('rejects a mismatched account handle before verifying the signature', async () => {
    results = [[ceremony], [key]];
    const data = { ...body, response: { id: key.id, response: { userHandle: 'another-account' } } };
    expect((await post('login/verify', data)).status).toBe(401);
    expect(mocks.verifyAuthenticationResponse).not.toHaveBeenCalled();
  });

  it('rejects unverified registration and does not store its public key', async () => {
    results = [[ceremony]];
    mocks.verifyRegistrationResponse.mockResolvedValue({ verified: false });
    expect((await post('register/verify', body, signToken(USER))).status).toBe(401);
    expect(insert).not.toHaveBeenCalled();
  });

  it('issues the normal session only after verification and a successful counter update', async () => {
    results = [[ceremony], [key], [key], [{
      id: USER, email: 'passkey-e2e@example.com', name: 'Tester', timezone: 'UTC',
      passwordHash: 'must-not-leak', passwordResetToken: 'must-not-leak',
    }]];
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true, authenticationInfo: { newCounter: 2, credentialBackedUp: true },
    });
    const response = await post('login/verify');
    expect(response.status).toBe(200);
    const json = await response.json() as { data: { token: string; user: Record<string, unknown> } };
    expect(json.data.token).toEqual(expect.any(String));
    expect(json.data.user.id).toBe(USER);
    expect(json.data.user.passwordHash).toBeUndefined();
    expect(json.data.user.passwordResetToken).toBeUndefined();
    const counterQuery = new PgDialect().sqlToQuery(predicates[2]!);
    expect(counterQuery.params).toEqual([key.id, key.counter]);
  });

  it('does not issue a session if a credential was removed or changed during verification', async () => {
    results = [[ceremony], [key], []];
    mocks.verifyAuthenticationResponse.mockResolvedValue({
      verified: true, authenticationInfo: { newCounter: 2, credentialBackedUp: false },
    });
    expect((await post('login/verify')).status).toBe(401);
  });

  it('scopes credential removal to the session owner', async () => {
    const response = await app.request('/auth/passkeys/credential', { method: 'DELETE', headers: { Authorization: `Bearer ${signToken(USER)}` } });
    expect(response.status).toBe(200);
    const query = new PgDialect().sqlToQuery(predicates[0]!);
    expect(query.params).toEqual(['credential', USER]);
  });
});
