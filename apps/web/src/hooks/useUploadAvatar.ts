import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@open-sunsama/types";
import { toast } from "@/hooks/use-toast";

const AUTH_USER_KEY = "open_sunsama_user";

interface UploadAvatarResponse {
  success: boolean;
  data: {
    url: string;
  };
}

/**
 * Maximum file size in bytes (2MB)
 */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Allowed image MIME types
 */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Validate the uploaded file
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload an image file (JPG, PNG, GIF, or WebP)",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size must be less than 2MB",
    };
  }

  return { valid: true };
}

/**
 * Hook to upload user avatar
 * Handles multipart form upload to POST /uploads/avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<UploadAvatarResponse> => {
      // Validate file before upload
      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get token from localStorage
      const token = localStorage.getItem("open_sunsama_token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Get base URL from environment
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

      // Upload to API
      const response = await fetch(`${baseUrl}/uploads/avatar`, {
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

      return response.json();
    },
    onSuccess: (data) => {
      // Update the user in the cache with the new avatar URL
      queryClient.setQueryData<User | null>(["auth", "me"], (oldUser) => {
        if (!oldUser) return oldUser;
        const updatedUser = { ...oldUser, avatarUrl: data.data.url };
        // Also update localStorage
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      });

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload avatar",
      });
    },
  });
}

export type { UploadAvatarResponse };
