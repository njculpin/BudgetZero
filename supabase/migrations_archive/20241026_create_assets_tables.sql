-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'public', 'archived')),
    download_count INTEGER DEFAULT 0 NOT NULL,
    total_size_bytes BIGINT DEFAULT 0 NOT NULL,
    file_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create asset_files table
CREATE TABLE IF NOT EXISTS public.asset_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Create asset_images table
CREATE TABLE IF NOT EXISTS public.asset_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets table
-- Anyone can view public, non-deleted assets
CREATE POLICY "public assets are viewable by everyone"
    ON public.assets
    FOR SELECT
    USING (status = 'public' AND deleted = false);

-- Owners can view their own assets (all statuses)
CREATE POLICY "Users can view own assets"
    ON public.assets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own assets
CREATE POLICY "Users can create own assets"
    ON public.assets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own assets
CREATE POLICY "Users can update own assets"
    ON public.assets
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own assets (soft delete)
CREATE POLICY "Users can delete own assets"
    ON public.assets
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for asset_files table
-- Anyone can view files for public assets
CREATE POLICY "Asset files are viewable for public assets"
    ON public.asset_files
    FOR SELECT
    USING (
        deleted = false AND
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.status = 'public'
            AND assets.deleted = false
        )
    );

-- Owners can view their own asset files
CREATE POLICY "Users can view own asset files"
    ON public.asset_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- Users can insert files for their own assets
CREATE POLICY "Users can create files for own assets"
    ON public.asset_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- Users can update their own asset files
CREATE POLICY "Users can update own asset files"
    ON public.asset_files
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- Users can delete their own asset files
CREATE POLICY "Users can delete own asset files"
    ON public.asset_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- RLS Policies for asset_images table (same pattern as asset_files)
CREATE POLICY "Asset images are viewable for public assets"
    ON public.asset_images
    FOR SELECT
    USING (
        deleted = false AND
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.status = 'public'
            AND assets.deleted = false
        )
    );

CREATE POLICY "Users can view own asset images"
    ON public.asset_images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create images for own assets"
    ON public.asset_images
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own asset images"
    ON public.asset_images
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own asset images"
    ON public.asset_images
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS assets_handle_idx ON public.assets(handle);
CREATE INDEX IF NOT EXISTS assets_status_idx ON public.assets(status);
CREATE INDEX IF NOT EXISTS asset_files_asset_id_idx ON public.asset_files(asset_id);
CREATE INDEX IF NOT EXISTS asset_images_asset_id_idx ON public.asset_images(asset_id);

-- Create updated_at triggers for all tables
CREATE TRIGGER set_updated_at_assets
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_files
    BEFORE UPDATE ON public.asset_files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_asset_images
    BEFORE UPDATE ON public.asset_images
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create storage buckets for asset files and images
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-files', 'asset-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-images', 'asset-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for asset-files bucket
CREATE POLICY "Users can upload files to their own assets"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'asset-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view files for public assets"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'asset-files');

CREATE POLICY "Users can update their own asset files"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'asset-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own asset files"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'asset-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage RLS policies for asset-images bucket
CREATE POLICY "Users can upload images to their own assets"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'asset-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view asset images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'asset-images');

CREATE POLICY "Users can update their own asset images"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'asset-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own asset images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'asset-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
