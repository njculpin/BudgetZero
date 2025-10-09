-- Add asset_type enum and field to assets table
CREATE TYPE asset_type AS ENUM ('model', 'illustration', 'audio', 'texture', 'animation', 'other');

-- Add asset_type column to assets table
ALTER TABLE assets
ADD COLUMN asset_type asset_type DEFAULT 'other';

-- Create index for performance
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
