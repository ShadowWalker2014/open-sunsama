/**
 * The pending authorization request travels from /oauth/authorize to the
 * web app's consent screen and back as a short-lived signed JWT, so the API
 * keeps no server-side state until the user actually approves.
 */

import jwt from "jsonwebtoken";
import { CONSENT_REQUEST_TTL_SECONDS } from "./config.js";

const SECRET = process.env.JWT_SECRET || "open-sunsama-dev-secret-change-in-production";
const AUDIENCE = "open-sunsama:oauth-consent";

export interface ConsentRequest {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource: string | null;
  state: string | null;
}

export function signConsentRequest(request: ConsentRequest): string {
  return jwt.sign({ req: request }, SECRET, {
    audience: AUDIENCE,
    expiresIn: CONSENT_REQUEST_TTL_SECONDS,
  });
}

export function verifyConsentRequest(token: string): ConsentRequest | null {
  try {
    const decoded = jwt.verify(token, SECRET, { audience: AUDIENCE }) as { req?: ConsentRequest };
    return decoded.req ?? null;
  } catch {
    return null;
  }
}
