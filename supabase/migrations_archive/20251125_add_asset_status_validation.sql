-- Implement 4-state asset status system: draft, private, public, archived
-- This replaces the previous 3-state system (draft, published, archived)

-- Step 1: Update CHECK constraint on assets table to support 4 states
ALTER TABLE assets
DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE assets
ADD CONSTRAINT assets_status_check
CHECK (status IN ('draft', 'private', 'public', 'archived'));

-- Step 2: Migrate existing 'published' assets to 'private' (safer default - keeps assets exclusive to owner)
-- This is a one-time data migration
UPDATE assets
SET status = 'private'
WHERE status = 'published';

-- Step 3: Create function to validate product publish based on asset status
-- Products can only be published if assets are 'private' OR 'public' (not draft/archived)
CREATE OR REPLACE FUNCTION validate_product_asset_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate when status is changing to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    -- Check if product has any assets that are NOT private or public
    IF EXISTS (
      SELECT 1
      FROM product_assets pa
      JOIN product_variants pv ON pv.id = pa.variant_id
      JOIN assets a ON a.id = pa.asset_id
      WHERE pv.product_id = NEW.id
        AND a.status NOT IN ('private', 'public')
        AND a.deleted = false
        AND pv.deleted = false
    ) THEN
      RAISE EXCEPTION 'Cannot publish product: one or more linked assets are not ready. Assets must have status = ''private'' or ''public'' (not draft or archived) before publishing the product.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger on products table
DROP TRIGGER IF EXISTS validate_product_asset_status_trigger ON products;

CREATE TRIGGER validate_product_asset_status_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_asset_status();

-- Step 5: Update RLS policies for private vs public asset visibility
-- Drop old policy that checked for 'published' status
DROP POLICY IF EXISTS "Published assets are viewable by everyone" ON public.assets;

-- Create new policy: Only PUBLIC assets are viewable by everyone
CREATE POLICY "Public assets are viewable by everyone"
    ON public.assets
    FOR SELECT
    USING (status = 'public' AND deleted = false);

-- Update policy for asset files (only viewable for public assets)
DROP POLICY IF EXISTS "Asset files are viewable for published assets" ON public.asset_files;

CREATE POLICY "Asset files are viewable for public assets"
    ON public.asset_files
    FOR SELECT
    USING (
        deleted = false AND
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_files.asset_id
            AND assets.status = 'public'
            AND assets.deleted = false
        )
    );

-- Update policy for asset images (only viewable for public assets)
DROP POLICY IF EXISTS "Asset images are viewable for published assets" ON public.asset_images;

CREATE POLICY "Asset images are viewable for public assets"
    ON public.asset_images
    FOR SELECT
    USING (
        deleted = false AND
        EXISTS (
            SELECT 1 FROM public.assets
            WHERE assets.id = asset_images.asset_id
            AND assets.status = 'public'
            AND assets.deleted = false
        )
    );

-- Step 6: Add comment explaining the validation
COMMENT ON FUNCTION validate_product_asset_status() IS
  'Validates that a product can only be published if all linked assets have status = ''private'' or ''public''. This ensures customers cannot purchase products with draft or archived assets. Private assets are exclusive to the owner, while public assets can be used in other users'' products.';
