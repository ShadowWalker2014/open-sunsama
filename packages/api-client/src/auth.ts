/**
 * Authentication API methods
 * @module @open-sunsama/api-client/auth
 */

import type {
  User,
  CreateUserInput,
  LoginInput,
  AuthResponse,
  UpdateUserInput,
  ChangePasswordInput,
} from "@open-sunsama/types";
import type { OpenSunsamaClient, RequestOptions } from "./client.js";
import type {
  PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON, AuthenticationResponseJSON,
} from "@simplewebauthn/browser";

export interface PasskeySummary {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/**
 * Authentication API interface
 */
export interface AuthApi {
  listPasskeys(): Promise<PasskeySummary[]>;
  deletePasskey(id: string): Promise<void>;
  passkeyRegistrationOptions(): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; challengeId: string }>;
  verifyPasskeyRegistration(input: { challengeId: string; response: RegistrationResponseJSON; name: string }): Promise<void>;
  passkeyLoginOptions(): Promise<{ options: PublicKeyCredentialRequestOptionsJSON; challengeId: string }>;
  verifyPasskeyLogin(input: { challengeId: string; response: AuthenticationResponseJSON }): Promise<AuthResponse>;
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
 * @param client The Open Sunsama client instance
 * @returns Auth API methods
 */
// API response wrapper type
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
}

export function createAuthApi(client: OpenSunsamaClient): AuthApi {
  return {
    async listPasskeys() {
      return (await client.get<ApiResponseWrapper<PasskeySummary[]>>("auth/passkeys")).data;
    },
    async deletePasskey(id) {
      await client.delete(`auth/passkeys/${encodeURIComponent(id)}`);
    },
    async passkeyRegistrationOptions() {
      return (await client.post<ApiResponseWrapper<{ options: PublicKeyCredentialCreationOptionsJSON; challengeId: string }>>("auth/passkeys/register/options", {})).data;
    },
    async verifyPasskeyRegistration(input) {
      await client.post("auth/passkeys/register/verify", input);
    },
    async passkeyLoginOptions() {
      return (await client.post<ApiResponseWrapper<{ options: PublicKeyCredentialRequestOptionsJSON; challengeId: string }>>("auth/passkeys/login/options", {})).data;
    },
    async verifyPasskeyLogin(input) {
      return (await client.post<ApiResponseWrapper<AuthResponse>>("auth/passkeys/login/verify", input)).data;
    },
    async register(
      input: CreateUserInput,
      options?: RequestOptions
    ): Promise<AuthResponse> {
      const response = await client.post<ApiResponseWrapper<AuthResponse>>("auth/register", input, options);
      return response.data;
    },

    async login(
      input: LoginInput,
      options?: RequestOptions
    ): Promise<AuthResponse> {
      const response = await client.post<ApiResponseWrapper<AuthResponse>>("auth/login", input, options);
      return response.data;
    },

    async logout(options?: RequestOptions): Promise<void> {
      return client.post<void>("auth/logout", undefined, options);
    },

    async getMe(options?: RequestOptions): Promise<User> {
      const response = await client.get<ApiResponseWrapper<User>>("auth/me", options);
      return response.data;
    },

    async updateMe(
      input: UpdateUserInput,
      options?: RequestOptions
    ): Promise<User> {
      const response = await client.patch<ApiResponseWrapper<User>>("auth/me", input, options);
      return response.data;
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
      const response = await client.post<ApiResponseWrapper<AuthResponse>>("auth/refresh", undefined, options);
      return response.data;
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
