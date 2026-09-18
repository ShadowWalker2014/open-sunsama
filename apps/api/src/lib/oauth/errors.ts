/** RFC 6749 §5.2 / RFC 7591 §3.2.2 error with the JSON body clients expect. */
export class OAuthError extends Error {
  readonly code: string;
  readonly status: number;
  readonly basicAuth: boolean;

  constructor(code: string, description: string, options: { status?: number; basicAuth?: boolean } = {}) {
    super(description);
    this.code = code;
    this.basicAuth = options.basicAuth ?? false;
    this.status = options.status ?? (code === "invalid_client" ? 401 : 400);
  }

  toJSON(): { error: string; error_description: string } {
    return { error: this.code, error_description: this.message };
  }
}
