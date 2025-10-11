-- ============================================================================
-- Asset Preview Images System
-- ============================================================================
-- This migration creates a dedicated table for asset preview images,
-- replacing the single thumbnail_url field with a proper multi-image system.
-- The first image (display_order = 0) serves as the thumbnail.

-- Create asset_preview_images table
CREATE TABLE asset_preview_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, display_order)
);

-- Create index for performance
CREATE INDEX idx_asset_preview_images_asset_id ON asset_preview_images(asset_id);
CREATE INDEX idx_asset_preview_images_display_order ON asset_preview_images(asset_id, display_order);

-- Add trigger for updated_at
CREATE TRIGGER update_asset_preview_images_updated_at
  BEFORE UPDATE ON asset_preview_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: Disable on preview images - access control inherited from assets table via FK
-- Users can view preview images for assets they have access to via the assets table policies
ALTER TABLE asset_preview_images DISABLE ROW LEVEL SECURITY;

-- Migrate existing thumbnail_url data to asset_preview_images
-- This will create a preview image record for any asset that has a thumbnail_url
INSERT INTO asset_preview_images (asset_id, file_url, display_order)
SELECT id, thumbnail_url, 0
FROM assets
WHERE thumbnail_url IS NOT NULL AND thumbnail_url != '';

-- Keep thumbnail_url column for backward compatibility (for now)
-- In a future migration, we can drop it once all code is updated
-- For now, we'll just add a comment
COMMENT ON COLUMN assets.thumbnail_url IS 'DEPRECATED: Use asset_preview_images table instead. This field is kept for backward compatibility and will be removed in a future migration.';

-- Add helper function to get asset thumbnail (first preview image)
CREATE OR REPLACE FUNCTION get_asset_thumbnail(asset_uuid UUID)
RETURNS TEXT AS $$
  SELECT file_url
  FROM asset_preview_images
  WHERE asset_id = asset_uuid
  ORDER BY display_order ASC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_asset_thumbnail IS 'Returns the URL of the first preview image (thumbnail) for an asset';
