// Hooks Index
// Re-export all custom hooks

export { useToast, toast } from "./use-toast";
export { useAuth, AuthProvider, useRequireAuth } from "./useAuth";
export {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
  useMoveTask,
  useReorderTasks,
  taskKeys,
} from "./useTasks";
export {
  useTimeBlocks,
  useTimeBlock,
  useTimeBlocksForDate,
  useTimeBlocksForDateRange,
  useCreateTimeBlock,
  useUpdateTimeBlock,
  useDeleteTimeBlock,
  useQuickSchedule,
  useStartTimeBlock,
  useStopTimeBlock,
  useResizeTimeBlock,
  useMoveTimeBlock,
  timeBlockKeys,
} from "./useTimeBlocks";
export {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  apiKeyKeys,
  type ApiKey,
  type CreateApiKeyInput,
  type CreateApiKeyResponse,
} from "./useApiKeys";
export {
  useCalendarDnd,
  calculateTimeFromY,
  calculateYFromTime,
  snapToInterval,
  calculateTaskDropPreview,
  calculateMovePreview,
  calculateResizePreview,
  formatTimeRange,
  HOUR_HEIGHT,
  SNAP_INTERVAL,
  MIN_BLOCK_DURATION,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  type DragType,
  type DragState,
  type DropPreview,
} from "./useCalendarDnd";
export type { CalendarDndOptions } from "./calendar-dnd-types";
export {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  notificationPreferencesKeys,
  type NotificationPreferences,
  type UpdateNotificationPreferencesInput,
} from "./useNotificationPreferences";
export {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
  subtaskKeys,
  type Subtask,
  type CreateSubtaskInput,
  type UpdateSubtaskInput,
} from "./useSubtasks";
export {
  useUploadAvatar,
  validateAvatarFile,
  type UploadAvatarResponse,
} from "./useUploadAvatar";
export {
  useUploadAttachment,
  useUploadMultipleAttachments,
  validateFile,
  isFileSupported,
  formatFileSize,
  getFileIcon,
  getFileType,
  type UploadResult,
  type FileType,
} from "./useUploadAttachment";
export {
  useTaskAttachments,
  isImageFile,
  isVideoFile,
  attachmentKeys,
} from "./useTaskAttachments";
