# Passkey Authentication — Implementation Plan

**Status:** Future feature; planning only. RP identity, recovery, and native-client strategy require confirmation.
**Goal:** Let existing users enroll passkeys and sign in with them while preserving current password access and session behavior.
**Architecture:** Add server-verified WebAuthn registration/authentication ceremonies, persisted single-use challenges, and user-owned credential records. Successful authentication issues the same JWT/AuthResponse as password login.
**Stack:** Hono, PostgreSQL/Drizzle, React, WebAuthn; proposed maintained `@simplewebauthn/server` and `@simplewebauthn/browser` dependencies, pending approval.

## Current context

- `apps/api/src/routes/auth.ts` implements password registration/login, JWT refresh, and `AuthResponse` formatting.
- `apps/api/src/lib/jwt.ts` signs sessions; `apps/api/src/middleware/auth.ts` also accepts API/MCP credentials. Possession of an API key must not be sufficient to enroll an account-login credential.
- `apps/web/src/routes/login.tsx` is the browser sign-in surface; `apps/web/src/components/settings/password-settings.tsx` is the existing credential-settings precedent.
- Desktop uses bundled Tauri web content and native HTTP. Successful API requests do not prove the webview supports WebAuthn or the production relying-party origin.
- `apps/mobile` is Tauri; `apps/expo-mobile` is Expo. Native passkey support requires its own verified platform flow.

## Initial product boundary

1. An existing password account can add, name, list, and revoke its own passkeys from Security settings after recent interactive authentication.
2. The login page adds “Sign in with a passkey.” Proposed discoverable credential login avoids needing an email first; use email-first only if agreed as the compatibility fallback.
3. Password login and existing recovery remain available. Passwordless account creation and removal of passwords are later scope.
4. A canceled biometric dialog leaves the user on login with a normal retry/password option, not a fatal error.
5. Passkeys are authentication credentials, not an app-lock biometric toggle or a new MFA policy.

## Decisions before implementation

- Production RP ID and frontend origin allowlist: proposed `opensunsama.com` for hosted web and explicit local-development configuration. The API host is not automatically the RP ID; the actual page performing WebAuthn determines the origin.
- Self-hosting: each installation needs stable RP configuration. Credentials cannot be moved to a different RP ID by editing a URL.
- Recent-auth policy for enrollment/revocation and recovery behavior. Existing JWT sessions are not proof of a fresh interactive login; implement server-verifiable step-up authentication.
- Approve WebAuthn dependencies and browser-first release. Native/desktop support must pass a compatibility spike before being promised.

## Implementation sequence

1. **Verify the client capability matrix.** Test WebAuthn on hosted web in Safari, Chrome, and Firefox; investigate signed Tauri builds and iOS/Android native clients separately. Record origins and plugin/native API requirements. Deliver browser support first if native RP/origin handling requires additional work.
2. **Add credential/challenge storage.** Create `packages/database/src/schema/passkeys.ts` and `auth-challenges.ts`; export in `schema/index.ts`. Store unique credential ID, user ID, public key bytes, counter, transports, backup/device flags, display name, created/last-used timestamps, and opaque stable user handle. Challenges store purpose, ceremony/session binding, user where applicable, expiry, and consumption state. Never store private keys or biometric data. Generate and review migrations.
3. **Add the WebAuthn service.** Create `apps/api/src/lib/webauthn.ts` and `.test.ts`. Configure exact RP/origin allowlists, user verification requirements, discoverable credentials, and no unnecessary attestation requirement. Use library verification; do not build custom crypto. Accept synced passkeys with zero counters according to library guidance, and record backup flags rather than incorrectly requiring every authenticator counter to increase.
4. **Add enrollment endpoints.** Create `apps/api/src/routes/passkeys.ts` and `apps/api/src/validation/passkeys.ts`; mount under `/auth/passkeys` in `apps/api/src/index.ts`. Registration options and verify require a user-owned recent interactive session and exclude API-key/MCP auth. Bind challenges to user and ceremony. Verify origin, RP hash, challenge, and user verification before storing a credential; prevent globally duplicated credential IDs.
5. **Add login endpoints.** Public authentication options and verify are rate-limited. Generate random expiring challenges bound to a browser ceremony token; discoverable assertion lookup verifies credential ownership and user handle. Consume a challenge atomically so concurrent replays cannot issue two sessions. On success reuse session issuance/formatting from `apps/api/src/routes/auth.ts` without diverging from password login.
6. **Add credential management.** List safe metadata, rename, and revoke only the current user's credentials. Require recent authentication for sensitive changes. Agree whether revocation also invalidates current sessions: JWTs are currently stateless, so global logout is not implied by deleting a passkey row. Keep password recovery usable for lost authenticators.
7. **Add browser UX.** Extend `apps/web/src/routes/login.tsx`, the existing auth state/client layer, and create `apps/web/src/components/settings/passkeys-settings.tsx`. Feature-detect WebAuthn, handle cancellation and unsupported devices, show meaningful credential names, and offer retry. Implement conditional autofill only after explicit-button login works; handle its abort lifecycle. Preserve pending navigation intents through successful sign-in.
8. **Document deployment and stage rollout.** Add `apps/web/src/content/docs/passkeys.mdx`, explicit RP/origin environment documentation, and a feature gate if needed. Launch browser enrollment/login; release native support only once each platform is proven. If external-browser authentication is chosen for desktop, use a single-use state/PKCE-bound handoff code, never a JWT in a deep-link URL.

## Validation and acceptance

- Verification rejects wrong challenge, RP ID, origin, purpose, user handle, expired/replayed challenge, missing required verification, and forged assertions.
- Atomic tests cover duplicate enrollment and parallel authentication verification. API keys cannot enroll or revoke passkeys.
- Browser automation uses virtual authenticators where supported; manual checks use actual platform and roaming authenticators, including a synced passkey and a canceled dialog.
- Enroll two credentials, sign out, sign in with each, revoke one, verify it fails, and confirm password login/recovery still work.
- Test reverse proxy configuration, local ports, and hosted frontend/API separation; CORS acceptance never substitutes for WebAuthn origin verification.
- Run `bun run typecheck`, `bun run lint`, targeted auth tests, and required CI. Use disposable accounts; never enroll agent-controlled credentials into a real account. Validate hosted production login after deployment.

## Delivery risks

Changing RP identity strands existing passkeys. Platform capability differs across webviews. Recovery is an account-security decision, and credential revocation is distinct from stateless-session revocation. Resolve these before expanding to passwordless-only accounts or native passkeys.
