import type { CalendarCreateAnchor } from "@/hooks/useDragToCreate";
import * as React from "react";
import type { Task, TimeBlock } from "@open-sunsama/types";
import { KanbanBoard, useKanbanNavigation } from "@/components/kanban";
import { useBoardMode } from "@/components/kanban/kanban-board";
import { KanbanCalendarPanel } from "@/components/kanban/kanban-calendar-panel";
import { BacklogPanel } from "@/components/layout/backlog-panel";
import { RightPanel } from "./right-panel";
import { MobileBacklogSheet } from "@/components/layout/mobile-backlog-sheet";
import { MobileTasksView } from "@/components/mobile";
import { TasksDndProvider } from "@/lib/dnd/tasks-dnd-context";
import { TaskShortcutsHandler } from "@/components/task-shortcuts-handler";
import { TaskModal } from "@/components/kanban/task-modal.lazy";
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
  const [mode, setMode] = useBoardMode();

  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = React.useState(false);

  const [selectedTimeBlock, setSelectedTimeBlock] = React.useState<TimeBlock | null>(
    null
  );
  const [timeBlockSheetOpen, setTimeBlockSheetOpen] = React.useState(false);

  const [createAnchor, setCreateAnchor] = React.useState<CalendarCreateAnchor>();
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
    return <MobileTasksView />;
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

  const calendarPanel = activeDate && (
    <KanbanCalendarPanel
      date={activeDate}
      className="w-full border-l-0"
      onBlockClick={handleBlockClick}
      onEditBlock={handleEditBlock}
      onTimeSlotClick={(date, startTime, endTime, anchor) => {
        setCreateAnchor(anchor);
        setCreateDialogDate(date);
        setCreateDialogStartTime(startTime);
        setCreateDialogEndTime(endTime);
        setCreateDialogOpen(true);
      }}
      onViewTask={handleViewTask}
    />
  );

  return (
    <TasksDndProvider>
      <div className="flex h-full min-h-0">
        <MobileBacklogSheet />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <KanbanBoard
              onFirstVisibleDateChange={setActiveDate}
              mode={mode}
              onModeChange={setMode}
              // Today puts the calendar beside the day, in the middle.
              dayAside={mode === "day" ? <RightPanel calendar={calendarPanel} backlog={<BacklogPanel />} /> : undefined}
            >
              <TasksKeyboardShortcuts />
            </KanbanBoard>
          </div>

          {mode !== "day" && <div className="hidden lg:flex">
            <RightPanel
              calendar={calendarPanel}
              backlog={<BacklogPanel />}
            />
          </div>}
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
        anchor={createAnchor}
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
