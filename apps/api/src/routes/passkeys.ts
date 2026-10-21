import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
  type RegistrationResponseJSON, type AuthenticationResponseJSON,
  type AuthenticatorTransport,
} from '@simplewebauthn/server';
import { getDb, eq, and, gt, lt, passkeys, passkeyChallenges, users } from '@open-sunsama/database';
import { AuthenticationError } from '@open-sunsama/utils';
import { jwtAuth, type AuthVariables } from '../middleware/auth.js';
import { getPasskeyConfig } from '../lib/passkeys.js';
import { signToken } from '../lib/jwt.js';
import { formatUser } from '../lib/auth-user.js';

export const passkeysRouter = new Hono<{ Variables: AuthVariables }>();
const verificationSchema = z.object({
  challengeId: z.uuid(),
  response: z.object({ id: z.string().min(1), response: z.object({}).loose() }).loose(),
});

async function saveChallenge(challenge: string, purpose: string, origin: string, rpId: string, userId?: string) {
  const db = getDb();
  await db.delete(passkeyChallenges).where(lt(passkeyChallenges.expiresAt, new Date()));
  const [row] = await db.insert(passkeyChallenges).values({
    challenge, purpose, origin, rpId, userId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  }).returning();
  return row!.id;
}

async function consumeChallenge(id: string, purpose: string, origin: string, userId?: string) {
  const [row] = await getDb().delete(passkeyChallenges).where(and(
    eq(passkeyChallenges.id, id), eq(passkeyChallenges.purpose, purpose),
    eq(passkeyChallenges.origin, origin), gt(passkeyChallenges.expiresAt, new Date()),
    ...(userId ? [eq(passkeyChallenges.userId, userId)] : []),
  )).returning();
  if (!row) throw new AuthenticationError('Passkey request expired or already used. Please try again.');
  return row;
}

passkeysRouter.get('/', jwtAuth, async (c) => {
  const data = await getDb().select({
    id: passkeys.id, name: passkeys.name, createdAt: passkeys.createdAt, lastUsedAt: passkeys.lastUsedAt,
  }).from(passkeys).where(eq(passkeys.userId, c.get('userId')));
  return c.json({ success: true, data });
});

passkeysRouter.delete('/:id', jwtAuth, async (c) => {
  await getDb().delete(passkeys).where(and(eq(passkeys.id, c.req.param('id')), eq(passkeys.userId, c.get('userId'))));
  return c.json({ success: true });
});

passkeysRouter.post('/register/options', jwtAuth, async (c) => {
  const { origin, rpID } = getPasskeyConfig(c.req.header('Origin'));
  const userId = c.get('userId');
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new AuthenticationError('User not found');
  const existing = await db.select().from(passkeys).where(eq(passkeys.userId, userId));
  const options = await generateRegistrationOptions({
    rpName: 'Open Sunsama', rpID, userName: user.email,
    userID: new TextEncoder().encode(user.id), userDisplayName: user.name || user.email,
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    excludeCredentials: existing.map((key) => ({ id: key.id, transports: key.transports as AuthenticatorTransport[] })),
  });
  const challengeId = await saveChallenge(options.challenge, 'register', origin, rpID, userId);
  return c.json({ success: true, data: { options, challengeId } });
});

passkeysRouter.post('/register/verify', jwtAuth, zValidator('json', verificationSchema.extend({ name: z.string().trim().min(1).max(100) })), async (c) => {
  const { origin } = getPasskeyConfig(c.req.header('Origin'));
  const { challengeId, response, name } = c.req.valid('json');
  const ceremony = await consumeChallenge(challengeId, 'register', origin, c.get('userId'));
  let result;
  try {
    result = await verifyRegistrationResponse({
      response: response as unknown as RegistrationResponseJSON,
      expectedChallenge: ceremony.challenge, expectedOrigin: ceremony.origin,
      expectedRPID: ceremony.rpId, requireUserVerification: true,
    });
  } catch {
    throw new AuthenticationError('Could not verify passkey. Please try again.');
  }
  if (!result.verified || !result.registrationInfo) throw new AuthenticationError('Could not verify passkey');
  const { credential, credentialBackedUp } = result.registrationInfo;
  await getDb().insert(passkeys).values({
    id: credential.id, userId: c.get('userId'),
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter, transports: credential.transports || [],
    backedUp: credentialBackedUp, name,
  });
  return c.json({ success: true });
});

// Discoverable credentials let 1Password and platform authenticators choose an
// account without requiring an email, including conditional/autofill sign-in.
passkeysRouter.post('/login/options', async (c) => {
  const { origin, rpID } = getPasskeyConfig(c.req.header('Origin'));
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'required' });
  const challengeId = await saveChallenge(options.challenge, 'login', origin, rpID);
  return c.json({ success: true, data: { options, challengeId } });
});

passkeysRouter.post('/login/verify', zValidator('json', verificationSchema), async (c) => {
  const { origin } = getPasskeyConfig(c.req.header('Origin'));
  const { challengeId, response } = c.req.valid('json');
  const ceremony = await consumeChallenge(challengeId, 'login', origin);
  const db = getDb();
  const [key] = await db.select().from(passkeys).where(eq(passkeys.id, response.id));
  if (!key) throw new AuthenticationError('Passkey not recognized');
  const credentialResponse = response as unknown as AuthenticationResponseJSON;
  if (credentialResponse.response.userHandle && credentialResponse.response.userHandle !== Buffer.from(key.userId).toString('base64url')) {
    throw new AuthenticationError('Passkey account does not match');
  }
  let result;
  try {
    result = await verifyAuthenticationResponse({
      response: credentialResponse,
      expectedChallenge: ceremony.challenge, expectedOrigin: ceremony.origin,
      expectedRPID: ceremony.rpId, requireUserVerification: true,
      credential: {
        id: key.id, publicKey: new Uint8Array(Buffer.from(key.publicKey, 'base64url')),
        counter: key.counter, transports: key.transports as AuthenticatorTransport[],
      },
    });
  } catch {
    throw new AuthenticationError('Could not verify passkey. Please try again.');
  }
  if (!result.verified) throw new AuthenticationError('Could not verify passkey');
  const [updated] = await db.update(passkeys).set({
    counter: result.authenticationInfo.newCounter,
    backedUp: result.authenticationInfo.credentialBackedUp, lastUsedAt: new Date(),
  }).where(and(eq(passkeys.id, key.id), eq(passkeys.counter, key.counter))).returning();
  if (!updated) throw new AuthenticationError('Passkey changed. Please try again.');
  const [user] = await db.select().from(users).where(eq(users.id, key.userId));
  if (!user) throw new AuthenticationError('User not found');
  return c.json({ success: true, data: { user: formatUser(user), token: signToken(user.id) } });
});
