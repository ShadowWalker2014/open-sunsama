/**
 * "Add to Home Screen" support: which phone/browser we're on, whether the
 * app already runs installed, and Chrome's one-tap install prompt.
 */

export type InstallPlatform =
  | "ios-safari"
  | "ios-chrome"
  | "ios-other"
  | "android-chrome"
  | "android-samsung"
  | "android-firefox"
  | "android-other"
  | "desktop";

export function detectInstallPlatform(
  userAgent: string,
  maxTouchPoints = 0
): InstallPlatform {
  const ua = userAgent;
  // iPadOS reports a Mac user agent; touch support gives it away.
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);
  if (isIOS) {
    if (/CriOS/i.test(ua)) return "ios-chrome";
    if (/FxiOS|EdgiOS|OPiOS/i.test(ua)) return "ios-other";
    return "ios-safari";
  }
  if (/Android/i.test(ua)) {
    if (/SamsungBrowser/i.test(ua)) return "android-samsung";
    if (/Firefox/i.test(ua)) return "android-firefox";
    if (/Chrome/i.test(ua)) return "android-chrome";
    return "android-other";
  }
  return "desktop";
}

export function currentInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  return detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0);
}

/** True when opened from the Home Screen (or inside the desktop app). */
export function isRunningInstalled(): boolean {
  if (typeof window === "undefined") return false;
  if ("__TAURI__" in window) return true;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

// --- Chrome / Edge / Samsung one-tap install -------------------------------

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/**
 * Must run at startup: the browser fires `beforeinstallprompt` once, early,
 * and it's lost if nobody is listening yet.
 */
export function captureInstallPrompt(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    // Keep Chrome's own mini-infobar away; we show our own guide instead.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

/** Shows the browser's install dialog. Resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = deferredPrompt;
  if (!event) return false;
  deferredPrompt = null;
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}
