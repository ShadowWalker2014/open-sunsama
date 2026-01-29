import * as React from "react";
import {
  FileText,
  Image,
  Video,
  Table2,
  File,
  FileArchive,
  FileCode,
  Music,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileIconProps {
  contentType: string;
  className?: string;
}

/**
 * Returns the appropriate icon based on the file's MIME type
 */
export function FileIcon({ contentType, className }: FileIconProps) {
  const iconClass = cn("h-5 w-5", className);

  // Images
  if (contentType.startsWith("image/")) {
    return <Image className={cn(iconClass, "text-blue-500")} />;
  }

  // Videos
  if (contentType.startsWith("video/")) {
    return <Video className={cn(iconClass, "text-purple-500")} />;
  }

  // Audio
  if (contentType.startsWith("audio/")) {
    return <Music className={cn(iconClass, "text-pink-500")} />;
  }

  // PDF
  if (contentType === "application/pdf") {
    return <FileText className={cn(iconClass, "text-red-500")} />;
  }

  // Word documents
  if (
    contentType === "application/msword" ||
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <FileText className={cn(iconClass, "text-blue-600")} />;
  }

  // Excel/Spreadsheets
  if (
    contentType === "application/vnd.ms-excel" ||
    contentType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    contentType === "text/csv"
  ) {
    return <Table2 className={cn(iconClass, "text-green-600")} />;
  }

  // PowerPoint/Presentations
  if (
    contentType === "application/vnd.ms-powerpoint" ||
    contentType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return <Presentation className={cn(iconClass, "text-orange-500")} />;
  }

  // Archives
  if (
    contentType === "application/zip" ||
    contentType === "application/x-rar-compressed" ||
    contentType === "application/x-7z-compressed" ||
    contentType === "application/gzip"
  ) {
    return <FileArchive className={cn(iconClass, "text-amber-600")} />;
  }

  // Code/Text files
  if (
    contentType === "text/plain" ||
    contentType === "text/markdown" ||
    contentType === "application/json" ||
    contentType === "text/javascript" ||
    contentType === "text/css" ||
    contentType === "text/html"
  ) {
    return <FileCode className={cn(iconClass, "text-slate-500")} />;
  }

  // Default file icon
  return <File className={cn(iconClass, "text-muted-foreground")} />;
}

/**
 * Get a color class based on file type (for backgrounds, etc.)
 */
export function getFileTypeColor(contentType: string): string {
  if (contentType.startsWith("image/")) return "bg-blue-500/10";
  if (contentType.startsWith("video/")) return "bg-purple-500/10";
  if (contentType.startsWith("audio/")) return "bg-pink-500/10";
  if (contentType === "application/pdf") return "bg-red-500/10";
  if (contentType.includes("word")) return "bg-blue-600/10";
  if (contentType.includes("excel") || contentType.includes("spreadsheet") || contentType === "text/csv") {
    return "bg-green-600/10";
  }
  if (contentType.includes("powerpoint") || contentType.includes("presentation")) {
    return "bg-orange-500/10";
  }
  if (contentType.includes("zip") || contentType.includes("rar") || contentType.includes("7z")) {
    return "bg-amber-600/10";
  }
  return "bg-muted";
}
