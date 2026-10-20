/** Todoist API v1 task shapes and mapping to the shared import contract. */
import { z } from "zod";
import type { TaskPriority } from "@open-sunsama/database";
import type { ExternalTask } from "./index";

export const todoistCredentialSchema = z.object({
  token: z.string().min(10, "Token looks too short"),
});

export type TodoistCredentials = z.infer<typeof todoistCredentialSchema>;

export interface TodoistUser {
  id: string;
  email: string | null;
  full_name: string | null;
}

export interface TodoistProject {
  id: string;
  name: string;
}

export interface TodoistSection {
  id: string;
  name: string;
  project_id: string;
}

export interface TodoistTask {
  id: string;
  project_id: string;
  section_id: string | null;
  content: string;
  description: string;
  priority: number;
  checked: boolean;
  completed_at: string | null;
  updated_at: string;
  due: { date: string } | null;
  duration: { amount: number; unit: "minute" | "day" } | null;
}

export function mapPriority(priority: number): TaskPriority | null {
  switch (priority) {
    case 4: return "P0";
    case 3: return "P1";
    case 2: return "P2";
    case 1: return "P3";
    default: return null;
  }
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeTask(
  raw: TodoistTask,
  project: TodoistProject | null,
  section: TodoistSection | null = null
): ExternalTask {
  const completed = raw.checked || raw.completed_at !== null;
  return {
    externalId: raw.id,
    title: raw.content,
    description: raw.description || null,
    priority: mapPriority(raw.priority),
    estimatedMins: raw.duration?.unit === "minute" && raw.duration.amount > 0
      ? raw.duration.amount : null,
    isCompleted: completed,
    statusName: completed ? "completed" : "open",
    dueDate: parseDate(raw.due?.date),
    url: `https://app.todoist.com/app/task/${encodeURIComponent(raw.id)}`,
    containerName: [project?.name, section?.name].filter(Boolean).join(" / ") || null,
    projectName: project?.name ?? null,
    sectionName: section?.name ?? null,
    remoteUpdatedAt: parseDate(raw.updated_at) ?? new Date(0),
    // The single-task endpoint does not return child tasks.
    subtasks: [],
  };
}

/** Server IDs are 16-character base32 values (or legacy decimal IDs). */
function isTodoistTaskId(id: string): boolean {
  return /^[0-9]{8,20}$/.test(id) || /^[0-9A-HJKMNP-TV-Z]{16}$/i.test(id);
}

/** Accept an ID, canonical URL, or a URL with a human-readable task slug. */
export function parseTodoistReference(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }
    if (!/(^|\.)todoist\.com$/i.test(url.hostname)) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 3 || segments[0] !== "app" || segments[1] !== "task") return null;
    const last = segments[2]!;
    const id = last.split("-").at(-1)!;
    return isTodoistTaskId(id) ? id : null;
  }

  return isTodoistTaskId(trimmed) ? trimmed : null;
}
