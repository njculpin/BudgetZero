-- Migration: Add tags support to assets table
-- This replaces the rigid model_category system with flexible tags
-- Maintains backward compatibility during transition

-- Add tags column (array of text)
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create GIN index for efficient tag searching
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);

-- Create tag popularity tracking table
CREATE TABLE IF NOT EXISTS asset_tags (
  tag TEXT PRIMARY KEY,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on asset_tags
ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read tag statistics
CREATE POLICY "Anyone can read tag statistics"
  ON asset_tags
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Function to update tag counts
CREATE OR REPLACE FUNCTION update_asset_tag_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  tag_name TEXT;
BEGIN
  -- Decrement counts for removed tags
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    FOREACH tag_name IN ARRAY OLD.tags
    LOOP
      UPDATE asset_tags
      SET
        usage_count = GREATEST(usage_count - 1, 0),
        updated_at = NOW()
      WHERE tag = tag_name;
    END LOOP;
  END IF;

  -- Increment counts for added tags
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    FOREACH tag_name IN ARRAY NEW.tags
    LOOP
      INSERT INTO asset_tags (tag, usage_count, created_at, updated_at)
      VALUES (tag_name, 1, NOW(), NOW())
      ON CONFLICT (tag)
      DO UPDATE SET
        usage_count = asset_tags.usage_count + 1,
        updated_at = NOW();
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to maintain tag counts
DROP TRIGGER IF EXISTS asset_tags_update_trigger ON assets;
CREATE TRIGGER asset_tags_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_tag_counts();

-- Migrate existing model_category values to tags
-- This preserves existing data while adding the category as a tag
UPDATE assets
SET tags = ARRAY[
  model_category,
  CASE model_category
    -- Add semantic tags based on category
    WHEN 'miniature' THEN 'tabletop'
    WHEN 'terrain' THEN 'scenery'
    WHEN 'vehicle' THEN 'transport'
    WHEN 'creature' THEN 'monster'
    WHEN 'character' THEN 'hero'
    WHEN 'building' THEN 'structure'
    WHEN 'token' THEN 'marker'
    WHEN 'dice' THEN 'gaming'
    ELSE 'asset'
  END
]
WHERE tags = '{}' OR tags IS NULL;

-- Add comment to explain migration strategy
COMMENT ON COLUMN assets.tags IS 'Flexible tagging system replacing rigid model_category. Allows multiple overlapping classifications for better discoverability.';
COMMENT ON TABLE asset_tags IS 'Tracks tag popularity for search suggestions and analytics. Updated automatically via trigger.';
