-- Fix asset storage RLS policies to match product-images pattern
-- Drop existing policies and recreate with proper TO clauses

-- Drop existing asset-files policies
DROP POLICY IF EXISTS "Users can upload files to their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files for published assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own asset files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own asset files" ON storage.objects;

-- Drop existing asset-images policies
DROP POLICY IF EXISTS "Users can upload images to their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view asset images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own asset images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own asset images" ON storage.objects;

-- Recreate asset-files policies with TO clauses
CREATE POLICY "Users can upload files to their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'asset-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view files for published assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asset-files');

CREATE POLICY "Users can update their own asset files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'asset-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own asset files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'asset-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Recreate asset-images policies with TO clauses
CREATE POLICY "Users can upload images to their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'asset-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view asset images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asset-images');

CREATE POLICY "Users can update their own asset images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'asset-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own asset images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'asset-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
