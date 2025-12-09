// Export generic upload utilities
export {
  uploadFile,
  deleteFile,
  getPublicUrl,
  createSignedUrl,
  listFiles,
  generateFilePath,
  validateFile,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
  ASSET_FILE_TYPES,
} from "./uploads";
export type { StorageBucket, UploadResult, UploadOptions } from "./uploads";

// Export product storage functions
export { uploadProductCover, deleteProductCover, uploadVariantImage } from "./products";