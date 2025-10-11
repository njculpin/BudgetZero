-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  1073741824, -- 1GB
  ARRAY[
    -- Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    -- Documents
    'application/pdf',
    -- Archives
    'application/zip',
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
    -- 3D Models
    'model/gltf-binary',
    'model/gltf+json',
    -- Generic binary (for STL, OBJ, FBX, etc.)
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assets bucket
CREATE POLICY "Public assets are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
