-- Phase 0: Unified Projects Migration (UP)
-- This migration transforms game_projects into a unified projects table
-- that supports multiple project types: game, model, illustration

-- STEP 1: Create new unified projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 1000),
  slug TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- NEW: Project type discriminator
  project_type TEXT NOT NULL CHECK (project_type IN ('game', 'model', 'illustration')),

  status project_status DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  license_type license_type DEFAULT 'free',
  license_terms TEXT,
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),

  -- Game-specific fields (nullable for non-game projects)
  genre TEXT,
  player_count_min INTEGER CHECK (player_count_min > 0),
  player_count_max INTEGER CHECK (player_count_max >= player_count_min),
  play_time_minutes INTEGER CHECK (play_time_minutes > 0),
  complexity_rating INTEGER CHECK (complexity_rating >= 1 AND complexity_rating <= 5),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Migrate data from game_projects to projects
INSERT INTO projects (
  id, title, description, slug, creator_id, project_type, status, is_public,
  cover_image_url, tags, license_type, license_terms, price_cents,
  genre, player_count_min, player_count_max, play_time_minutes, complexity_rating,
  created_at, updated_at
)
SELECT
  id, title, description, slug, creator_id, 'game' as project_type, status, is_public,
  cover_image_url, tags, license_type, license_terms, price_cents,
  genre, player_count_min, player_count_max, play_time_minutes, complexity_rating,
  created_at, updated_at
FROM game_projects;

-- STEP 3: Update foreign key references

-- Update project_collaborators to reference projects instead of game_projects
ALTER TABLE project_collaborators DROP CONSTRAINT project_collaborators_project_id_fkey;
ALTER TABLE project_collaborators
  ADD CONSTRAINT project_collaborators_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Update rulebooks to reference projects
ALTER TABLE rulebooks DROP CONSTRAINT rulebooks_project_id_fkey;
ALTER TABLE rulebooks
  ADD CONSTRAINT rulebooks_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Update project_assets to reference projects
ALTER TABLE project_assets DROP CONSTRAINT project_assets_project_id_fkey;
ALTER TABLE project_assets
  ADD CONSTRAINT project_assets_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Update activities to reference projects
ALTER TABLE activities DROP CONSTRAINT activities_project_id_fkey;
ALTER TABLE activities
  ADD CONSTRAINT activities_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- STEP 4: Add royalty support to assets
ALTER TABLE assets
  ADD COLUMN royalty_percentage INTEGER DEFAULT 0
  CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50);

COMMENT ON COLUMN assets.royalty_percentage IS
  'Percentage of revenue the asset creator receives when their asset is referenced in another project';

-- STEP 5: Create project_asset_references for attribution tracking
CREATE TABLE project_asset_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  royalty_percentage INTEGER NOT NULL CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, asset_id)
);

CREATE INDEX idx_project_asset_references_project ON project_asset_references(project_id);
CREATE INDEX idx_project_asset_references_asset ON project_asset_references(asset_id);
CREATE INDEX idx_project_asset_references_status ON project_asset_references(status) WHERE status = 'pending';

COMMENT ON TABLE project_asset_references IS
  'Tracks asset references between projects with royalty agreements and approval status';

-- STEP 6: Drop fork system tables (conflicts with vision)
-- Must drop in correct order due to foreign key dependencies
DROP TABLE IF EXISTS collaborative_project_approvals CASCADE;
DROP TABLE IF EXISTS collaborative_project_members CASCADE;
DROP TABLE IF EXISTS collaborative_projects CASCADE;
DROP TABLE IF EXISTS project_forks CASCADE;

-- STEP 7: Create indexes for projects table
CREATE INDEX idx_projects_creator_id ON projects(creator_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_type_status ON projects(project_type, status);

-- STEP 8: Add updated_at trigger
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 9: Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_asset_references ENABLE ROW LEVEL SECURITY;

-- STEP 10: Create RLS policies for projects (same as game_projects)
CREATE POLICY "Public projects are viewable by everyone" ON projects
  FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Collaborators can view projects" ON projects
  FOR SELECT USING (
    auth.uid() IN (
      SELECT collaborator_id FROM project_collaborators
      WHERE project_id = projects.id
      AND invitation_status = 'accepted'
      AND is_active = true
    )
  );

CREATE POLICY "Project creators can manage their projects" ON projects
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- STEP 11: Create RLS policies for project_asset_references
CREATE POLICY "Users can view asset references for their projects" ON project_asset_references
  FOR SELECT USING (
    -- Project owner can see
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_asset_references.project_id
      AND projects.creator_id = auth.uid()
    )
    OR
    -- Asset owner can see
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = project_asset_references.asset_id
      AND assets.creator_id = auth.uid()
    )
    OR
    -- Requester can see
    requested_by = auth.uid()
  );

CREATE POLICY "Project creators can create asset references" ON project_asset_references
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_asset_references.project_id
      AND projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Asset owners can respond to asset references" ON project_asset_references
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = project_asset_references.asset_id
      AND assets.creator_id = auth.uid()
    )
  );

-- STEP 12: Drop old game_projects table
DROP TABLE IF EXISTS game_projects CASCADE;

-- STEP 13: Add validation comment
COMMENT ON TABLE projects IS
  'Unified table for all project types (game, model, illustration). Replaces game_projects.';

-- Migration complete!
-- Total changes:
-- ✅ Created unified projects table
-- ✅ Migrated all game_projects data
-- ✅ Updated foreign key references
-- ✅ Added royalty_percentage to assets
-- ✅ Created project_asset_references for attribution
-- ✅ Removed fork system (4 tables)
-- ✅ Created indexes and RLS policies
