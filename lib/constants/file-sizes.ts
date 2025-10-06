/**
 * File size limits and MIME type validation for asset uploads
 */

import type { AssetType } from "@/lib/types/database";

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  model: 500 * 1024 * 1024, // 500MB
  illustration: 100 * 1024 * 1024, // 100MB
  texture: 50 * 1024 * 1024, // 50MB
  photo: 10 * 1024 * 1024, // 10MB
  audio: 25 * 1024 * 1024, // 25MB
  THUMBNAIL_MAX: 5 * 1024 * 1024, // 5MB for thumbnails
} as const;

// Human-readable file size labels
export const FILE_SIZE_LABELS: Record<AssetType, string> = {
  model: "500MB",
  illustration: "100MB",
  texture: "50MB",
  photo: "10MB",
  audio: "25MB",
} as const;

// Allowed MIME types for each asset type
export const ALLOWED_MIME_TYPES: Record<AssetType, string[]> = {
  model: [
    "model/stl",
    "model/obj",
    "model/gltf+json",
    "model/gltf-binary",
    "application/octet-stream", // For .stl, .obj files often served as this
  ],
  illustration: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
    "application/pdf",
  ],
  texture: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tga",
    "image/bmp",
  ],
  photo: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ],
  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
  ],
} as const;

// File extensions for each asset type
export const ALLOWED_EXTENSIONS: Record<AssetType, string[]> = {
  model: [".stl", ".obj", ".gltf", ".glb"],
  illustration: [".png", ".jpg", ".jpeg", ".svg", ".pdf"],
  texture: [".png", ".jpg", ".jpeg", ".tga", ".bmp"],
  photo: [".png", ".jpg", ".jpeg", ".webp"],
  audio: [".mp3", ".wav", ".ogg", ".aac"],
} as const;

/**
 * Validate file size against asset type limits
 */
export function validateFileSize(
  fileSize: number,
  assetType: AssetType,
): { valid: boolean; error?: string } {
  const maxSize = FILE_SIZE_LIMITS[assetType as keyof typeof FILE_SIZE_LIMITS];
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${FILE_SIZE_LABELS[assetType]}`,
    };
  }
  return { valid: true };
}

/**
 * Validate MIME type against allowed types for asset
 */
export function validateMimeType(
  mimeType: string,
  assetType: AssetType,
): { valid: boolean; error?: string } {
  const allowedTypes = ALLOWED_MIME_TYPES[assetType];
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Expected: ${allowedTypes.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Validate file extension against allowed extensions for asset
 */
export function validateFileExtension(
  fileName: string,
  assetType: AssetType,
): { valid: boolean; error?: string } {
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  const allowedExtensions = ALLOWED_EXTENSIONS[assetType];

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Expected: ${allowedExtensions.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  file: File,
  assetType: AssetType,
): { valid: boolean; error?: string } {
  // Validate file size
  const sizeValidation = validateFileSize(file.size, assetType);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(file.type, assetType);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }

  // Validate file extension
  const extensionValidation = validateFileExtension(file.name, assetType);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  return { valid: true };
}
