-- Create jam-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('jam-images', 'jam-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for jam-images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload jam images'
  ) THEN
    CREATE POLICY "Authenticated users can upload jam images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'jam-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Anyone can view jam images'
  ) THEN
    CREATE POLICY "Anyone can view jam images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'jam-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update own jam images'
  ) THEN
    CREATE POLICY "Users can update own jam images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'jam-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete own jam images'
  ) THEN
    CREATE POLICY "Users can delete own jam images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'jam-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
