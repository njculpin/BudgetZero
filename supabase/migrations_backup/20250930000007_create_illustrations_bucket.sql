-- Phase 3: Create storage bucket for illustrations

-- Illustrations bucket (stores illustration files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'illustrations',
  'illustrations',
  true,
  104857600, -- 100MB
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'image/vnd.adobe.photoshop',
    'application/postscript',
    'application/pdf',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for illustrations bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload illustrations to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'illustrations' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own illustration files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'illustrations' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own illustration files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'illustrations' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all illustration files
CREATE POLICY "Public read access to illustrations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'illustrations');
