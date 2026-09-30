/** Errors shared by provider adapters and integration routes. */
export class ProviderCredentialError extends Error {
  readonly code = "PROVIDER_CREDENTIAL_INVALID" as const;
  constructor(provider: string, detail?: string) {
    super(`${provider} rejected the stored credentials${detail ? `: ${detail}` : ""} — please reconnect the account`);
    this.name = "ProviderCredentialError";
  }
}

export class ProviderTaskNotFoundError extends Error {
  readonly code = "EXTERNAL_TASK_NOT_FOUND" as const;
  constructor(provider: string, externalId: string) {
    super(`${provider} has no task "${externalId}", or your token can't see it`);
    this.name = "ProviderTaskNotFoundError";
  }
}

export class ProviderRateLimitError extends Error {
  readonly code = "PROVIDER_RATE_LIMITED" as const;
  constructor(provider: string, readonly retryAfterSeconds: number | null = null) {
    super(`${provider} rate limit reached — try again in a moment`);
    this.name = "ProviderRateLimitError";
  }
}

export class ProviderRequestError extends Error {
  readonly code = "PROVIDER_REQUEST_FAILED" as const;
  constructor(provider: string, readonly status: number, detail?: string) {
    super(`${provider} request failed with ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "ProviderRequestError";
  }
}
