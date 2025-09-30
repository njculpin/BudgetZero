-- Create storage buckets for Phase 2 model uploads

-- Models bucket (stores 3D model files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models',
  'models',
  true,
  524288000, -- 500MB
  ARRAY[
    'model/stl',
    'model/obj',
    'model/fbx',
    'model/gltf+json',
    'model/gltf-binary',
    'application/octet-stream',
    'application/x-tgif'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Thumbnails bucket (stores preview images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Previews bucket (stores additional preview images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'previews',
  'previews',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Textures bucket (stores texture files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'textures',
  'textures',
  true,
  52428800, -- 50MB
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/tga',
    'image/vnd.radiance',
    'image/x-tga',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for models bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload models to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own model files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own model files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all model files
CREATE POLICY "Public read access to models"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'models');

-- Storage policies for thumbnails bucket
CREATE POLICY "Users can upload thumbnails to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access to thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

-- Storage policies for previews bucket
CREATE POLICY "Users can upload previews to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'previews' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own previews"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'previews' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own previews"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'previews' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access to previews"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'previews');

-- Storage policies for textures bucket
CREATE POLICY "Users can upload textures to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'textures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own textures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'textures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own textures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'textures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access to textures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'textures');