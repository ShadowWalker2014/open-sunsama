/**
 * S3 storage utilities for Chronoflow API
 * Implements lazy initialization pattern for Railway compatibility
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Lazy-initialized S3 client singleton
let s3Client: S3Client | null = null;

/**
 * Get or create the S3 client with lazy initialization
 * This pattern is required for Railway to avoid accessing env vars at module load time
 */
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.AWS_ENDPOINT_URL,
      region: process.env.AWS_DEFAULT_REGION ?? 'auto',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true, // Required for Railway
    });
  }
  return s3Client;
}

/**
 * Get the S3 bucket name from environment
 */
function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }
  return bucket;
}

/**
 * Upload a file to S3
 * @param key - The S3 object key (path)
 * @param body - The file content as a Buffer
 * @param contentType - The MIME type of the file
 * @returns The proxy URL for accessing the file
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Note: ACL is ignored - Railway buckets are always private
    })
  );

  // Return proxy URL (not direct S3 URL since Railway buckets are private)
  return `/uploads/${key}`;
}

/**
 * Get an object from S3
 * @param key - The S3 object key (path)
 * @returns The object body, content type, and content length, or null if not found
 */
export async function getS3Object(
  key: string
): Promise<{
  body: ReadableStream;
  contentType: string;
  contentLength: number;
} | null> {
  const client = getS3Client();
  const bucket = getBucketName();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      return null;
    }

    return {
      body: response.Body.transformToWebStream(),
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || 0,
    };
  } catch (error: unknown) {
    // Return null for not found errors
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

/**
 * Delete an object from S3
 * @param key - The S3 object key (path)
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Sanitize a filename for use in S3 keys
 * Removes/replaces characters that could cause issues
 */
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique S3 key for a file upload
 * Format: {folder}/{userId}/{timestamp}-{sanitized-filename}
 * @param userId - The user's ID
 * @param folder - The folder/category for the file (e.g., 'avatars', 'attachments')
 * @param filename - The original filename
 * @returns A unique S3 key
 */
export function generateUniqueKey(
  userId: string,
  folder: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = sanitizeFilename(filename);
  return `${folder}/${userId}/${timestamp}-${sanitizedFilename}`;
}
