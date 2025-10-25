-- =============================================
-- Migration: Add Asset Tags
-- Description: Create asset_tags table with RLS policies
-- Date: 2024-10-27
-- =============================================

-- Create asset_tags table
CREATE TABLE IF NOT EXISTS public.asset_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT asset_tags_value_length CHECK (char_length(value) <= 50)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_asset_tags_asset_id ON public.asset_tags(asset_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_asset_tags_value ON public.asset_tags(value) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_asset_tags_asset_value ON public.asset_tags(asset_id, value) WHERE deleted = false;

-- Enable RLS
ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view tags for published assets
CREATE POLICY "Tags for published assets are viewable by everyone"
    ON public.asset_tags FOR SELECT
    USING (
        deleted = false 
        AND EXISTS (
            SELECT 1 FROM public.assets 
            WHERE id = asset_tags.asset_id 
            AND status = 'published' 
            AND deleted = false
        )
    );

-- Users can view tags for their own assets
CREATE POLICY "Users can view tags for own assets"
    ON public.asset_tags FOR SELECT
    USING (
        deleted = false 
        AND EXISTS (
            SELECT 1 FROM public.assets 
            WHERE id = asset_tags.asset_id 
            AND user_id = auth.uid()
        )
    );

-- Users can insert tags for their own assets
CREATE POLICY "Users can insert tags for own assets"
    ON public.asset_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE id = asset_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update tags for their own assets
CREATE POLICY "Users can update tags for own assets"
    ON public.asset_tags FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE id = asset_id 
            AND user_id = auth.uid()
        )
    );

-- Users can delete tags for their own assets
CREATE POLICY "Users can delete tags for own assets"
    ON public.asset_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE id = asset_id 
            AND user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_asset_tags
    BEFORE UPDATE ON public.asset_tags
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comment to table
COMMENT ON TABLE public.asset_tags IS 'Tags/keywords for categorizing and searching assets';
COMMENT ON COLUMN public.asset_tags.value IS 'Tag value, max 50 characters, used for categorization';
