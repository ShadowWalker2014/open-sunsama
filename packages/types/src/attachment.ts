/**
 * Attachment-related type definitions for Open Sunsama
 * @module @open-sunsama/types/attachment
 */

/**
 * Represents a file attachment in the Open Sunsama system.
 * Attachments can be associated with tasks or standalone.
 */
export interface Attachment {
  /** Unique identifier for the attachment (UUID format) */
  id: string;

  /** ID of the task this attachment belongs to (optional) */
  taskId: string | null;

  /** ID of the user who uploaded the attachment */
  userId: string;

  /** Proxy URL for accessing the attachment (e.g., /uploads/attachments/...) */
  url: string;

  /** Original filename of the uploaded file */
  filename: string;

  /** MIME type of the file (e.g., image/png, application/pdf) */
  contentType: string;

  /** File size in bytes */
  size: number;

  /** S3 key for the file (used for deletion) */
  s3Key: string;

  /** Timestamp when the attachment was created */
  createdAt: string;
}

/**
 * Input data required to create a new attachment.
 */
export interface CreateAttachmentInput {
  /** ID of the task to attach to (optional) */
  taskId?: string | null;

  /** Proxy URL for the attachment */
  url: string;

  /** Original filename */
  filename: string;

  /** MIME type */
  contentType: string;

  /** File size in bytes */
  size: number;

  /** S3 key for the file */
  s3Key: string;
}

/**
 * Input data for updating an existing attachment.
 * Only the task association can be updated.
 */
export interface UpdateAttachmentInput {
  /** Updated task ID (can be null to detach from task) */
  taskId?: string | null;
}

/**
 * Filter options for querying attachments.
 */
export interface AttachmentFilterInput {
  /** Filter by task ID */
  taskId?: string;

  /** Filter by content type (e.g., 'image/*') */
  contentType?: string;
}

/**
 * Attachment with additional metadata.
 */
export interface AttachmentWithMeta extends Attachment {
  /** Human-readable file size (e.g., "1.5 MB") */
  formattedSize?: string;

  /** Whether the file is an image */
  isImage?: boolean;
}
