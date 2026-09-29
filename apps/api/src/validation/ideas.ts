/**
 * Validation schemas for ideas routes (boards / columns / ideas).
 */

import { z } from "zod";
import { uuidSchema, dateSchema } from "@open-sunsama/utils";

const prioritySchema = z.enum(["P0", "P1", "P2", "P3"]);
const estimatedMinsSchema = z.number().int().positive().max(1440);
const orderedIdsSchema = z.array(uuidSchema).min(1).refine(
  (ids) => new Set(ids).size === ids.length,
  "IDs must be unique"
);

// lucide icon name — letters/digits only (e.g. "Film", "Rocket")
const iconSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9]+$/, { error: "Invalid icon name" });
const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, { error: "Invalid hex color" });

// ───────────────────────── boards ─────────────────────────
export const createIdeaBoardSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }).max(120),
  icon: iconSchema.optional(),
  color: colorSchema.optional(),
  position: z.number().int().nonnegative().optional(),
});

export const updateIdeaBoardSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  icon: iconSchema.optional(),
  color: colorSchema.optional(),
  position: z.number().int().nonnegative().optional(),
});

export const reorderIdeaBoardsSchema = z.object({
  boardIds: orderedIdsSchema,
});

// ───────────────────────── columns ─────────────────────────
export const createIdeaColumnSchema = z.object({
  boardId: uuidSchema,
  name: z.string().min(1, { error: "Name is required" }).max(120),
  position: z.number().int().nonnegative().optional(),
});

export const updateIdeaColumnSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  position: z.number().int().nonnegative().optional(),
});

export const reorderIdeaColumnsSchema = z.object({
  boardId: uuidSchema,
  columnIds: orderedIdsSchema,
});

// ───────────────────────── ideas ─────────────────────────
export const createIdeaSchema = z.object({
  boardId: uuidSchema,
  columnId: uuidSchema,
  title: z.string().min(1, { error: "Title is required" }).max(500),
  notes: z.string().max(5000).optional().nullable(),
  estimatedMins: estimatedMinsSchema.optional().nullable(),
  priority: prioritySchema.optional(),
  position: z.number().int().nonnegative().optional(),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(5000).optional().nullable(),
  estimatedMins: estimatedMinsSchema.optional().nullable(),
  priority: prioritySchema.optional(),
  columnId: uuidSchema.optional(),
  position: z.number().int().nonnegative().optional(),
  completedAt: z.iso.datetime().optional().nullable(),
});

export const ideaFilterSchema = z.object({
  boardId: uuidSchema.optional(),
  columnId: uuidSchema.optional(),
  completed: z.enum(["true", "false"]).optional(),
});

export const reorderIdeasSchema = z.object({
  columnId: uuidSchema,
  ideaIds: orderedIdsSchema,
});

export const promoteIdeaSchema = z.object({
  scheduledDate: dateSchema.optional().nullable(),
});

// ───────────────────────── idea subtasks ─────────────────────────
export const createIdeaSubtaskSchema = z.object({
  title: z.string().min(1, { error: "Title is required" }).max(500),
  position: z.number().int().nonnegative().optional(),
});

export const updateIdeaSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});

export const reorderIdeaSubtasksSchema = z.object({
  subtaskIds: orderedIdsSchema,
});

export const ideaIdParamSchema = z.object({
  ideaId: uuidSchema,
});

export const ideaSubtaskIdParamSchema = z.object({
  ideaId: uuidSchema,
  id: uuidSchema,
});
