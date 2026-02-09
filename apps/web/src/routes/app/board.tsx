import { BoardPageContent } from "@/components/app/board-page-content";

/**
 * Explicit board route.
 * Keeps direct board access even when /app uses a different home tab.
 */
export default function BoardPage() {
  return <BoardPageContent />;
}
