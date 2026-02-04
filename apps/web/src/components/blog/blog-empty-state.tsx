import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/**
 * Empty state displayed when no blog posts match the current filters
 */
export function BlogEmptyState({
  hasActiveFilters,
  onClearFilters,
}: BlogEmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mx-auto mb-4">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-[15px] font-semibold mb-1">No posts found</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {hasActiveFilters
          ? "Try adjusting your search or filter criteria."
          : "Check back soon for new content."}
      </p>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
