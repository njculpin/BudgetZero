import { storageClient } from './client';

export interface UploadResult {
  path: string;
  url: string;
  size: number;
}

/**
 * Upload a file to the asset-files bucket
 * Path structure: {userId}/{assetId}/{filename}
 */
export const uploadAssetFile = async (
  file: File,
  userId: string,
  assetId: string
): Promise<UploadResult | null> => {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${userId}/${assetId}/${fileName}`;

  const { data, error } = await storageClient.storage
    .from('asset-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading asset file:', error);
    return null;
  }

  const { data: urlData } = storageClient.storage
    .from('asset-files')
    .getPublicUrl(filePath);

  return {
    path: data.path,
    url: urlData.publicUrl,
    size: file.size,
  };
};

/**
 * Upload an image to the asset-images bucket
 * Path structure: {userId}/{assetId}/{filename}
 */
export const uploadAssetImage = async (
  file: File,
  userId: string,
  assetId: string
): Promise<UploadResult | null> => {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${userId}/${assetId}/${fileName}`;

  const { data, error } = await storageClient.storage
    .from('asset-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading asset image:', error);
    return null;
  }

  const { data: urlData } = storageClient.storage
    .from('asset-images')
    .getPublicUrl(filePath);

  return {
    path: data.path,
    url: urlData.publicUrl,
    size: file.size,
  };
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (
  bucket: 'asset-files' | 'asset-images',
  filePath: string
): Promise<boolean> => {
  const { error } = await storageClient.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }

  return true;
};

/**
 * Get public URL for a storage file
 */
export const getPublicUrl = (
  bucket: 'asset-files' | 'asset-images',
  filePath: string
): string => {
  const { data } = storageClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * List files in a directory
 */
export const listFiles = async (
  bucket: 'asset-files' | 'asset-images',
  path: string
): Promise<string[]> => {
  const { data, error } = await storageClient.storage
    .from(bucket)
    .list(path);

  if (error) {
    console.error('Error listing files:', error);
    return [];
  }

  return data.map(file => file.name);
};

/**
 * Create a signed URL for secure file download
 * @param bucket - The storage bucket
 * @param filePath - Path to the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export const createSignedDownloadUrl = async (
  bucket: 'asset-files' | 'asset-images',
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  const { data, error } = await storageClient.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
};