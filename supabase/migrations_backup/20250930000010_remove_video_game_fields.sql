-- Remove video game and animation specific fields from assets table
-- These fields are not relevant for tabletop miniatures (STL/OBJ files)

-- Remove render_engine_tags (not needed for 3D printing)
ALTER TABLE assets
DROP COLUMN IF EXISTS render_engine_tags;

-- Remove is_rigged (not needed for 3D printing)
ALTER TABLE assets
DROP COLUMN IF EXISTS is_rigged;

-- Remove is_animated (not needed for 3D printing)
ALTER TABLE assets
DROP COLUMN IF EXISTS is_animated;

-- Comments
COMMENT ON COLUMN assets.is_game_ready IS 'Indicates if model is print-ready for tabletop games';
COMMENT ON COLUMN assets.is_textured IS 'Indicates if model includes texture files for painting reference';
