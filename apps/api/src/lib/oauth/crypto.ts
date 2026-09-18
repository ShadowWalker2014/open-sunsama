import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(prefix: string, bytes = 32): string {
  return `${prefix}${randomBytes(bytes).toString("base64url")}`;
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const PKCE_VERIFIER = /^[A-Za-z0-9\-._~]{43,128}$/;

/** RFC 7636 S256: BASE64URL(SHA256(verifier)) === challenge */
export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  if (!PKCE_VERIFIER.test(codeVerifier)) return false;
  const computed = createHash("sha256").update(codeVerifier).digest("base64url");
  return safeEqual(computed, codeChallenge);
}
