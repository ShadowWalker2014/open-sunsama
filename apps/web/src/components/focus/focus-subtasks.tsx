import { SubtaskChecklist } from "@/components/kanban/subtask-checklist";

interface FocusSubtasksProps {
  taskId: string;
}

/** Subtasks section for focus mode — the same checklist the task modal uses. */
export function FocusSubtasks({ taskId }: FocusSubtasksProps) {
  return <SubtaskChecklist key={taskId} taskId={taskId} />;
}
