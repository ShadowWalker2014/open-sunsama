import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

// Supported file types
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
];

export interface UploadResult {
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

export type FileType = "image" | "video" | "document";

export function getFileType(contentType: string): FileType {
  if (SUPPORTED_IMAGE_TYPES.includes(contentType)) return "image";
  if (SUPPORTED_VIDEO_TYPES.includes(contentType)) return "video";
  return "document";
}

export function isFileSupported(file: File): boolean {
  return (
    SUPPORTED_IMAGE_TYPES.includes(file.type) ||
    SUPPORTED_VIDEO_TYPES.includes(file.type) ||
    SUPPORTED_DOCUMENT_TYPES.includes(file.type) ||
    file.type === "" // Allow unknown types for edge cases
  );
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check if file type is supported
  if (!isFileSupported(file)) {
    return {
      valid: false,
      error: `File type "${file.type || "unknown"}" is not supported`,
    };
  }

  // Check file size
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getFileIcon(contentType: string): string {
  if (SUPPORTED_IMAGE_TYPES.includes(contentType)) return "🖼️";
  if (SUPPORTED_VIDEO_TYPES.includes(contentType)) return "🎬";
  if (contentType === "application/pdf") return "📄";
  if (contentType.includes("word") || contentType.includes("document")) return "📝";
  if (contentType.includes("excel") || contentType.includes("spreadsheet")) return "📊";
  if (contentType.includes("zip") || contentType.includes("archive")) return "📦";
  if (contentType.includes("json")) return "📋";
  if (contentType.includes("text")) return "📃";
  return "📎";
}

/**
 * Hook to upload attachments to the server
 */
export function useUploadAttachment() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      // Validate file before upload
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get auth token
      const token = localStorage.getItem("open_sunsama_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Get API base URL
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file
      const response = await fetch(`${baseUrl}/uploads/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response from server");
      }

      return result.data as UploadResult;
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Hook to upload multiple files
 */
export function useUploadMultipleAttachments() {
  const uploadAttachment = useUploadAttachment();

  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          const result = await uploadAttachment.mutateAsync(file);
          results.push(result);
        } catch (error) {
          errors.push(
            `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`
          );
        }
      }

      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: `${errors.length} file(s) failed to upload`,
          description: errors.slice(0, 3).join("\n"),
        });
      }

      return results;
    },
  });
}
