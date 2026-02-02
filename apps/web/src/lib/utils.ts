import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Handles conditional classes and prevents style conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Format time to a readable string (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format duration in minutes to h:mm format (e.g., "0:15", "1:00", "2:30")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Strip HTML tags from a string for plain text preview.
 * Uses regex for SSR compatibility.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";
  // Use regex to remove HTML tags (works in SSR)
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Get the full URL for an avatar image
 * Avatar URLs are stored as relative paths (/uploads/...) which need the API base URL prepended
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | undefined {
  if (!avatarUrl) return undefined;

  // If already a full URL, return as-is
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  // Prepend API base URL for relative paths
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${apiBaseUrl}${avatarUrl}`;
}

// ============================================================================
// Time Estimation Presets & Utilities
// ============================================================================

/**
 * Standard time presets for task estimation dropdowns (string values)
 */
export const TIME_PRESETS = [
  { label: "5 min", value: "5" },
  { label: "10 min", value: "10" },
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "45 min", value: "45" },
  { label: "1 hour", value: "60" },
  { label: "1.5 hours", value: "90" },
  { label: "2 hours", value: "120" },
  { label: "4 hours", value: "240" },
  { label: "6 hours", value: "360" },
  { label: "8 hours", value: "480" },
] as const;

/**
 * Standard time presets for task estimation (numeric values)
 */
export const TIME_PRESETS_NUMERIC = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
  { label: "6 hours", value: 360 },
  { label: "8 hours", value: 480 },
] as const;

/**
 * Format minutes to human-readable time display (e.g., "30 min", "1 hour", "2h 30m")
 */
export function formatTimeDisplay(mins: string | number | null | undefined): string {
  if (mins === null || mins === undefined || mins === "") return "";
  const num = typeof mins === "string" ? parseInt(mins, 10) : mins;
  if (isNaN(num) || num <= 0) return "";
  if (num < 60) return `${num} min`;
  const hours = Math.floor(num / 60);
  const remaining = num % 60;
  if (remaining === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${remaining}m`;
}

/**
 * Format minutes to compact time display (e.g., "30m", "1h", "2h 30m")
 */
export function formatTimeDisplayCompact(mins: string | number | null | undefined): string {
  if (mins === null || mins === undefined || mins === "") return "";
  const num = typeof mins === "string" ? parseInt(mins, 10) : mins;
  if (isNaN(num) || num <= 0) return "";
  if (num < 60) return `${num}m`;
  const hours = Math.floor(num / 60);
  const remaining = num % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

/**
 * Parse flexible time input formats into minutes.
 * Supports: "30", "30m", "1h", "1.5h", "1h30m", "2 hours", etc.
 */
export function parseTimeInput(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();

  // Match patterns like "1h30m", "1.5h", "30m", "30", etc.
  const hourMinMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:ins?)?)?$/
  );
  if (hourMinMatch && hourMinMatch[1]) {
    const hours = parseFloat(hourMinMatch[1]);
    const mins = parseInt(hourMinMatch[2] ?? "0", 10);
    return Math.round(hours * 60) + mins;
  }

  const minMatch = trimmed.match(/^(\d+)\s*m(?:ins?)?$/);
  if (minMatch && minMatch[1]) {
    return parseInt(minMatch[1], 10);
  }

  const hourOnly = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  if (hourOnly && hourOnly[1]) {
    return Math.round(parseFloat(hourOnly[1]) * 60);
  }

  // Plain number = minutes
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num > 0) {
    return num;
  }

  return null;
}
