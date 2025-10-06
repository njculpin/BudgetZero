-- Phase 3: Enhance assets table for illustration support
-- Add illustration-specific fields to complement existing model fields

-- Add illustration-specific columns to assets table
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS illustration_type TEXT CHECK (illustration_type IN (
  'character_art',
  'scene',
  'map',
  'icon',
  'token',
  'card_art',
  'cover_art',
  'diagram',
  'sketch',
  'concept_art',
  'other'
)),
ADD COLUMN IF NOT EXISTS is_vector BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_transparency BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS color_mode TEXT CHECK (color_mode IN ('rgb', 'cmyk', 'grayscale', 'monochrome')),
ADD COLUMN IF NOT EXISTS dpi INTEGER,
ADD COLUMN IF NOT EXISTS art_style TEXT, -- e.g., 'realistic', 'cartoon', 'pixel-art', 'watercolor'
ADD COLUMN IF NOT EXISTS subject_matter TEXT[] DEFAULT '{}', -- e.g., ['dragon', 'knight', 'castle']
ADD COLUMN IF NOT EXISTS is_print_ready BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN assets.illustration_type IS 'Type of illustration (character art, scene, map, icon, etc.)';
COMMENT ON COLUMN assets.is_vector IS 'Whether the illustration is vector-based (SVG, AI, EPS) vs raster';
COMMENT ON COLUMN assets.has_transparency IS 'Whether the illustration has transparent areas (alpha channel)';
COMMENT ON COLUMN assets.color_mode IS 'Color mode of the illustration (RGB, CMYK, grayscale, monochrome)';
COMMENT ON COLUMN assets.dpi IS 'Resolution in dots per inch (for raster images)';
COMMENT ON COLUMN assets.art_style IS 'Artistic style (realistic, cartoon, pixel-art, watercolor, etc.)';
COMMENT ON COLUMN assets.subject_matter IS 'Array of subjects depicted (dragon, knight, castle, etc.)';
COMMENT ON COLUMN assets.is_print_ready IS 'Whether illustration is high-res and suitable for print';

-- Create indexes for illustration discovery
CREATE INDEX IF NOT EXISTS idx_assets_illustration_type ON assets(illustration_type) WHERE asset_type = 'illustration';
CREATE INDEX IF NOT EXISTS idx_assets_is_vector ON assets(is_vector) WHERE asset_type = 'illustration';
CREATE INDEX IF NOT EXISTS idx_assets_print_ready ON assets(is_print_ready) WHERE asset_type = 'illustration' AND is_print_ready = TRUE;
CREATE INDEX IF NOT EXISTS idx_assets_art_style ON assets(art_style) WHERE asset_type = 'illustration';

-- Add illustration support to asset_files table (already exists, just document usage)
COMMENT ON TABLE asset_files IS 'Supporting files for assets. For illustrations: primary (main image), thumbnail, preview, source files (PSD, AI), and alternative formats (PNG, SVG, PDF)';
