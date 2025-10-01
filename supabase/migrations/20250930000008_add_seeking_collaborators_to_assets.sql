-- Add seeking_collaborators flag to assets table
-- Allows modelers and illustrators to signal they want their work used in collaborative projects

ALTER TABLE assets
ADD COLUMN IF NOT EXISTS seeking_collaborators BOOLEAN DEFAULT FALSE;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_assets_seeking_collaborators
ON assets(seeking_collaborators)
WHERE seeking_collaborators = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN assets.seeking_collaborators IS 'Whether the creator wants this asset used in collaborative projects and is open to revenue-sharing opportunities';
