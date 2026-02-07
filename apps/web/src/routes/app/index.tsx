import * as React from "react";
import type { Task, TimeBlock } from "@open-sunsama/types";
import { KanbanBoard, useKanbanNavigation } from "@/components/kanban";
import { KanbanCalendarPanel } from "@/components/kanban/kanban-calendar-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBacklogSheet } from "@/components/layout/mobile-backlog-sheet";
import { MobileTaskListView } from "@/components/mobile";
import { TasksDndProvider } from "@/lib/dnd/tasks-dnd-context";
import { TaskShortcutsHandler } from "@/components/task-shortcuts-handler";
import { TaskModal } from "@/components/kanban/task-modal";
import { TimeBlockDetailSheet } from "@/components/calendar/time-block-detail-sheet";
import { CreateTimeBlockDialog } from "@/components/calendar/create-time-block-dialog";
import { useTask, useIsMobile } from "@/hooks";

/**
 * Main tasks/kanban view
 * Shows tasks organized by day in an infinite horizontal scrolling view
 * Right side shows a compact calendar for the active (leftmost) day
 */
export default function TasksPage() {
  const isMobile = useIsMobile();
  const [activeDate, setActiveDate] = React.useState<Date | null>(null);

  // Task detail panel state
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = React.useState(false);
  
  // Time block detail sheet state
  const [selectedTimeBlock, setSelectedTimeBlock] = React.useState<TimeBlock | null>(null);
  const [timeBlockSheetOpen, setTimeBlockSheetOpen] = React.useState(false);
  
  // Create time block dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createDialogDate, setCreateDialogDate] = React.useState<Date>(new Date());
  const [createDialogStartTime, setCreateDialogStartTime] = React.useState<Date>(new Date());
  const [createDialogEndTime, setCreateDialogEndTime] = React.useState<Date>(new Date());

  // Fetch task by ID when viewing from context menu
  const { data: fetchedTask } = useTask(selectedTaskId ?? "");

  // Update selectedTask when fetchedTask changes
  React.useEffect(() => {
    if (fetchedTask && selectedTaskId) {
      setSelectedTask(fetchedTask);
      setTaskPanelOpen(true);
      setSelectedTaskId(null); // Clear the ID after fetching
    }
  }, [fetchedTask, selectedTaskId]);

  // Render mobile task list view on mobile devices
  if (isMobile) {
    return <MobileTaskListView />;
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskPanelOpen(true);
  };

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleBlockClick = (block: TimeBlock) => {
    if (block.taskId) {
      // Open task modal directly for linked blocks
      setSelectedTaskId(block.taskId);
    } else {
      // Standalone block — edit time block details
      setSelectedTimeBlock(block);
      setTimeBlockSheetOpen(true);
    }
  };

  const handleEditBlock = (block: TimeBlock) => {
    setSelectedTimeBlock(block);
    setTimeBlockSheetOpen(true);
  };

  const handleTaskPanelOpenChange = (open: boolean) => {
    setTaskPanelOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  const handleTimeBlockSheetOpenChange = (open: boolean) => {
    setTimeBlockSheetOpen(open);
    if (!open) {
      setSelectedTimeBlock(null);
    }
  };

  const handleTimeSlotClick = (date: Date, startTime: Date, endTime: Date) => {
    setCreateDialogDate(date);
    setCreateDialogStartTime(startTime);
    setCreateDialogEndTime(endTime);
    setCreateDialogOpen(true);
  };

  return (
    <TasksDndProvider>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]">
        {/* Sidebar - Backlog (Desktop only) */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile Backlog Sheet - FAB trigger (Mobile only) */}
        <MobileBacklogSheet />

        {/* Main Content - Kanban Board */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <KanbanBoard onFirstVisibleDateChange={setActiveDate}>
              {/* Keyboard shortcuts handler rendered inside KanbanBoard 
                  to access the navigation context */}
              <TasksKeyboardShortcuts />
            </KanbanBoard>
          </div>

          {/* Calendar Panel - Desktop only */}
          {activeDate && (
            <KanbanCalendarPanel
              date={activeDate}
              className="hidden xl:flex w-[280px] flex-shrink-0"
              onBlockClick={handleBlockClick}
              onEditBlock={handleEditBlock}
              onTimeSlotClick={handleTimeSlotClick}
              onViewTask={handleViewTask}
            />
          )}
        </div>
      </div>

      {/* Task Modal - reused from kanban */}
      <TaskModal
        task={selectedTask}
        open={taskPanelOpen}
        onOpenChange={handleTaskPanelOpenChange}
      />

      {/* Time Block Detail Sheet */}
      <TimeBlockDetailSheet
        timeBlock={selectedTimeBlock}
        open={timeBlockSheetOpen}
        onOpenChange={handleTimeBlockSheetOpenChange}
      />

      {/* Create Time Block Dialog */}
      <CreateTimeBlockDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        date={createDialogDate}
        startTime={createDialogStartTime}
        endTime={createDialogEndTime}
      />
    </TasksDndProvider>
  );
}

/**
 * Component that bridges the kanban navigation context to the keyboard shortcuts handler.
 * Must be rendered inside KanbanBoard to access the navigation context.
 */
function TasksKeyboardShortcuts() {
  const navigation = useKanbanNavigation();

  return (
    <TaskShortcutsHandler
      onNavigateToday={navigation.navigateToToday}
      onNavigateNext={navigation.navigateNext}
      onNavigatePrevious={navigation.navigatePrevious}
      onSelect={navigation.selectTask}
    />
  );
}
