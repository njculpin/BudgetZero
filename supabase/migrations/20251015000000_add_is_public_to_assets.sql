-- Add is_public column to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance on public asset queries
CREATE INDEX IF NOT EXISTS idx_assets_is_public ON assets(is_public) WHERE is_public = true;

-- Comment for documentation
COMMENT ON COLUMN assets.is_public IS 'Whether the asset is publicly visible to all users';
