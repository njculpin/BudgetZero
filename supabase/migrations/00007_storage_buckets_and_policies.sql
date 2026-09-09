-- Storage bucket and policy corrections
--
-- Two problems are fixed here:
--
--  1. Missing bucket. Document attachments were being written to a bucket that no
--     migration ever created, so the upload silently failed and the attachment was
--     unreachable. Product files had the same defect against `asset-files`; the code
--     now targets `product-files`, which 00006 already creates.
--
--  2. Unscoped ownership policies. The policies named "Users can update/delete own
--     ..." in 00006 only tested `bucket_id`, with no check of who owns the object.
--     Any authenticated user could overwrite or delete every product image and every
--     avatar on the platform. Uploads were equally unscoped.
--
-- Object paths are generated as `{user_id}/{prefix}/{filename}` by
-- `generateFilePath()` in src/lib/storage/uploads.ts, so the first path segment is
-- the owning user and is what these policies check.

-- ============================================
-- 1. DOCUMENT ATTACHMENTS BUCKET
-- ============================================

-- Private: attachments belong to collaborative documents and are served through
-- signed URLs after a collaborator check, never read directly by the client.
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-attachments', 'document-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. REPLACE UNSCOPED OWNERSHIP POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload product files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Product files (private) --------------------------------------------------------

CREATE POLICY "Users can upload own product files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own product files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own product files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: no SELECT policy for product-files. Reads go through the service role in
-- /api/download, which verifies purchase before minting a short-lived signed URL.
-- The "Service role can manage product files" policy from 00006 still covers that.

-- Product images (public read) ----------------------------------------------------

CREATE POLICY "Users can upload own product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- User avatars (public read) ------------------------------------------------------

CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Document attachments (private) --------------------------------------------------

CREATE POLICY "Users can upload own document attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own document attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'document-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own document attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can manage document attachments"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'document-attachments');
