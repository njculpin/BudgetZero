import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '../shared/types';
import { failure, success } from '../shared/utils';

export type UploadFileOptions = {
  bucket: string;
  path: string;
  file: File;
  contentType?: string;
  upsert?: boolean;
};

export type UploadFileResult = {
  path: string;
  publicUrl: string;
};

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<ApiResponse<UploadFileResult>> {
  try {
    const supabase = await createClient();

    const { error: uploadError } = await supabase.storage
      .from(options.bucket)
      .upload(options.path, options.file, {
        contentType: options.contentType || options.file.type,
        upsert: options.upsert ?? false,
      });

    if (uploadError) {
      return failure(uploadError);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(options.bucket).getPublicUrl(options.path);

    return success({
      path: options.path,
      publicUrl,
    });
  } catch (error) {
    return failure(error);
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return failure(error);
    }

    return success(undefined);
  } catch (error) {
    return failure(error);
  }
}

/**
 * Generate a unique file path for uploads
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  subPath?: string
): string {
  const fileExt = fileName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const uniqueName = `${timestamp}-${random}.${fileExt}`;

  if (subPath) {
    return `${userId}/${subPath}/${uniqueName}`;
  }

  return `${userId}/${uniqueName}`;
}

/**
 * Get public URL for a file in storage
 */
export async function getPublicUrl(
  bucket: string,
  path: string
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}
