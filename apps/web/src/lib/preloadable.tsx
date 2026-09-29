import * as React from "react";

/**
 * A code-split component that renders synchronously once its chunk has
 * loaded. Plain `React.lazy` always suspends on its first render, and React
 * then holds the fallback for ~300 ms before showing the content, even when
 * the chunk was prefetched long ago. That hold was the lag when opening a
 * task for the first time.
 */
export function preloadable<P extends object>(
  load: () => Promise<React.ComponentType<P>>
) {
  let loaded: React.ComponentType<P> | null = null;
  let promise: Promise<React.ComponentType<P>> | null = null;

  const preload = () => {
    promise ??= load().then((component) => {
      loaded = component;
      return component;
    });
    return promise;
  };

  const Lazy = React.lazy(() => preload().then((c) => ({ default: c })));

  function Component(props: P) {
    // Chosen once per mount: switching type later would remount the
    // component and drop whatever the user had typed.
    const [Loaded] = React.useState(() => loaded);
    if (Loaded) return <Loaded {...props} />;
    const L = Lazy as unknown as React.ComponentType<P>;
    return <L {...props} />;
  }

  return { Component, preload };
}
