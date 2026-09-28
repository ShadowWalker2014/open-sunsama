import * as React from "react";

/**
 * `React.lazy` with a preload that pays off. A plain `React.lazy` suspends on
 * its first render even when the chunk was prefetched long ago, so the first
 * open of a lazy modal always flashes its fallback and mounts a frame late —
 * too late for iOS to raise the keyboard for the tap that opened it. Once the
 * module has loaded, `Component` renders it directly instead, in the same
 * commit as the tap.
 */
export function preloadableLazy<P extends object>(
  load: () => Promise<React.ComponentType<P>>
) {
  let loaded: React.ComponentType<P> | null = null;
  let pending: Promise<React.ComponentType<P>> | null = null;

  const preload = (): Promise<React.ComponentType<P>> => {
    pending ??= load().then(
      (component) => (loaded = component),
      (error: unknown) => {
        // Let the next prefetch or open try the download again.
        pending = null;
        throw error;
      }
    );
    return pending;
  };

  const Lazy = React.lazy(() => preload().then((component) => ({ default: component })));

  function Component(props: P) {
    return React.createElement(loaded ?? Lazy, props);
  }

  return { Component, preload };
}
