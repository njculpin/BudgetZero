import { createClient } from "@supabase/supabase-js";
import { storageClient } from "./client";

export type StorageBucket =
  | "asset-files"
  | "asset-images"
  | "product-images"
  | "user-avatars"
  | "documents";

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  type: string;
}

export interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  upsert?: boolean;
  cacheControl?: string;
  accessToken?: string;
}

/**
 * Generic file upload function for any storage bucket
 * @param options - Upload configuration
 * @returns Upload result with path, URL, size, and type
 */
export async function uploadFile(
  options: UploadOptions
): Promise<UploadResult | null> {
  try {
    const { bucket, path, file, upsert = false, cacheControl = "3600", accessToken } = options;

    // Create authenticated client if access token provided
    const client = accessToken
      ? createClient(
          import.meta.env.PUBLIC_SUPABASE_URL,
          import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
          {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          }
        )
      : storageClient;

    // Upload file to storage
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl,
        upsert,
      });

    if (error) {
      console.error(`Error uploading file to ${bucket}:`, error);
      return null;
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    console.error("Error in uploadFile:", error);
    return null;
  }
}

/**
 * Delete a file from storage
 * @param bucket - Storage bucket name
 * @param path - File path to delete
 * @returns Success boolean
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<boolean> {
  try {
    const { error } = await storageClient.storage.from(bucket).remove([path]);

    if (error) {
      console.error(`Error deleting file from ${bucket}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteFile:", error);
    return false;
  }
}

/**
 * Get public URL for a file
 * @param bucket - Storage bucket name
 * @param path - File path
 * @returns Public URL
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = storageClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Create a signed URL for secure downloads
 * @param bucket - Storage bucket name
 * @param path - File path
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await storageClient.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error(`Error creating signed URL for ${bucket}:`, error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error in createSignedUrl:", error);
    return null;
  }
}

/**
 * List files in a directory
 * @param bucket - Storage bucket name
 * @param path - Directory path
 * @returns Array of file names
 */
export async function listFiles(
  bucket: StorageBucket,
  path: string
): Promise<string[]> {
  try {
    const { data, error } = await storageClient.storage.from(bucket).list(path);

    if (error) {
      console.error(`Error listing files in ${bucket}:`, error);
      return [];
    }

    return data.map((file) => file.name);
  } catch (error) {
    console.error("Error in listFiles:", error);
    return [];
  }
}

/**
 * Generate a unique file path with timestamp
 * @param userId - User ID
 * @param prefix - Optional prefix (e.g., productId, assetId)
 * @param filename - Original filename
 * @returns Unique file path
 */
export function generateFilePath(
  userId: string,
  filename: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const ext = filename.split(".").pop();
  const baseName = filename.replace(`.${ext}`, "").replace(/[^a-zA-Z0-9-_]/g, "-");
  const uniqueName = `${baseName}-${timestamp}.${ext}`;

  if (prefix) {
    return `${userId}/${prefix}/${uniqueName}`;
  }

  return `${userId}/${uniqueName}`;
}

/**
 * Validate file type and size
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSizeMB - Maximum file size in MB
 * @returns Validation error message or null if valid
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): string | null {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size exceeds ${maxSizeMB}MB limit`;
  }

  return null;
}

// Common file type validators
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const DOCUMENT_TYPES = ["application/pdf"];
export const ASSET_FILE_TYPES = [
  ...IMAGE_TYPES,
  ...DOCUMENT_TYPES,
  "application/zip",
  "application/x-zip-compressed",
  "model/stl",
  "model/obj",
  "model/gltf+json",
  "model/gltf-binary",
];
