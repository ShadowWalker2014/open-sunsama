import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Attachment } from "@chronoflow/types";
import { toast } from "@/hooks/use-toast";
import { validateFile } from "./useUploadAttachment";

/**
 * Query key factory for attachments
 */
export const attachmentKeys = {
  all: ["attachments"] as const,
  lists: () => [...attachmentKeys.all, "list"] as const,
  list: (taskId: string) => [...attachmentKeys.lists(), taskId] as const,
  details: () => [...attachmentKeys.all, "detail"] as const,
  detail: (id: string) => [...attachmentKeys.details(), id] as const,
};

/**
 * Check if a file is an image
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * Check if a file is a video
 */
export function isVideoFile(contentType: string): boolean {
  return contentType.startsWith("video/");
}

/**
 * Hook to manage task attachments
 */
export function useTaskAttachments(taskId: string) {
  const queryClient = useQueryClient();

  // Fetch attachments for this task
  const { data: attachments = [], isLoading, error } = useQuery({
    queryKey: attachmentKeys.list(taskId),
    queryFn: async (): Promise<Attachment[]> => {
      const token = localStorage.getItem("chronoflow_token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/attachments?taskId=${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch attachments: ${response.status}`
        );
      }

      const result = await response.json();
      return result.data || [];
    },
    enabled: !!taskId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<Attachment> => {
      // Validate file before upload
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const token = localStorage.getItem("chronoflow_token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/uploads/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (newAttachment) => {
      // Add to cache
      queryClient.setQueryData<Attachment[]>(
        attachmentKeys.list(taskId),
        (old = []) => [...old, newAttachment]
      );

      toast({
        title: "File uploaded",
        description: `"${newAttachment.filename}" has been uploaded.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload file",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string): Promise<string> => {
      const token = localStorage.getItem("chronoflow_token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${baseUrl}/attachments/${attachmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Delete failed with status ${response.status}`
        );
      }

      return attachmentId;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.setQueryData<Attachment[]>(
        attachmentKeys.list(taskId),
        (old = []) => old.filter((a) => a.id !== deletedId)
      );

      toast({
        title: "File deleted",
        description: "The attachment has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete file",
      });
    },
  });

  return {
    attachments,
    isLoading,
    error,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export type { Attachment };
