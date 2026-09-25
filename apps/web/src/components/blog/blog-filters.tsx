import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOG_TOPICS, findTopic } from "@/lib/blog-topics";

interface BlogTopicTabsProps {
  /** Current `?tag=` value: a topic id, a raw tag, or undefined for All */
  selectedTag?: string;
  onSelect: (topicId: string | undefined) => void;
}

/**
 * The topic switcher under the hero, styled like the home page's product-view
 * switcher. Scrolls sideways inside itself on phones.
 */
export function BlogTopicTabs({ selectedTag, onSelect }: BlogTopicTabsProps) {
  const active = findTopic(selectedTag)?.id ?? (selectedTag ? null : "all");
  const tabs = [{ id: "all", label: "All" }, ...BLOG_TOPICS];

  return (
    <nav aria-label="Blog topics" className="container mx-auto max-w-6xl px-4">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="mx-auto flex w-max items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.03]">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onSelect(tab.id === "all" ? undefined : tab.id)
                  }
                  className={cn(
                    "whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border/60 dark:bg-white/10 dark:ring-white/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

interface BlogResultsBarProps {
  /** Overrides the heading ("All articles" or the topic name) */
  title?: string;
  totalResults: number;
  selectedTag?: string;
  searchQuery?: string;
  onClearTag: () => void;
  onClearSearch: () => void;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background py-0.5 pl-2.5 pr-1 text-[12.5px] text-foreground dark:border-white/10">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/** "12 articles" plus a removable chip for an exact tag or a search query. */
export function BlogResultsBar({
  title,
  totalResults,
  selectedTag,
  searchQuery,
  onClearTag,
  onClearSearch,
}: BlogResultsBarProps) {
  const topic = findTopic(selectedTag);
  const heading =
    title ??
    topic?.label ??
    (selectedTag
      ? `Tagged “${selectedTag}”`
      : searchQuery
        ? "Search results"
        : "All articles");

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.025em] md:text-[26px]">
          {heading}
        </h2>
        <p
          className="mt-1 text-[13.5px] text-muted-foreground"
          aria-live="polite"
        >
          {totalResults} {totalResults === 1 ? "article" : "articles"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedTag && !topic && (
          <Chip label={`Tag: ${selectedTag}`} onRemove={onClearTag} />
        )}
        {searchQuery && (
          <Chip label={`“${searchQuery}”`} onRemove={onClearSearch} />
        )}
      </div>
    </div>
  );
}
