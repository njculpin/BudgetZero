-- Add position field to asset_files and asset_images for ordering
-- This allows users to reorder files and images in the asset editor

-- Add position to asset_files
ALTER TABLE asset_files
ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Add position to asset_images
ALTER TABLE asset_images
ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS asset_files_asset_id_position_idx ON asset_files(asset_id, position);
CREATE INDEX IF NOT EXISTS asset_images_asset_id_position_idx ON asset_images(asset_id, position);

-- Update existing records to have sequential positions
-- For asset_files
WITH ranked_files AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY created_at) - 1 AS new_position
  FROM asset_files
  WHERE deleted = FALSE
)
UPDATE asset_files
SET position = ranked_files.new_position
FROM ranked_files
WHERE asset_files.id = ranked_files.id;

-- For asset_images
WITH ranked_images AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY created_at) - 1 AS new_position
  FROM asset_images
  WHERE deleted = FALSE
)
UPDATE asset_images
SET position = ranked_images.new_position
FROM ranked_images
WHERE asset_images.id = ranked_images.id;
