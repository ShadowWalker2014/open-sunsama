/**
 * Ideas feature type definitions for Open Sunsama.
 * A Trello-style "someday" space: boards → columns → idea cards.
 * @module @open-sunsama/types/idea
 */

import type { TaskPriority } from "./task";

/** A board groups one kind of idea (e.g. "Movies to watch"). */
export interface IdeaBoard {
  /** Unique identifier (UUID) */
  id: string;
  /** Owning user */
  userId: string;
  /** Board name */
  name: string;
  /** lucide-react icon name, e.g. "Film" */
  icon: string;
  /** Hex color from the shared palette, e.g. "#6366F1" */
  color: string;
  /** Order in the board rail (lower first) */
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A vertical column within a board (e.g. "To watch"). */
export interface IdeaColumn {
  id: string;
  userId: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A single idea card. Minimal by design: title + optional notes. */
export interface Idea {
  id: string;
  userId: string;
  boardId: string;
  columnId: string;
  title: string;
  notes: string | null;
  /** Rough time estimate in minutes; null when unset. */
  estimatedMins: number | null;
  /** P0–P3, same scale as tasks. */
  priority: TaskPriority;
  position: number;
  /** Set when the card is checked off (e.g. "watched"/"done"). */
  completedAt: Date | null;
  /** Task created when this idea was promoted to the backlog; null otherwise. */
  promotedTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Subtask totals, included by the list endpoint for the card badge. */
  subtaskCount?: number;
  subtaskDoneCount?: number;
}

// ───────────────────────── inputs ─────────────────────────

export interface CreateIdeaBoardInput {
  name: string;
  icon?: string;
  color?: string;
  position?: number;
}

export interface UpdateIdeaBoardInput {
  name?: string;
  icon?: string;
  color?: string;
  position?: number;
}

export interface CreateIdeaColumnInput {
  boardId: string;
  name: string;
  position?: number;
}

export interface UpdateIdeaColumnInput {
  name?: string;
  position?: number;
}

export interface CreateIdeaInput {
  boardId: string;
  columnId: string;
  title: string;
  notes?: string | null;
  estimatedMins?: number | null;
  priority?: TaskPriority;
  position?: number;
}

export interface UpdateIdeaInput {
  title?: string;
  notes?: string | null;
  estimatedMins?: number | null;
  priority?: TaskPriority;
  columnId?: string;
  position?: number;
  /** Pass a Date to mark done, or null to clear. */
  completedAt?: Date | null;
}

/** Reorder ideas within (or across into) a single column. */
export interface ReorderIdeasInput {
  /** Destination column. */
  columnId: string;
  /** Idea IDs in their new order; index becomes the position. */
  ideaIds: string[];
}

/** Reorder columns within a board. */
export interface ReorderIdeaColumnsInput {
  boardId: string;
  columnIds: string[];
}

/** Reorder boards in the rail. */
export interface ReorderIdeaBoardsInput {
  boardIds: string[];
}

/** Input for promoting an idea into the planner. */
export interface PromoteIdeaInput {
  /** Target schedule date (YYYY-MM-DD). Omit/null sends to the backlog. */
  scheduledDate?: string | null;
}

/** Query filter for listing ideas. */
export interface IdeaFilterInput {
  boardId?: string;
  columnId?: string;
  completed?: boolean;
}

// ───────────────────────── idea subtasks ─────────────────────────

/** A checklist item under an idea card. */
export interface IdeaSubtask {
  id: string;
  ideaId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdeaSubtaskInput {
  title: string;
  position?: number;
}

export interface UpdateIdeaSubtaskInput {
  title?: string;
  completed?: boolean;
  position?: number;
}

export interface ReorderIdeaSubtasksInput {
  subtaskIds: string[];
}
