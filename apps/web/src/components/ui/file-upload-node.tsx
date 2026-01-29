"use client";

import * as React from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Download, X, FileText, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, getFileIcon } from "@/hooks/useUploadAttachment";

/**
 * Image Node View Component
 * Renders images with proper sizing, loading states, and error handling
 */
export function ImageNodeView({ node, deleteNode, selected }: NodeViewProps) {
  const { src, alt, title } = node.attrs;
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <NodeViewWrapper className="tiptap-image-wrapper relative group">
      <div
        className={cn(
          "relative inline-block max-w-full rounded-lg overflow-hidden transition-all",
          selected && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {hasError ? (
          <div className="flex items-center justify-center h-32 bg-muted rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">Failed to load image</p>
          </div>
        ) : (
          <img
            src={src}
            alt={alt || ""}
            title={title || ""}
            className="max-w-full h-auto rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            style={{ maxHeight: "400px" }}
          />
        )}
        {/* Delete button on hover */}
        <button
          onClick={deleteNode}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-black/80 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
          )}
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Video Node View Component
 * Renders videos with controls and proper sizing
 */
export function VideoNodeView({ node, deleteNode, selected }: NodeViewProps) {
  const { src, title } = node.attrs;
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  return (
    <NodeViewWrapper className="tiptap-video-wrapper relative group">
      <div
        className={cn(
          "relative max-w-full rounded-lg overflow-hidden transition-all",
          selected && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse z-10">
            <div className="flex flex-col items-center gap-2">
              <Play className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading video...</span>
            </div>
          </div>
        )}
        {hasError ? (
          <div className="flex items-center justify-center h-48 bg-muted rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">Failed to load video</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={src}
            title={title || ""}
            controls
            className="max-w-full rounded-lg"
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            style={{ maxHeight: "400px" }}
          />
        )}
        {/* Delete button on hover */}
        <button
          onClick={deleteNode}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white z-20",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-black/80 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
          )}
          aria-label="Remove video"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * File Attachment Node View Component
 * Renders non-media files as downloadable cards
 */
export function FileAttachmentNodeView({ node, deleteNode, selected }: NodeViewProps) {
  const { src, filename, contentType, size } = node.attrs;
  const icon = getFileIcon(contentType);

  const handleDownload = () => {
    // Open in new tab / trigger download
    window.open(src, "_blank");
  };

  return (
    <NodeViewWrapper className="tiptap-file-attachment-wrapper">
      <div
        className={cn(
          "inline-flex items-center gap-3 px-4 py-3 rounded-lg border",
          "bg-muted/30 hover:bg-muted/50 transition-colors group",
          "max-w-sm",
          selected && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {/* File Icon */}
        <div className="flex-shrink-0 text-2xl">{icon}</div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={filename}>
            {filename}
          </p>
          <p className="text-xs text-muted-foreground">{formatFileSize(size)}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            className={cn(
              "p-1.5 rounded-md text-muted-foreground",
              "hover:bg-background hover:text-foreground transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
            aria-label="Download file"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={deleteNode}
            className={cn(
              "p-1.5 rounded-md text-muted-foreground",
              "hover:bg-destructive/10 hover:text-destructive transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-destructive"
            )}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Upload Placeholder Node View Component
 * Shows a loading state while file is being uploaded
 */
export function UploadPlaceholderNodeView({ node }: NodeViewProps) {
  const { filename } = node.attrs;

  return (
    <NodeViewWrapper className="tiptap-upload-placeholder-wrapper">
      <div
        className={cn(
          "inline-flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed",
          "bg-muted/20 animate-pulse",
          "max-w-sm"
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate text-muted-foreground">{filename || "Uploading..."}</p>
          <p className="text-xs text-muted-foreground">Please wait...</p>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Drag & Drop Zone Component
 * Wraps the editor to provide visual feedback during file drops
 */
interface DragDropZoneProps {
  children: React.ReactNode;
  onFileDrop?: (files: File[]) => void;
  className?: string;
}

export function DragDropZone({ children, onFileDrop, className }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0 && onFileDrop) {
      onFileDrop(files);
    }
  };

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center",
            "bg-primary/5 border-2 border-dashed border-primary rounded-lg",
            "pointer-events-none transition-all"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-primary">
            <FileText className="h-8 w-8" />
            <p className="text-sm font-medium">Drop files here</p>
          </div>
        </div>
      )}
    </div>
  );
}
