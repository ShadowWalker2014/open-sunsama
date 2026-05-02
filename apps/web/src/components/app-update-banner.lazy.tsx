import * as React from "react";
import { isDesktop } from "@/lib/desktop";
import type * as AppUpdateBannerModuleNS from "./app-update-banner";

/**
 * Lazy entry point for the desktop auto-update banner.
 *
 * The real component pulls in `useAppUpdate` (which dynamically imports
 * `@tauri-apps/plugin-updater` + `@tauri-apps/plugin-process`) and a stack
 * of icons. None of that is needed on the web — `isDesktop()` is false
 * and the banner is a no-op. This wrapper short-circuits to `null` for
 * web users so the chunk is never even fetched.
 *
 * On desktop, the chunk is loaded behind a `React.lazy` boundary and
 * mounted once. Suspense fallback is `null` because the banner itself
 * renders `null` until an update is detected — there's nothing to show.
 */

type AppUpdateBannerModule = typeof AppUpdateBannerModuleNS;

let preload: Promise<AppUpdateBannerModule> | null = null;

function importBanner(): Promise<AppUpdateBannerModule> {
  if (!preload) {
    preload = import("./app-update-banner") as Promise<AppUpdateBannerModule>;
  }
  return preload;
}

const LazyAppUpdateBanner = React.lazy(async () => {
  const mod = await importBanner();
  return { default: mod.AppUpdateBanner };
});

export function AppUpdateBanner() {
  // Web users will never see the banner; don't even fetch the chunk.
  // Computed once via useState so HMR re-renders don't toggle it.
  const [isDesktopApp] = React.useState(() => isDesktop());

  if (!isDesktopApp) return null;

  return (
    <React.Suspense fallback={null}>
      <LazyAppUpdateBanner />
    </React.Suspense>
  );
}
