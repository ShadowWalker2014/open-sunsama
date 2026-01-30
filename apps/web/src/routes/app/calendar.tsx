import * as React from "react";
import type { Task, TimeBlock } from "@open-sunsama/types";
import { CalendarView } from "@/components/calendar";
import { TaskModal } from "@/components/kanban/task-modal";
import { TimeBlockDetailSheet } from "@/components/calendar/time-block-detail-sheet";
import { CreateTimeBlockDialog } from "@/components/calendar/create-time-block-dialog";
import { useTask } from "@/hooks";

/**
 * Calendar page with time blocking functionality
 * Displays a day view with unscheduled tasks panel and timeline
 */
export default function CalendarPage() {
  // Task detail panel state
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

  // Fetch the selected task data
  const { data: selectedTask } = useTask(selectedTaskId ?? "");

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setTaskPanelOpen(true);
  };

  const handleBlockClick = (block: TimeBlock) => {
    setSelectedTimeBlock(block);
    setTimeBlockSheetOpen(true);
  };

  const handleTaskPanelOpenChange = (open: boolean) => {
    setTaskPanelOpen(open);
    if (!open) {
      setSelectedTaskId(null);
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
    <div className="h-[calc(100vh-3.5rem)]">
      <CalendarView
        onTaskClick={handleTaskClick}
        onBlockClick={handleBlockClick}
        onTimeSlotClick={handleTimeSlotClick}
      />

      {/* Task Modal - reused from kanban */}
      <TaskModal
        task={selectedTask ?? null}
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
