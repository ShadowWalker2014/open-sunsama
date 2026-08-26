import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Label next to the icon while collapsed; omit for an icon-only button. */
  label?: string;
  className?: string;
}

/**
 * An icon button that expands into a filter input — used by the board views to
 * narrow cards down to a substring match. Collapses again on Escape, or on
 * blur while empty, so it takes no toolbar room when unused.
 */
export function ViewSearch({
  value,
  onChange,
  placeholder = "Search…",
  label,
  className,
}: ViewSearchProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const close = () => {
    setOpen(false);
    onChange("");
  };

  if (!open && !value) {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search"
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          className
        )}
      >
        <Search className="h-4 w-4" />
        {label && <span className="hidden sm:inline">{label}</span>}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          // Don't let single-key page shortcuts (e.g. "A" opens Add task) fire
          // while typing a query.
          e.stopPropagation();
        }}
        onBlur={() => {
          if (!value) setOpen(false);
        }}
        placeholder={placeholder}
        className="w-36 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:w-48"
      />
      {value && (
        <button
          type="button"
          onClick={close}
          aria-label="Clear search"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
