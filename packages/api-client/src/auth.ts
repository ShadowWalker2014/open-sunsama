/**
 * Authentication API methods
 * @module @chronoflow/api-client/auth
 */

import type {
  User,
  CreateUserInput,
  LoginInput,
  AuthResponse,
  UpdateUserInput,
  ChangePasswordInput,
} from "@chronoflow/types";
import type { ChronoflowClient, RequestOptions } from "./client.js";

/**
 * Authentication API interface
 */
export interface AuthApi {
  /**
   * Register a new user account
   * @param input User registration data
   * @returns The created user and authentication token
   */
  register(input: CreateUserInput, options?: RequestOptions): Promise<AuthResponse>;

  /**
   * Log in with email and password
   * @param input Login credentials
   * @returns The authenticated user and token
   */
  login(input: LoginInput, options?: RequestOptions): Promise<AuthResponse>;

  /**
   * Log out the current user (invalidates the current token)
   */
  logout(options?: RequestOptions): Promise<void>;

  /**
   * Get the current authenticated user's profile
   * @returns The current user's data
   */
  getMe(options?: RequestOptions): Promise<User>;

  /**
   * Update the current user's profile
   * @param input Fields to update
   * @returns The updated user data
   */
  updateMe(input: UpdateUserInput, options?: RequestOptions): Promise<User>;

  /**
   * Change the current user's password
   * @param input Current and new password
   */
  changePassword(input: ChangePasswordInput, options?: RequestOptions): Promise<void>;

  /**
   * Request a password reset email
   * @param email The user's email address
   */
  requestPasswordReset(email: string, options?: RequestOptions): Promise<void>;

  /**
   * Reset password using a reset token
   * @param token Password reset token
   * @param newPassword New password to set
   */
  resetPassword(
    token: string,
    newPassword: string,
    options?: RequestOptions
  ): Promise<void>;

  /**
   * Refresh the authentication token
   * @returns New authentication response with fresh token
   */
  refreshToken(options?: RequestOptions): Promise<AuthResponse>;

  /**
   * Verify email with a verification token
   * @param token Email verification token
   */
  verifyEmail(token: string, options?: RequestOptions): Promise<void>;

  /**
   * Resend email verification
   */
  resendVerificationEmail(options?: RequestOptions): Promise<void>;
}

/**
 * Create authentication API methods bound to a client
 * @param client The Chronoflow client instance
 * @returns Auth API methods
 */
export function createAuthApi(client: ChronoflowClient): AuthApi {
  return {
    async register(
      input: CreateUserInput,
      options?: RequestOptions
    ): Promise<AuthResponse> {
      return client.post<AuthResponse>("auth/register", input, options);
    },

    async login(
      input: LoginInput,
      options?: RequestOptions
    ): Promise<AuthResponse> {
      return client.post<AuthResponse>("auth/login", input, options);
    },

    async logout(options?: RequestOptions): Promise<void> {
      return client.post<void>("auth/logout", undefined, options);
    },

    async getMe(options?: RequestOptions): Promise<User> {
      return client.get<User>("auth/me", options);
    },

    async updateMe(
      input: UpdateUserInput,
      options?: RequestOptions
    ): Promise<User> {
      return client.patch<User>("auth/me", input, options);
    },

    async changePassword(
      input: ChangePasswordInput,
      options?: RequestOptions
    ): Promise<void> {
      return client.post<void>("auth/change-password", input, options);
    },

    async requestPasswordReset(
      email: string,
      options?: RequestOptions
    ): Promise<void> {
      return client.post<void>(
        "auth/request-password-reset",
        { email },
        options
      );
    },

    async resetPassword(
      token: string,
      newPassword: string,
      options?: RequestOptions
    ): Promise<void> {
      return client.post<void>(
        "auth/reset-password",
        { token, newPassword },
        options
      );
    },

    async refreshToken(options?: RequestOptions): Promise<AuthResponse> {
      return client.post<AuthResponse>("auth/refresh", undefined, options);
    },

    async verifyEmail(token: string, options?: RequestOptions): Promise<void> {
      return client.post<void>("auth/verify-email", { token }, options);
    },

    async resendVerificationEmail(options?: RequestOptions): Promise<void> {
      return client.post<void>(
        "auth/resend-verification",
        undefined,
        options
      );
    },
  };
}
