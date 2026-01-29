/**
 * Validation schemas for upload routes
 */

import { z } from 'zod';

/**
 * Maximum file sizes in bytes
 */
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed MIME types for avatars (images only)
 */
export const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Allowed MIME types for attachments
 */
export const ALLOWED_ATTACHMENT_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov files
  // Documents
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain', // .txt
] as const;

/**
 * Type for allowed avatar MIME types
 */
export type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number];

/**
 * Type for allowed attachment MIME types
 */
export type AllowedAttachmentType = (typeof ALLOWED_ATTACHMENT_TYPES)[number];

/**
 * Schema for validating avatar file uploads
 */
export const avatarFileSchema = z.object({
  type: z.enum(ALLOWED_AVATAR_TYPES, {
    errorMap: () => ({
      message: `Invalid file type. Allowed types: ${ALLOWED_AVATAR_TYPES.join(', ')}`,
    }),
  }),
  size: z.number().max(MAX_AVATAR_SIZE, {
    message: `File size must be less than ${MAX_AVATAR_SIZE / (1024 * 1024)}MB`,
  }),
});

/**
 * Schema for validating attachment file uploads
 */
export const attachmentFileSchema = z.object({
  type: z.enum(ALLOWED_ATTACHMENT_TYPES, {
    errorMap: () => ({
      message: `Invalid file type. Allowed types: images (jpeg, png, gif, webp), videos (mp4, webm, mov), documents (pdf, doc, docx, xls, xlsx, txt)`,
    }),
  }),
  size: z.number().max(MAX_ATTACHMENT_SIZE, {
    message: `File size must be less than ${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB`,
  }),
});

/**
 * Schema for attachment upload form data
 */
export const attachmentFormSchema = z.object({
  taskId: z.string().uuid().optional(),
});

/**
 * Check if a MIME type is an allowed avatar type
 */
export function isAllowedAvatarType(type: string): type is AllowedAvatarType {
  return (ALLOWED_AVATAR_TYPES as readonly string[]).includes(type);
}

/**
 * Check if a MIME type is an allowed attachment type
 */
export function isAllowedAttachmentType(
  type: string
): type is AllowedAttachmentType {
  return (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(type);
}

/**
 * Get human-readable file type category
 */
export function getFileTypeCategory(
  type: string
): 'image' | 'video' | 'document' | 'unknown' {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (
    type.startsWith('application/') ||
    type.startsWith('text/')
  ) {
    return 'document';
  }
  return 'unknown';
}
