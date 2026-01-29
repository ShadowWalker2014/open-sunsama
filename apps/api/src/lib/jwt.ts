/**
 * JWT utilities for Open Sunsama API
 * Handles token signing and verification
 */

import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'open-sunsama-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token for a user
 * @param userId - The user ID to include in the token
 * @returns The signed JWT token
 */
export function signToken(userId: string): string {
  // Cast to any to bypass strict type checking on expiresIn
  // The string format like '7d' is valid at runtime
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
  } as SignOptions);
}

/**
 * Verify and decode a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload containing userId
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  return { userId: decoded.userId };
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
    return decoded as JwtPayload;
  }
  return null;
}
