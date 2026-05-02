import * as React from "react";
import { cn } from "@/lib/utils";
import type * as RichTextEditorModuleNS from "./rich-text-editor";

/**
 * Lazy entry-point for the Tiptap-backed `RichTextEditor`.
 *
 * Tiptap + ProseMirror weighs ~390 kB pre-gzip. Eagerly importing it via
 * `apps/web/src/routes/app.tsx → AddTaskModal → RichTextEditor` was pulling
 * the whole editor into the /app boot bundle even when the user never opens
 * the Add Task modal. This wrapper defers the actual editor module to a
 * dynamic import, gives consumers a cheap textarea-shaped fallback so the
 * page can render instantly, and exposes a `prefetchRichTextEditor()` helper
 * that callers (e.g. `App` once the user is authenticated) can call from an
 * idle callback to warm the chunk before the user reaches for the editor.
 */

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  enableFileUpload?: boolean;
  autoFocus?: boolean;
};

type RichTextEditorModule = typeof RichTextEditorModuleNS;

let preloadPromise: Promise<RichTextEditorModule> | null = null;

function importEditorModule(): Promise<RichTextEditorModule> {
  if (!preloadPromise) {
    preloadPromise = import("./rich-text-editor") as Promise<RichTextEditorModule>;
  }
  return preloadPromise;
}

const LazyEditor = React.lazy(async () => {
  const mod = await importEditorModule();
  return { default: mod.RichTextEditor };
});

/**
 * Hint the browser to start fetching the rich text editor chunk.
 * Safe to call multiple times — caches the import promise.
 *
 * Typical usage:
 *   React.useEffect(() => {
 *     const idle = (window as any).requestIdleCallback ?? setTimeout;
 *     idle(() => prefetchRichTextEditor());
 *   }, []);
 */
export function prefetchRichTextEditor(): Promise<unknown> {
  return importEditorModule();
}

/**
 * Static fallback that occupies the same vertical real estate as the real
 * editor while it streams in. Showing the user's existing content as plain
 * text avoids a content-shift flicker when Tiptap mounts.
 */
function EditorFallback({
  value,
  placeholder,
  className,
  minHeight = "100px",
}: Pick<
  RichTextEditorProps,
  "value" | "placeholder" | "className" | "minHeight"
>) {
  // Strip basic HTML tags so the placeholder reads as plaintext while
  // Tiptap is still loading.
  const plain = value
    ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-transparent px-3 py-2 text-sm",
        "text-muted-foreground/80 whitespace-pre-wrap break-words",
        className
      )}
      style={{ minHeight }}
      aria-busy="true"
    >
      {plain || placeholder || ""}
    </div>
  );
}

export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <React.Suspense
      fallback={
        <EditorFallback
          value={props.value}
          placeholder={props.placeholder}
          className={props.className}
          minHeight={props.minHeight}
        />
      }
    >
      <LazyEditor {...props} />
    </React.Suspense>
  );
}
