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

// Product image writes go through uploadFile() above, with the caller's access
// token. Storage RLS scopes writes by auth.uid(), so any helper using the
// unauthenticated storageClient would have its inserts rejected.