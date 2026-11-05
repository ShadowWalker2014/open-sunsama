import type { users } from '@open-sunsama/database';
import type { User } from '@open-sunsama/types';

/** Explicit allowlist shared by password and passkey sign-in responses. */
export function formatUser(user: typeof users.$inferSelect): Omit<User, 'passwordHash'> {
  return {
    id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl,
    timezone: user.timezone || 'UTC', createdAt: user.createdAt, updatedAt: user.updatedAt,
    preferences: user.preferences || null,
  };
}
