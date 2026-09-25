import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/** Shown when no post matches the topic, tag or search. */
export function BlogEmptyState({
  hasActiveFilters,
  onClearFilters,
}: BlogEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center dark:border-white/10">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <SearchX className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-[17px] font-semibold tracking-tight">
        No articles match
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted-foreground">
        {hasActiveFilters
          ? "Try a shorter search, or pick another topic."
          : "New articles land here every week."}
      </p>
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5 rounded-full px-4"
          onClick={onClearFilters}
        >
          Show all articles
        </Button>
      )}
    </div>
  );
}
