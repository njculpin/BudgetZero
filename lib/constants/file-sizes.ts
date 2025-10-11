// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  THUMBNAIL_MAX: 5 * 1024 * 1024, // 5MB
  MODEL_MAX: 500 * 1024 * 1024, // 500MB
  ILLUSTRATION_MAX: 50 * 1024 * 1024, // 50MB
  PHOTO_MAX: 20 * 1024 * 1024, // 20MB
  AUDIO_MAX: 100 * 1024 * 1024, // 100MB
  ARCHIVE_MAX: 1024 * 1024 * 1024, // 1GB for compressed archives
};

// Allowed file extensions by asset type
export const ALLOWED_EXTENSIONS = {
  model: [".glb", ".gltf", ".obj", ".fbx", ".usdz", ".blend", ".stl"],
  illustration: [".svg", ".ai", ".eps", ".pdf"],
  photo: [".jpg", ".jpeg", ".png", ".webp", ".heic"],
  audio: [".mp3", ".wav", ".ogg", ".m4a", ".flac"],
  archive: [".zip", ".rar", ".7z", ".tar", ".gz"],
};
