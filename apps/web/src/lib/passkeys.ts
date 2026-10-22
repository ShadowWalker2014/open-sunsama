import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { isDesktop } from "./desktop";

export function supportsPasskeys() {
  // Native webviews use an app origin, not the website's relying-party domain.
  return !isDesktop() && window.isSecureContext && browserSupportsWebAuthn();
}

export function passkeyError(error: unknown) {
  if (error instanceof Error && error.name === "NotAllowedError") {
    return "The passkey request was canceled or timed out. Please try again.";
  }
  if (error instanceof Error && error.name === "InvalidStateError") {
    return "This passkey is already registered. Try another authenticator.";
  }
  return error instanceof Error ? error.message : "Could not use passkey. Please try again.";
}
