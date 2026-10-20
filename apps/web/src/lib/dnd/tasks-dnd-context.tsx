import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import type { Task, Idea } from "@open-sunsama/types";
import { addMinutes } from "date-fns";
import { useMoveTask, useReorderTasks, taskKeys } from "@/hooks/useTasks";
import { useCreateTimeBlock } from "@/hooks/useTimeBlocks";
import { useImportTask } from "@/hooks/useIntegrations";
import {
  DEFAULT_DROP_MINS,
  type CalendarDropData,
} from "@/components/kanban/kanban-calendar-panel";
import {
  usePromoteIdea,
  useReorderIdeas,
  useSaveTaskAsIdea,
  ideaKeys,
} from "@/hooks/useIdeas";
import { TaskCard } from "@/components/kanban/task-card";
import { taskPriorityCollision } from "./collision-detection";

interface TasksDndContextValue {
  activeTask: Task | null;
  activeOverColumn: string | null;
  isDragging: boolean;
  pointerY: React.MutableRefObject<number | null>;
}

const TasksDndContext = React.createContext<TasksDndContextValue | null>(null);

export function useTasksDnd() {
  const context = React.useContext(TasksDndContext);
  if (!context) {
    throw new Error("useTasksDnd must be used within a TasksDndProvider");
  }
  return context;
}

interface TasksDndProviderProps {
  children: React.ReactNode;
}

/**
 * Shared DnD context for tasks that enables:
 * - Dragging tasks between kanban day columns
 * - Reordering tasks within columns
 * - Dragging backlog tasks to schedule them
 * - Reordering tasks within the backlog
 */
export function TasksDndProvider({ children }: TasksDndProviderProps) {
  const queryClient = useQueryClient();
  const pointerY = React.useRef<number | null>(null);
  React.useEffect(() => {
    // Capture before the drag sensor handles release. Its delta includes
    // scrolling, and its rendered rectangle may be one frame behind.
    const trackMouse = (event: MouseEvent) => { pointerY.current = event.clientY; };
    const trackTouch = (event: TouchEvent) => {
      pointerY.current = event.touches[0]?.clientY ?? event.changedTouches[0]?.clientY ?? null;
    };
    document.addEventListener("mousemove", trackMouse, true);
    document.addEventListener("mouseup", trackMouse, true);
    document.addEventListener("touchmove", trackTouch, true);
    document.addEventListener("touchend", trackTouch, true);
    return () => {
      document.removeEventListener("mousemove", trackMouse, true);
      document.removeEventListener("mouseup", trackMouse, true);
      document.removeEventListener("touchmove", trackTouch, true);
      document.removeEventListener("touchend", trackTouch, true);
    };
  }, []);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeExternalTask, setActiveExternalTask] = React.useState<{
    accountId: string;
    externalTask: { externalId: string; title: string };
  } | null>(null);
  const [activeOverColumn, setActiveOverColumn] = React.useState<string | null>(
    null
  );

  const [activeIdea, setActiveIdea] = React.useState<Idea | null>(null);
  const promoteIdea = usePromoteIdea(activeIdea?.boardId);
  const reorderIdeas = useReorderIdeas(activeIdea?.boardId);
  const saveTaskAsIdea = useSaveTaskAsIdea();
  const moveTask = useMoveTask();
  const reorderTasks = useReorderTasks();
  const createTimeBlock = useCreateTimeBlock();
  const importTask = useImportTask();

  // Drag and drop sensors with keyboard support for accessibility
  // Mouse: distance-based so a drag starts the instant the pointer moves a
  // few px — no hold delay — while a plain click (no movement) still opens
  // the task. Touch: a short press-and-hold so vertical swipes still scroll
  // the board on mobile instead of grabbing a card.
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
    // No KeyboardSensor on purpose: cards keep DOM focus after a mouse drag,
    // and the KeyboardSensor treats Space/Enter on a focused card as "start
    // dragging" — so pressing Enter (for another action) accidentally re-grabbed
    // the card into a dragged state. Keyboard reordering is handled by the task
    // shortcuts (move to top/bottom, defer, …) instead.
  );

  // Find target column from over ID
  const findTargetColumnDate = React.useCallback(
    (overId: string | number | undefined): string | null | "backlog" => {
      if (!overId) return null;
      const overIdStr = String(overId);

      // Check if it's the backlog drop target
      if (overIdStr === "backlog") {
        return "backlog";
      }

      // Check if it's a column ID (day-YYYY-MM-DD)
      if (overIdStr.startsWith("day-")) {
        return overIdStr.replace("day-", "") || null;
      }

      // Otherwise it's a task ID - return null (handled separately)
      return null;
    },
    []
  );

  // Check if an ID is a task (not a column or backlog)
  const isTaskId = React.useCallback(
    (id: string | number | undefined): boolean => {
      if (!id) return false;
      const idStr = String(id);
      return !idStr.startsWith("day-") && idStr !== "backlog";
    },
    []
  );

  // DnD Event Handlers
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveIdea(active.data.current?.idea ?? null);
    setActiveExternalTask(active.data.current?.externalTask
      ? { accountId: active.data.current.accountId, externalTask: active.data.current.externalTask }
      : null);
    const task = active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
      setActiveOverColumn(task.scheduledDate || null);
    }
  }, []);

  const handleDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setActiveOverColumn(null);
        return;
      }

      // First try to get column from the over ID (for column droppables)
      let targetDate = findTargetColumnDate(over.id);

      // If over a task, get the column from the task's data
      if (!targetDate && over.data.current?.columnId) {
        const columnId = String(over.data.current.columnId);
        targetDate = columnId === "backlog" ? "backlog" : columnId;
      }

      setActiveOverColumn(targetDate === "backlog" ? null : targetDate);
    },
    [findTargetColumnDate]
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const dropTarget = over?.data.current as CalendarDropData | undefined;
      const calendarStart = dropTarget?.type === "calendar" && pointerY.current !== null
        ? dropTarget.timeAt(pointerY.current)
        : null;

        setActiveTask(null);
        setActiveIdea(null);
        setActiveExternalTask(null);
        setActiveOverColumn(null);

        if (!over) return;

        const external = active.data.current?.externalTask as { externalId: string; title: string } | undefined;
        const accountId = active.data.current?.accountId as string | undefined;
        if (external && accountId) {
          const target = over.data.current;
          const calendar = target as CalendarDropData | undefined;
          const date = calendar?.type === "calendar"
            ? calendar.date
            : (findTargetColumnDate(over.id) ?? target?.columnId);
          void importTask.mutateAsync({ accountId, externalId: external.externalId })
            .then(({ task }) => {
              if (date && date !== "backlog") {
                moveTask.mutate({ id: task.id, targetDate: String(date) });
              }
            })
            .catch(() => {});
          return;
        }

      const taskId = String(active.id);
      const task = active.data.current?.task as Task | undefined;

      const idea =
        (active.data.current?.idea as Idea | undefined) ?? activeIdea;
      if (idea) {
        const target = over.data.current;
        const targetIdea = target?.idea as Idea | undefined;
        if (target?.type === "idea-tray" || targetIdea) {
          const columnId = targetIdea?.columnId ?? target?.columnId;
          const list = queryClient.getQueryData<Idea[]>(
            ideaKeys.byBoard(idea.boardId)
          );
          const ordered = (list ?? [])
            .filter((i) => i.columnId === columnId && i.id !== idea.id)
            .sort((a, b) => a.position - b.position);
          const index = targetIdea
            ? ordered.findIndex((i) => i.id === targetIdea.id)
            : ordered.length;
          ordered.splice(index < 0 ? ordered.length : index, 0, idea);
          reorderIdeas.mutate({ columnId, ideaIds: ordered.map((i) => i.id) });
          return;
        }
        const calendar = target as CalendarDropData | undefined;
        const date =
          calendar?.type === "calendar"
            ? calendar.date
            : (findTargetColumnDate(over.id) ?? target?.columnId);
        if (!date) return;
        const scheduledDate = date === "backlog" ? null : String(date);
        void promoteIdea
          .mutateAsync({ id: idea.id, input: { scheduledDate } })
          .then(async (result) => {
            if (result.task.scheduledDate !== scheduledDate)
              await moveTask.mutateAsync({
                id: result.task.id,
                targetDate: scheduledDate,
              });
            if (calendar?.type === "calendar") {
              if (calendarStart) {
                const startTime = calendarStart;
                createTimeBlock.mutate({
                  taskId: result.task.id,
                  title: result.task.title,
                  startTime,
                  endTime: addMinutes(
                    startTime,
                    result.task.estimatedMins ?? DEFAULT_DROP_MINS
                  ),
                });
              }
            }
          })
          .catch(() => {});
        return;
      }
      if (!task) return;
      const target = over.data.current;
      if (target?.type === "idea-tray" || target?.type === "idea") {
        saveTaskAsIdea.mutate({
          taskId: task.id,
          boardId: target.idea?.boardId ?? target.boardId,
          columnId: target.idea?.columnId ?? target.columnId,
        });
        return;
      }

      const overId = String(over.id);

      // Dropped on the board's calendar: block the task at that time, on
      // that day.
      const calendar = over.data.current as CalendarDropData | undefined;
      if (calendar?.type === "calendar") {
        if (!calendarStart) return;
        const startTime = calendarStart;
        if (task.scheduledDate !== calendar.date) {
          moveTask.mutate({ id: task.id, targetDate: calendar.date });
        }
        createTimeBlock.mutate({
          taskId: task.id,
          title: task.title,
          startTime,
          endTime: addMinutes(
            startTime,
            task.estimatedMins ?? DEFAULT_DROP_MINS
          ),
        });
        return;
      }

      // Read a column's tasks from the cache regardless of which `limit` /
      // filter the query was made with. Day columns cache under
      // { scheduledDate, limit: 200 } and the backlog under
      // { backlog: true, limit: 500 }, so a bare { scheduledDate } /
      // { backlog } lookup missed — which silently broke reordering within a
      // column (the dropped task's order never updated).
      const getColumnTasks = (column: string): Task[] => {
        const isBacklogCol = column === "backlog";
        const entries = queryClient.getQueriesData<Task[]>({
          queryKey: taskKeys.lists(),
        });
        const byId = new Map<string, Task>();
        for (const [key, data] of entries) {
          if (!data) continue;
          const filters = (key as unknown[])[2] as
            { scheduledDate?: string | null; backlog?: boolean } | undefined;
          if (!filters) continue;
          const match = isBacklogCol
            ? filters.backlog === true
            : filters.scheduledDate === column;
          if (!match) continue;
          for (const t of data) if (!byId.has(t.id)) byId.set(t.id, t);
        }
        return [...byId.values()];
      };

      // Get source column from drag data
      // The columnId must be set in useSortable data for both task cards and backlog tasks
      const sourceColumn = String(
        active.data.current?.columnId || task.scheduledDate || "backlog"
      );

      // Determine destination column
      let destinationColumn: string;
      let overTask: Task | undefined;

      // Check if dropped on a task or a column
      if (isTaskId(over.id)) {
        // Dropped on another task
        overTask = over.data.current?.task as Task | undefined;
        destinationColumn = String(
          over.data.current?.columnId ?? overTask?.scheduledDate ?? "backlog"
        );
      } else {
        // Dropped on a column or backlog - extract from ID
        const targetDate = findTargetColumnDate(over.id);
        if (!targetDate) return;
        destinationColumn =
          targetDate === "backlog" ? "backlog" : String(targetDate);
      }

      // Check if columns changed
      const columnChanged = sourceColumn !== destinationColumn;
      const isSameTask = taskId === overId;

      // OPTIMIZATION: Do nothing if dropped on self in the same column
      if (isSameTask && !columnChanged) {
        return;
      }

      // When columns change, we need to move the task to the new column
      if (columnChanged) {
        const targetDate =
          destinationColumn === "backlog" ? "backlog" : destinationColumn;

        // Get the destination column's tasks (cache-key-agnostic)
        const destTasks = getColumnTasks(destinationColumn);

        // Build the new task order for the destination column
        // Filter to only pending tasks (not completed) and exclude the moving task
        const pendingDestTasks = (destTasks ?? [])
          .filter((t) => !t.completedAt && t.id !== taskId)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        let newTaskIds: string[];

        if (overTask && overTask.id !== taskId) {
          // Dropped on a specific task - insert at that position
          const overIndex = pendingDestTasks.findIndex(
            (t) => t.id === overTask.id
          );

          if (overIndex !== -1) {
            // Insert before the target task
            newTaskIds = [
              ...pendingDestTasks.slice(0, overIndex).map((t) => t.id),
              taskId,
              ...pendingDestTasks.slice(overIndex).map((t) => t.id),
            ];
          } else {
            // Target task not found in pending tasks, append to end
            newTaskIds = [...pendingDestTasks.map((t) => t.id), taskId];
          }
        } else {
          // Dropped on column background - append to end
          newTaskIds = [...pendingDestTasks.map((t) => t.id), taskId];
        }

        // Use reorderTasks which handles both moving and positioning
        reorderTasks.mutate({
          date: targetDate,
          taskIds: newTaskIds,
        });

        return;
      }

      // Same column but different position - reorder within column
      if (!columnChanged && overTask && !isSameTask) {
        // Get all tasks in this column from the cache (cache-key-agnostic)
        const isBacklog = sourceColumn === "backlog";
        const columnTasks = getColumnTasks(sourceColumn);

        if (columnTasks.length) {
          // Sort by position to get current order
          const sortedTasks = [...columnTasks].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0)
          );

          // Find indices of active and over tasks
          const activeIndex = sortedTasks.findIndex((t) => t.id === taskId);
          const overIndex = sortedTasks.findIndex((t) => t.id === overId);

          if (
            activeIndex !== -1 &&
            overIndex !== -1 &&
            activeIndex !== overIndex
          ) {
            // Reorder using arrayMove
            const reorderedTasks = arrayMove(
              sortedTasks,
              activeIndex,
              overIndex
            );
            const reorderedIds = reorderedTasks.map((t) => t.id);

            // Call reorder API
            const dateParam = isBacklog ? "backlog" : sourceColumn;
            reorderTasks.mutate({
              date: dateParam,
              taskIds: reorderedIds,
            });
          }
        }
      }
    },
    [
      findTargetColumnDate,
        moveTask,
        importTask,
      reorderTasks,
      createTimeBlock,
      activeIdea,
      promoteIdea,
      reorderIdeas,
      saveTaskAsIdea,
      isTaskId,
      queryClient,
    ]
  );

    const handleDragCancel = React.useCallback(() => {
      setActiveIdea(null);
      setActiveTask(null);
      setActiveExternalTask(null);
    setActiveOverColumn(null);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      activeTask,
      activeOverColumn,
      pointerY,
        isDragging: !!activeTask || !!activeIdea || !!activeExternalTask,
    }),
      [activeTask, activeIdea, activeExternalTask, activeOverColumn]
  );

  return (
    <TasksDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={taskPriorityCollision}
        // Disable horizontal auto-scroll (threshold x:0) so reordering within a
        // column never yanks the board sideways — the default ~20% edge zone is
        // wide enough to cover the leftmost (Today) column. Keep vertical
        // auto-scroll for dragging to the bottom of a long column.
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* Drag Overlay - follows cursor with fixed width matching column */}
        <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null}>
          {activeIdea && (
            <div className="pointer-events-none w-[264px] rounded-lg bg-card p-3 text-sm shadow-lg">
              {activeIdea.title}
            </div>
          )}
            {activeTask && (
            <div className="w-[264px] pointer-events-none">
              <TaskCard task={activeTask} onSelect={() => {}} isDragging />
            </div>
            )}
            {activeExternalTask && (
              <div className="w-[220px] rounded-md border bg-card p-2 text-sm shadow-lg">
                {activeExternalTask.externalTask.title}
              </div>
            )}
        </DragOverlay>
      </DndContext>
    </TasksDndContext.Provider>
  );
}
