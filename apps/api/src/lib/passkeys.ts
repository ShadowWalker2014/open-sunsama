import { AuthenticationError } from '@open-sunsama/utils';

/** Only configured web origins may create ceremonies; never trust Host headers. */
export function getPasskeyConfig(origin: string | undefined) {
  const origins = (process.env.PASSKEY_ORIGINS || process.env.WEB_APP_URL ||
    process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',').map((value) => new URL(value.trim()).origin);
  if (!origin || !origins.includes(origin)) {
    throw new AuthenticationError('Passkeys are not available from this origin');
  }
  const url = new URL(origin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new AuthenticationError('Passkeys require HTTPS or localhost');
  }
  const rpID = process.env.PASSKEY_RP_ID || new URL(origins[0]!).hostname;
  if (url.hostname !== rpID && !url.hostname.endsWith(`.${rpID}`)) {
    throw new AuthenticationError('Passkey relying party does not match this origin');
  }
  return { origin, rpID };
}
