/**
 * Product Storage Functions
 *
 * Handles uploading product cover images to Supabase storage.
 * All Supabase Storage SDK interactions are isolated to this storage layer.
 */

import { storageClient } from './client';

const PRODUCT_IMAGES_BUCKET = 'product-images';

export interface UploadResult {
  path: string;
  url: string;
  size: number;
}

/**
 * Upload a product cover image
 *
 * @param file - The image file to upload
 * @param userId - ID of the user uploading
 * @param productId - ID of the product
 * @returns Upload result with path and public URL
 */
export async function uploadProductCover(
  file: File,
  userId: string,
  productId: string
): Promise<UploadResult | null> {
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-cover-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${productId}/${fileName}`;

    // Upload file
    const { data, error } = await storageClient
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading product cover:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = storageClient
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
      size: file.size,
    };
  } catch (error) {
    console.error('Error in uploadProductCover:', error);
    return null;
  }
}

/**
 * Delete a product cover image
 *
 * @param filePath - The storage path of the file to delete
 * @returns Success boolean
 */
export async function deleteProductCover(filePath: string): Promise<boolean> {
  try {
    const { error } = await storageClient
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting product cover:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProductCover:', error);
    return false;
  }
}

/**
 * Upload a variant image
 *
 * @param file - The image file to upload
 * @param userId - ID of the user uploading
 * @param productId - ID of the product
 * @param variantId - ID of the variant
 * @returns Upload result with path and public URL
 */
export async function uploadVariantImage(
  file: File,
  userId: string,
  productId: string,
  variantId: string
): Promise<UploadResult | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${variantId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${productId}/variants/${fileName}`;

    const { data, error } = await storageClient
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading variant image:', error);
      return null;
    }

    const { data: urlData } = storageClient
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
      size: file.size,
    };
  } catch (error) {
    console.error('Error in uploadVariantImage:', error);
    return null;
  }
}
