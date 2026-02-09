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
 * Main board view content.
 * Shows tasks organized by day and a compact calendar panel.
 */
export function BoardPageContent() {
  const isMobile = useIsMobile();
  const [activeDate, setActiveDate] = React.useState<Date | null>(null);

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = React.useState(false);

  const [selectedTimeBlock, setSelectedTimeBlock] = React.useState<TimeBlock | null>(
    null
  );
  const [timeBlockSheetOpen, setTimeBlockSheetOpen] = React.useState(false);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [createDialogDate, setCreateDialogDate] = React.useState<Date>(new Date());
  const [createDialogStartTime, setCreateDialogStartTime] = React.useState<Date>(
    new Date()
  );
  const [createDialogEndTime, setCreateDialogEndTime] = React.useState<Date>(
    new Date()
  );

  const { data: fetchedTask } = useTask(selectedTaskId ?? "");

  React.useEffect(() => {
    if (fetchedTask && selectedTaskId) {
      setSelectedTask(fetchedTask);
      setTaskPanelOpen(true);
      setSelectedTaskId(null);
    }
  }, [fetchedTask, selectedTaskId]);

  if (isMobile) {
    return <MobileTaskListView />;
  }

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleBlockClick = (block: TimeBlock) => {
    if (block.taskId) {
      setSelectedTaskId(block.taskId);
      return;
    }
    setSelectedTimeBlock(block);
    setTimeBlockSheetOpen(true);
  };

  const handleEditBlock = (block: TimeBlock) => {
    setSelectedTimeBlock(block);
    setTimeBlockSheetOpen(true);
  };

  return (
    <TasksDndProvider>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]">
        <Sidebar className="hidden lg:flex" />
        <MobileBacklogSheet />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <KanbanBoard onFirstVisibleDateChange={setActiveDate}>
              <TasksKeyboardShortcuts />
            </KanbanBoard>
          </div>

          {activeDate && (
            <KanbanCalendarPanel
              date={activeDate}
              className="hidden w-[280px] flex-shrink-0 xl:flex"
              onBlockClick={handleBlockClick}
              onEditBlock={handleEditBlock}
              onTimeSlotClick={(date, startTime, endTime) => {
                setCreateDialogDate(date);
                setCreateDialogStartTime(startTime);
                setCreateDialogEndTime(endTime);
                setCreateDialogOpen(true);
              }}
              onViewTask={handleViewTask}
            />
          )}
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        open={taskPanelOpen}
        onOpenChange={(open) => {
          setTaskPanelOpen(open);
          if (!open) setSelectedTask(null);
        }}
      />

      <TimeBlockDetailSheet
        timeBlock={selectedTimeBlock}
        open={timeBlockSheetOpen}
        onOpenChange={(open) => {
          setTimeBlockSheetOpen(open);
          if (!open) setSelectedTimeBlock(null);
        }}
      />

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
