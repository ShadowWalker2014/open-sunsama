import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "@/components/calendar";

/**
 * Calendar page with time blocking functionality
 * Displays a day view with unscheduled tasks panel and timeline
 */
function CalendarPage() {
  const handleTaskClick = (task: { id: string; title: string }) => {
    // TODO: Open task detail dialog/sheet
    console.log("Task clicked:", task);
  };

  const handleBlockClick = (block: { id: string; title: string }) => {
    // TODO: Open time block detail dialog/sheet
    console.log("Block clicked:", block);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <CalendarView
        onTaskClick={handleTaskClick}
        onBlockClick={handleBlockClick}
      />
    </div>
  );
}

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});
