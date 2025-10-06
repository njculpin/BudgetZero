-- Create pricing tiers table
-- Allows projects to have multiple pricing tiers with different asset inclusions

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_price CHECK (price_cents >= 0)
);

-- Create tier asset inclusions table
-- Defines which assets are included in each pricing tier

CREATE TABLE IF NOT EXISTS pricing_tier_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tier_id, asset_id)
);

-- Create tier document inclusions table
-- Defines which documents are included in each pricing tier

CREATE TABLE IF NOT EXISTS pricing_tier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tier_id, document_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_project_id ON pricing_tiers(project_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_active ON pricing_tiers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_tier_assets_tier ON pricing_tier_assets(tier_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_assets_asset ON pricing_tier_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_documents_tier ON pricing_tier_documents(tier_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_documents_document ON pricing_tier_documents(document_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_pricing_tier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_tier_updated_at();

-- Enable RLS
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tier_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tier_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_tiers
CREATE POLICY "Anyone can view active pricing tiers for public projects"
  ON pricing_tiers FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pricing_tiers.project_id
      AND projects.is_public = true
    )
  );

CREATE POLICY "Project owners can manage their pricing tiers"
  ON pricing_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = pricing_tiers.project_id
      AND projects.creator_id = auth.uid()
    )
  );

-- RLS Policies for pricing_tier_assets
CREATE POLICY "Anyone can view tier assets for public projects"
  ON pricing_tier_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pricing_tiers pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = pricing_tier_assets.tier_id
      AND pt.is_active = true
      AND p.is_public = true
    )
  );

CREATE POLICY "Project owners can manage their tier assets"
  ON pricing_tier_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pricing_tiers pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = pricing_tier_assets.tier_id
      AND p.creator_id = auth.uid()
    )
  );

-- RLS Policies for pricing_tier_documents
CREATE POLICY "Anyone can view tier documents for public projects"
  ON pricing_tier_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pricing_tiers pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = pricing_tier_documents.tier_id
      AND pt.is_active = true
      AND p.is_public = true
    )
  );

CREATE POLICY "Project owners can manage their tier documents"
  ON pricing_tier_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pricing_tiers pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = pricing_tier_documents.tier_id
      AND p.creator_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE pricing_tiers IS 'Pricing tiers for projects with multiple price points';
COMMENT ON TABLE pricing_tier_assets IS 'Assets included in each pricing tier';
COMMENT ON TABLE pricing_tier_documents IS 'Documents included in each pricing tier';
COMMENT ON COLUMN pricing_tiers.display_order IS 'Order in which tiers should be displayed (lower = first)';
COMMENT ON COLUMN pricing_tiers.price_cents IS 'Price in cents (e.g., 2999 = $29.99)';
