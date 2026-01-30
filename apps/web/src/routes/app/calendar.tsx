import * as React from "react";
import type { Task, TimeBlock } from "@open-sunsama/types";
import { CalendarView } from "@/components/calendar";
import { TaskModal } from "@/components/kanban/task-modal";
import { TimeBlockDetailSheet } from "@/components/calendar/time-block-detail-sheet";
import { CreateTimeBlockDialog } from "@/components/calendar/create-time-block-dialog";
import { useTask } from "@/hooks";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileCalendarView } from "@/components/mobile";

/**
 * Calendar page with time blocking functionality
 * Displays a day view with unscheduled tasks panel and timeline
 */
export default function CalendarPage() {
  const isMobile = useIsMobile();
  
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskPanelOpen(true);
  };

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleBlockClick = (block: TimeBlock) => {
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

  if (isMobile) {
    return <MobileCalendarView />;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <CalendarView
        onTaskClick={handleTaskClick}
        onBlockClick={handleBlockClick}
        onViewTask={handleViewTask}
        onTimeSlotClick={handleTimeSlotClick}
      />

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
    </div>
  );
}
