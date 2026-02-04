import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BlogSearchProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
}

/**
 * Search input component for the blog listing page
 */
export function BlogSearch({ searchInput, onSearchChange }: BlogSearchProps) {
  return (
    <section className="pb-6">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

interface BlogTagFiltersProps {
  tags: string[];
  selectedTag?: string;
  onTagClick: (tag: string) => void;
}

/**
 * Tag filter buttons for the blog listing page
 */
export function BlogTagFilters({
  tags,
  selectedTag,
  onTagClick,
}: BlogTagFiltersProps) {
  if (tags.length === 0) return null;

  return (
    <section className="pb-8">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors",
                selectedTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/40 bg-card/50 text-muted-foreground hover:bg-card hover:border-border/60"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

interface BlogActiveFiltersProps {
  totalResults: number;
  selectedTag?: string;
  searchQuery?: string;
  onClearFilters: () => void;
}

/**
 * Active filters indicator showing current filter state
 */
export function BlogActiveFilters({
  totalResults,
  selectedTag,
  searchQuery,
  onClearFilters,
}: BlogActiveFiltersProps) {
  const hasActiveFilters = selectedTag || searchQuery;

  if (!hasActiveFilters) return null;

  return (
    <section className="pb-4">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {totalResults} {totalResults === 1 ? "result" : "results"}
            {selectedTag && (
              <>
                {" "}
                for tag{" "}
                <strong className="text-foreground">"{selectedTag}"</strong>
              </>
            )}
            {searchQuery && (
              <>
                {" "}
                matching{" "}
                <strong className="text-foreground">"{searchQuery}"</strong>
              </>
            )}
          </span>
          <button
            onClick={onClearFilters}
            className="text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}
