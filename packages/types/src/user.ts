/**
 * User-related type definitions for Chronoflow
 * @module @chronoflow/types/user
 */

/**
 * Represents a user in the Chronoflow system.
 * Users are the primary entities that own tasks, time blocks, and API keys.
 */
export interface User {
  /** Unique identifier for the user (UUID format) */
  id: string;

  /** User's email address (unique, used for authentication) */
  email: string;

  /** User's display name (optional) */
  name: string | null;

  /** URL to the user's avatar image (optional) */
  avatarUrl: string | null;

  /** User's preferred timezone (IANA timezone identifier, e.g., "America/New_York") */
  timezone: string;

  /** Timestamp when the user account was created */
  createdAt: Date;

  /** Timestamp when the user account was last updated */
  updatedAt: Date;
}

/**
 * Input data required to create a new user account.
 * Used during the registration process.
 */
export interface CreateUserInput {
  /** User's email address (must be unique and valid) */
  email: string;

  /** User's password (will be hashed before storage) */
  password: string;

  /** Optional display name for the user */
  name?: string;
}

/**
 * Input data required for user authentication.
 * Used during the login process.
 */
export interface LoginInput {
  /** User's email address */
  email: string;

  /** User's password (plaintext, will be verified against stored hash) */
  password: string;
}

/**
 * Response returned after successful authentication.
 * Contains the authenticated user's data and a JWT token for subsequent requests.
 */
export interface AuthResponse {
  /** The authenticated user's data */
  user: User;

  /** JWT token for authenticating subsequent API requests */
  token: string;
}

/**
 * Input data for updating an existing user's profile.
 * All fields are optional; only provided fields will be updated.
 */
export interface UpdateUserInput {
  /** Updated display name */
  name?: string | null;

  /** Updated avatar URL */
  avatarUrl?: string | null;

  /** Updated timezone preference */
  timezone?: string;
}

/**
 * Input data for changing a user's password.
 * Requires the current password for verification.
 */
export interface ChangePasswordInput {
  /** User's current password for verification */
  currentPassword: string;

  /** New password to set */
  newPassword: string;
}

/**
 * Public user profile information.
 * A subset of User data safe for public display.
 */
export interface PublicUserProfile {
  /** Unique identifier for the user */
  id: string;

  /** User's display name */
  name: string | null;

  /** URL to the user's avatar image */
  avatarUrl: string | null;
}
