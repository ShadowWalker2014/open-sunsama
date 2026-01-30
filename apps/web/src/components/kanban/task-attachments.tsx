import * as React from "react";
import {
  Upload,
  Download,
  Trash2,
  Play,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import type { Attachment } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileIcon, getFileTypeColor } from "@/components/ui/file-icon";
import { Lightbox } from "@/components/ui/lightbox";
import {
  useTaskAttachments,
  isImageFile,
  isVideoFile,
} from "@/hooks/useTaskAttachments";
import { formatFileSize, validateFile } from "@/hooks/useUploadAttachment";

interface TaskAttachmentsProps {
  taskId: string;
}

/**
 * Attachments section for the task modal
 * Displays and manages file attachments for a task
 */
export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const {
    attachments,
    isLoading,
    error,
    isError,
    upload,
    isUploading,
    delete: deleteAttachment,
    isDeleting,
  } = useTaskAttachments(taskId);

  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<
    Map<string, { progress: number; status: "uploading" | "error"; error?: string }>
  >(new Map());
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Get media items for lightbox
  const mediaItems = React.useMemo(() => {
    return attachments
      .filter((a) => isImageFile(a.contentType) || isVideoFile(a.contentType))
      .map((a) => ({
        url: a.url,
        filename: a.filename,
        contentType: a.contentType,
      }));
  }, [attachments]);

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.set(file.name, { progress: 0, status: "error", error: validation.error });
          return next;
        });
        continue;
      }

      // Set uploading state
      setUploadProgress((prev) => {
        const next = new Map(prev);
        next.set(file.name, { progress: 0, status: "uploading" });
        return next;
      });

      try {
        await upload(file);
        // Remove from progress on success
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.delete(file.name);
          return next;
        });
      } catch (err) {
        setUploadProgress((prev) => {
          const next = new Map(prev);
          next.set(file.name, {
            progress: 0,
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          });
          return next;
        });
      }
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle delete
  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      setDeleteConfirmId(null);
    } catch {
      // Error is handled by the hook
    }
  };

  // Handle download
  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open media in lightbox
  const openLightbox = (attachment: Attachment) => {
    const index = mediaItems.findIndex((m) => m.url === attachment.url);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Dismiss upload error
  const dismissError = (fileName: string) => {
    setUploadProgress((prev) => {
      const next = new Map(prev);
      next.delete(fileName);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only show error state for actual network/server errors, not for "no attachments" cases
  // The hook now handles 404 gracefully by returning an empty array
  if (isError && error) {
    // Check if this is a real error we should display (not just empty results)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNetworkOrServerError = 
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("Network") ||
      errorMessage.includes("500") ||
      errorMessage.includes("503") ||
      errorMessage.includes("Not authenticated");
    
    if (isNetworkOrServerError) {
      return (
        <div className="flex items-center gap-2 text-destructive py-4">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load attachments</span>
        </div>
      );
    }
    // For other errors (like unexpected responses), just show empty state
    // This prevents showing errors for edge cases like race conditions
  }

  const hasAttachments = attachments.length > 0 || uploadProgress.size > 0;

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/40"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip,.rar,.7z"
        />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <div className="text-sm text-muted-foreground">
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <span className="font-medium">Drop files here</span> or click to upload
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground/70">Max 10MB per file</p>
        </div>
      </div>

      {/* Upload Progress / Errors */}
      {uploadProgress.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadProgress.entries()).map(([fileName, state]) => (
            <div
              key={fileName}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md text-sm",
                state.status === "uploading" && "bg-muted",
                state.status === "error" && "bg-destructive/10"
              )}
            >
              {state.status === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate">{fileName}</p>
                {state.error && (
                  <p className="text-xs text-destructive">{state.error}</p>
                )}
              </div>
              {state.status === "error" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => dismissError(fileName)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attachments Grid/List */}
      {hasAttachments && (
        <div className="space-y-2">
          {/* Images Grid */}
          {attachments.filter((a) => isImageFile(a.contentType)).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachments
                .filter((a) => isImageFile(a.contentType))
                .map((attachment) => (
                  <AttachmentThumbnail
                    key={attachment.id}
                    attachment={attachment}
                    onPreview={() => openLightbox(attachment)}
                    onDownload={() => handleDownload(attachment)}
                    onDelete={() => setDeleteConfirmId(attachment.id)}
                    isDeleting={isDeleting && deleteConfirmId === attachment.id}
                    showDeleteConfirm={deleteConfirmId === attachment.id}
                    onConfirmDelete={() => handleDelete(attachment.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                ))}
            </div>
          )}

          {/* Videos Grid */}
          {attachments.filter((a) => isVideoFile(a.contentType)).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachments
                .filter((a) => isVideoFile(a.contentType))
                .map((attachment) => (
                  <AttachmentVideoThumbnail
                    key={attachment.id}
                    attachment={attachment}
                    onPreview={() => openLightbox(attachment)}
                    onDownload={() => handleDownload(attachment)}
                    onDelete={() => setDeleteConfirmId(attachment.id)}
                    isDeleting={isDeleting && deleteConfirmId === attachment.id}
                    showDeleteConfirm={deleteConfirmId === attachment.id}
                    onConfirmDelete={() => handleDelete(attachment.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                ))}
            </div>
          )}

          {/* Documents List */}
          {attachments.filter(
            (a) => !isImageFile(a.contentType) && !isVideoFile(a.contentType)
          ).length > 0 && (
            <div className="space-y-1">
              {attachments
                .filter(
                  (a) => !isImageFile(a.contentType) && !isVideoFile(a.contentType)
                )
                .map((attachment) => (
                  <AttachmentFileCard
                    key={attachment.id}
                    attachment={attachment}
                    onDownload={() => handleDownload(attachment)}
                    onDelete={() => setDeleteConfirmId(attachment.id)}
                    isDeleting={isDeleting && deleteConfirmId === attachment.id}
                    showDeleteConfirm={deleteConfirmId === attachment.id}
                    onConfirmDelete={() => handleDelete(attachment.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasAttachments && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No attachments yet
        </p>
      )}

      {/* Lightbox */}
      <Lightbox
        items={mediaItems}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

// Image thumbnail component
interface AttachmentThumbnailProps {
  attachment: Attachment;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function AttachmentThumbnail({
  attachment,
  onPreview,
  onDownload,
  onDelete,
  isDeleting,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: AttachmentThumbnailProps) {
  return (
    <div className="relative group aspect-square rounded-md overflow-hidden bg-muted">
      <img
        src={attachment.url}
        alt={attachment.filename}
        className="h-full w-full object-cover cursor-pointer transition-transform hover:scale-105"
        onClick={onPreview}
      />

      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        {showDeleteConfirm ? (
          <DeleteConfirmation
            isDeleting={isDeleting}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        ) : (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Filename tooltip */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-xs text-white truncate">{attachment.filename}</p>
      </div>
    </div>
  );
}

// Video thumbnail component
interface AttachmentVideoThumbnailProps {
  attachment: Attachment;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function AttachmentVideoThumbnail({
  attachment,
  onPreview,
  onDownload,
  onDelete,
  isDeleting,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: AttachmentVideoThumbnailProps) {
  return (
    <div className="relative group aspect-square rounded-md overflow-hidden bg-muted">
      {/* Video thumbnail or placeholder */}
      <div
        className="h-full w-full bg-purple-500/20 flex items-center justify-center cursor-pointer"
        onClick={onPreview}
      >
        <Play className="h-8 w-8 text-purple-500" />
      </div>

      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        {showDeleteConfirm ? (
          <DeleteConfirmation
            isDeleting={isDeleting}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        ) : (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Filename */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-xs text-white truncate">{attachment.filename}</p>
      </div>
    </div>
  );
}

// File card component for documents
interface AttachmentFileCardProps {
  attachment: Attachment;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function AttachmentFileCard({
  attachment,
  onDownload,
  onDelete,
  isDeleting,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: AttachmentFileCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors",
        getFileTypeColor(attachment.contentType),
        "hover:bg-accent/50"
      )}
    >
      <div className="flex-shrink-0">
        <FileIcon contentType={attachment.contentType} className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {showDeleteConfirm ? (
          <DeleteConfirmation
            isDeleting={isDeleting}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
            compact
          />
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Delete confirmation component
interface DeleteConfirmationProps {
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  compact?: boolean;
}

function DeleteConfirmation({
  isDeleting,
  onConfirm,
  onCancel,
  compact,
}: DeleteConfirmationProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onConfirm}
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      {isDeleting ? (
        <Loader2 className="h-5 w-5 animate-spin text-white" />
      ) : (
        <>
          <p className="text-xs text-white text-center">Delete?</p>
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
            >
              Yes
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              No
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
