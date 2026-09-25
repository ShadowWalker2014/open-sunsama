import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | "ellipsis")[];
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls for the blog listing page
 */
export function BlogPagination({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-14 flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-full px-3"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              className="h-9 w-9 rounded-full p-0 tabular-nums"
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-full px-3"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
