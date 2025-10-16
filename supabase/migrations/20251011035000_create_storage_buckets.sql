-- ============================================================================
-- Storage Buckets Configuration
-- Description: Create storage buckets for assets and configure RLS policies
-- ============================================================================

-- Create storage bucket for asset files (ZIP archives, images, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true, -- Public bucket for marketplace visibility
  1073741824, -- 1GB file size limit
  ARRAY[
    -- Images (for preview images)
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/heic',
    -- Documents
    'application/pdf',
    -- Archives (primary asset format)
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
    -- Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/flac',
    -- 3D Models and CAD
    'model/gltf-binary',
    'model/gltf+json',
    -- Generic binary (for STL, OBJ, FBX, etc.)
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assets bucket
CREATE POLICY "Anyone can view asset files"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own asset files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own asset files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
