-- Phase 2: Enhance assets table for 3D model support
-- Add model-specific fields and supporting tables

-- Add model-specific columns to assets table
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS polygon_count INTEGER,
ADD COLUMN IF NOT EXISTS vertex_count INTEGER,
ADD COLUMN IF NOT EXISTS is_rigged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_animated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_textured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_game_ready BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scale_unit TEXT CHECK (scale_unit IN ('mm', 'cm', 'm', 'inch')),
ADD COLUMN IF NOT EXISTS print_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS render_engine_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS model_category TEXT;

-- Add comments for documentation
COMMENT ON COLUMN assets.polygon_count IS '3D model polygon count for performance reference';
COMMENT ON COLUMN assets.vertex_count IS '3D model vertex count';
COMMENT ON COLUMN assets.is_rigged IS 'Whether the model has a skeleton/armature for animation';
COMMENT ON COLUMN assets.is_animated IS 'Whether the model includes animations';
COMMENT ON COLUMN assets.is_textured IS 'Whether the model includes textures/materials';
COMMENT ON COLUMN assets.is_game_ready IS 'Whether model is optimized for game engines';
COMMENT ON COLUMN assets.scale_unit IS 'Default scale unit for the model';
COMMENT ON COLUMN assets.print_settings IS 'JSON object with 3D printing settings (layer height, infill, supports, etc.)';
COMMENT ON COLUMN assets.render_engine_tags IS 'Compatible render engines (Unity, Unreal, Blender, etc.)';
COMMENT ON COLUMN assets.model_category IS 'Model category (miniature, terrain, token, vehicle, etc.)';

-- Create asset_files table for multi-file support (model + textures + materials)
CREATE TABLE IF NOT EXISTS asset_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('primary', 'texture', 'material', 'thumbnail', 'preview', 'additional')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_format TEXT,
  file_size_bytes BIGINT,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE asset_files IS 'Supporting files for assets (textures, materials, additional formats)';
COMMENT ON COLUMN asset_files.file_type IS 'Type of file: primary (main model), texture, material, thumbnail, preview, or additional';
COMMENT ON COLUMN asset_files.display_order IS 'Order for displaying multiple files (e.g., image gallery)';

-- Create indexes for model discovery and performance
CREATE INDEX IF NOT EXISTS idx_assets_model_category ON assets(model_category) WHERE asset_type = 'model';
CREATE INDEX IF NOT EXISTS idx_assets_polygon_count ON assets(polygon_count) WHERE asset_type = 'model';
CREATE INDEX IF NOT EXISTS idx_assets_game_ready ON assets(is_game_ready) WHERE asset_type = 'model' AND is_game_ready = TRUE;
CREATE INDEX IF NOT EXISTS idx_assets_price ON assets(price_cents) WHERE asset_type = 'model';
CREATE INDEX IF NOT EXISTS idx_assets_creator ON assets(creator_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_public ON assets(is_public, asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_files_asset_id ON asset_files(asset_id);

-- RLS policies for asset_files
ALTER TABLE asset_files ENABLE ROW LEVEL SECURITY;

-- Public asset files are viewable
CREATE POLICY "Public asset files are viewable" ON asset_files
  FOR SELECT USING (
    asset_id IN (SELECT id FROM assets WHERE is_public = TRUE)
  );

-- Asset creators can manage their asset files
CREATE POLICY "Asset creators can manage asset files" ON asset_files
  FOR ALL USING (
    asset_id IN (SELECT id FROM assets WHERE creator_id = auth.uid())
  );

-- Create function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(asset_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE assets
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = asset_id;
END;
$$;

-- Create function to increment usage count (when added to project)
CREATE OR REPLACE FUNCTION increment_usage_count(asset_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE assets
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = asset_id;
END;
$$;

-- Add trigger to update usage_count when asset is added to project
CREATE OR REPLACE FUNCTION update_asset_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM increment_usage_count(NEW.asset_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_asset_added
  AFTER INSERT ON project_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_usage_count();

-- Update updated_at timestamp trigger for assets (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assets_updated_at') THEN
    CREATE TRIGGER update_assets_updated_at
      BEFORE UPDATE ON assets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;