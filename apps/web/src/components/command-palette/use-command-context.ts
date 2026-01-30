/**
 * Hook that provides the command context with all actions and state
 * Extracted from command-palette.tsx for maintainability
 */
import * as React from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";
import { useShortcutsModal, useHoveredTask } from "@/hooks/useKeyboardShortcuts";
import { useCreateTask, useCompleteTask, useDeleteTask, useMoveTask } from "@/hooks/useTasks";
import { useQuickSchedule } from "@/hooks";
import { toast } from "@/hooks/use-toast";
import { generateMcpConfig, getMcpApiKey, getMcpClientDisplayName } from "@/lib/mcp-config";
import { getCurrentView } from "@/lib/route-utils";
import type { CommandContext } from "./commands";

interface UseCommandContextOptions {
  onAddTask: () => void;
  closeSearch: () => void;
}

export function useCommandContext({ onAddTask, closeSearch }: UseCommandContextOptions): CommandContext {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeMode, setThemeMode } = useTheme();
  const { setShowShortcutsModal } = useShortcutsModal();
  const { hoveredTask } = useHoveredTask();
  
  const currentView = getCurrentView(location.pathname);
  
  // Task mutations
  const createTask = useCreateTask();
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();
  const moveTask = useMoveTask();
  const quickSchedule = useQuickSchedule();

  return React.useMemo((): CommandContext => ({
    // Navigation
    navigate,
    setThemeMode,
    currentThemeMode: themeMode,
    openAddTask: onAddTask,
    openShortcuts: () => setShowShortcutsModal(true),
    closeSearch,
    
    // Context awareness
    hoveredTask,
    currentView,
    
    // Task actions
    completeTask: (id) => {
      completeTaskMutation.mutate({ id, completed: true });
      toast({ title: "Task completed" });
    },
    deleteTask: (id) => {
      deleteTaskMutation.mutate(id);
      toast({ title: "Task deleted" });
    },
    duplicateTask: (task) => {
      createTask.mutate({
        title: task.title,
        priority: task.priority,
        scheduledDate: task.scheduledDate ?? undefined,
        estimatedMins: task.estimatedMins ?? undefined,
        notes: task.notes ?? undefined,
      });
      toast({ title: "Task duplicated" });
    },
    deferTask: (id, date) => {
      moveTask.mutate({ id, targetDate: date });
      toast({ title: date ? "Task deferred" : "Moved to backlog" });
    },
    scheduleTask: (id) => {
      const taskDate = hoveredTask?.scheduledDate || format(new Date(), "yyyy-MM-dd");
      quickSchedule.mutate({ 
        taskId: id, 
        startTime: `${taskDate}T09:00:00`,
      });
      toast({ title: "Added to calendar" });
    },
    
    // MCP actions
    copyMcpConfig: async (client) => {
      const apiKey = getMcpApiKey();
      if (!apiKey) {
        toast({ 
          variant: "destructive", 
          title: "No MCP API key", 
          description: "Go to Settings > MCP to create one first" 
        });
        return;
      }
      const apiUrl = import.meta.env.VITE_API_URL || "https://api.opensunsama.com";
      const config = generateMcpConfig(client, apiKey, apiUrl);
      await navigator.clipboard.writeText(config);
      toast({ 
        title: `${getMcpClientDisplayName(client)} config copied`, 
        description: "Paste into your MCP config file" 
      });
    },
    copyApiKey: async () => {
      const apiKey = getMcpApiKey();
      if (!apiKey) {
        toast({ 
          variant: "destructive", 
          title: "No MCP API key", 
          description: "Go to Settings > MCP to create one first" 
        });
        return;
      }
      await navigator.clipboard.writeText(apiKey);
      toast({ title: "API key copied to clipboard" });
    },
  }), [
    navigate, 
    setThemeMode, 
    themeMode, 
    onAddTask, 
    setShowShortcutsModal, 
    closeSearch, 
    hoveredTask, 
    currentView, 
    completeTaskMutation, 
    deleteTaskMutation, 
    createTask, 
    moveTask, 
    quickSchedule
  ]);
}
