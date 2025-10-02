import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiResponse } from "@/lib/types/database";

export const STORAGE_BUCKETS = {
  MODELS: "models",
  ILLUSTRATIONS: "illustrations",
  THUMBNAILS: "thumbnails",
  PREVIEWS: "previews",
  TEXTURES: "textures",
} as const;

// File size limits (bytes)
export const FILE_SIZE_LIMITS = {
  MODEL_MAX: 500 * 1024 * 1024, // 500MB for 3D models
  ILLUSTRATION_MAX: 100 * 1024 * 1024, // 100MB for illustrations
  TEXTURE_MAX: 50 * 1024 * 1024, // 50MB for textures
  THUMBNAIL_MAX: 5 * 1024 * 1024, // 5MB for thumbnails
  PREVIEW_MAX: 10 * 1024 * 1024, // 10MB for preview images
} as const;

// Allowed file formats
export const ALLOWED_MODEL_FORMATS = [
  ".stl",
  ".obj",
  ".fbx",
  ".glb",
  ".gltf",
  ".3ds",
  ".blend",
];
export const ALLOWED_TEXTURE_FORMATS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".tga",
  ".dds",
  ".exr",
];
export const ALLOWED_MATERIAL_FORMATS = [".mtl", ".mat"];
export const ALLOWED_ILLUSTRATION_FORMATS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
  ".tiff",
  ".bmp",
  ".psd",
  ".ai",
  ".eps",
];

export class StorageService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Upload a 3D model file
   */
  async uploadModelFile(
    userId: string,
    file: File,
    options: {
      folder?: string;
      isPublic?: boolean;
    } = {},
  ): Promise<ApiResponse<{ path: string; url: string; size: number }>> {
    try {
      // Validate file format
      const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (!fileExtension || !ALLOWED_MODEL_FORMATS.includes(fileExtension)) {
        return {
          error: `Invalid file format. Allowed: ${ALLOWED_MODEL_FORMATS.join(", ")}`,
        };
      }

      // Validate file size
      if (file.size > FILE_SIZE_LIMITS.MODEL_MAX) {
        return {
          error: `File too large. Maximum size: ${FILE_SIZE_LIMITS.MODEL_MAX / 1024 / 1024}MB`,
        };
      }

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const folder = options.folder || userId;
      const filePath = `${folder}/${timestamp}_${sanitizedName}`;

      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.MODELS)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return { error: "Failed to upload file" };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKETS.MODELS)
        .getPublicUrl(filePath);

      return {
        data: {
          path: data.path,
          url: urlData.publicUrl,
          size: file.size,
        },
      };
    } catch (error) {
      console.error("Unexpected error uploading file:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Upload an illustration file
   */
  async uploadIllustration(
    userId: string,
    file: File,
    options: {
      folder?: string;
      isPublic?: boolean;
    } = {},
  ): Promise<ApiResponse<{ path: string; url: string; size: number }>> {
    try {
      // Validate file format
      const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (
        !fileExtension ||
        !ALLOWED_ILLUSTRATION_FORMATS.includes(fileExtension)
      ) {
        return {
          error: `Invalid file format. Allowed: ${ALLOWED_ILLUSTRATION_FORMATS.join(", ")}`,
        };
      }

      // Validate file size
      if (file.size > FILE_SIZE_LIMITS.ILLUSTRATION_MAX) {
        return {
          error: `File too large. Maximum size: ${FILE_SIZE_LIMITS.ILLUSTRATION_MAX / 1024 / 1024}MB`,
        };
      }

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const folder = options.folder || userId;
      const filePath = `${folder}/${timestamp}_${sanitizedName}`;

      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.ILLUSTRATIONS)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return { error: "Failed to upload file" };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKETS.ILLUSTRATIONS)
        .getPublicUrl(filePath);

      return {
        data: {
          path: data.path,
          url: urlData.publicUrl,
          size: file.size,
        },
      };
    } catch (error) {
      console.error("Unexpected error uploading file:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Upload thumbnail/preview image
   */
  async uploadThumbnail(
    userId: string,
    file: File,
    assetId: string,
  ): Promise<ApiResponse<{ path: string; url: string }>> {
    try {
      // Validate image format
      if (!file.type.startsWith("image/")) {
        return { error: "File must be an image" };
      }

      if (file.size > FILE_SIZE_LIMITS.THUMBNAIL_MAX) {
        return {
          error: `Image too large. Maximum size: ${FILE_SIZE_LIMITS.THUMBNAIL_MAX / 1024 / 1024}MB`,
        };
      }

      const fileExtension = file.name.match(/\.[^.]+$/)?.[0] || ".png";
      const filePath = `${userId}/${assetId}_thumbnail${fileExtension}`;

      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.THUMBNAILS)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true, // Allow replacing existing thumbnails
        });

      if (error) {
        console.error("Upload error:", error);
        return { error: "Failed to upload thumbnail" };
      }

      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKETS.THUMBNAILS)
        .getPublicUrl(filePath);

      return {
        data: {
          path: data.path,
          url: urlData.publicUrl,
        },
      };
    } catch (error) {
      console.error("Unexpected error uploading thumbnail:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Upload texture file
   */
  async uploadTexture(
    userId: string,
    file: File,
    assetId: string,
    textureIndex: number = 0,
  ): Promise<ApiResponse<{ path: string; url: string }>> {
    try {
      // Validate texture format
      const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (!fileExtension || !ALLOWED_TEXTURE_FORMATS.includes(fileExtension)) {
        return {
          error: `Invalid texture format. Allowed: ${ALLOWED_TEXTURE_FORMATS.join(", ")}`,
        };
      }

      if (file.size > FILE_SIZE_LIMITS.TEXTURE_MAX) {
        return {
          error: `Texture too large. Maximum size: ${FILE_SIZE_LIMITS.TEXTURE_MAX / 1024 / 1024}MB`,
        };
      }

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${userId}/${assetId}_texture_${textureIndex}_${sanitizedName}`;

      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.TEXTURES)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return { error: "Failed to upload texture" };
      }

      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKETS.TEXTURES)
        .getPublicUrl(filePath);

      return {
        data: {
          path: data.path,
          url: urlData.publicUrl,
        },
      };
    } catch (error) {
      console.error("Unexpected error uploading texture:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await this.supabase.storage
        .from(STORAGE_BUCKETS[bucket])
        .remove([path]);

      if (error) {
        console.error("Delete error:", error);
        return { error: "Failed to delete file" };
      }

      return { data: true };
    } catch (error) {
      console.error("Unexpected error deleting file:", error);
      return { error: "Unexpected error occurred" };
    }
  }

  /**
   * Extract file path from Supabase public URL
   */
  extractPathFromUrl(url: string, bucket: string): string | null {
    const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
    const match = url.match(pattern);
    return match ? match[1] : null;
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const match = filename.toLowerCase().match(/\.[^.]+$/);
    return match ? match[0] : "";
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  }
}
