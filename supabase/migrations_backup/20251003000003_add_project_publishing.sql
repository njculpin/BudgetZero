-- Add publishing status to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_all_owner_approval BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create publication approvals table for co-owner consent
CREATE TABLE IF NOT EXISTS project_publication_approvals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  collaborator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, collaborator_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_publication_approvals_project ON project_publication_approvals(project_id);

-- Enable RLS
ALTER TABLE project_publication_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view publication approvals for their projects"
  ON project_publication_approvals FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE creator_id = auth.uid()
    )
    OR collaborator_id = auth.uid()
  );

CREATE POLICY "Collaborators can approve publication"
  ON project_publication_approvals FOR INSERT
  WITH CHECK (collaborator_id = auth.uid());

CREATE POLICY "Collaborators can update own approval"
  ON project_publication_approvals FOR UPDATE
  USING (collaborator_id = auth.uid());

-- Function to check if project is ready to publish
CREATE OR REPLACE FUNCTION can_publish_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_pricing BOOLEAN;
  v_has_content BOOLEAN;
  v_all_approved BOOLEAN;
  v_requires_approval BOOLEAN;
BEGIN
  -- Check if project has at least one pricing tier
  SELECT EXISTS(
    SELECT 1 FROM pricing_tiers WHERE project_id = p_project_id
  ) INTO v_has_pricing;

  -- Check if project has content (assets or documents)
  SELECT EXISTS(
    SELECT 1 FROM project_assets WHERE project_id = p_project_id
    UNION
    SELECT 1 FROM documents WHERE project_id = p_project_id
  ) INTO v_has_content;

  -- Check if project requires approval
  SELECT requires_all_owner_approval INTO v_requires_approval
  FROM projects WHERE id = p_project_id;

  -- If requires approval, check if all co-owners approved
  IF v_requires_approval THEN
    SELECT COALESCE(
      (
        SELECT COUNT(*) = COUNT(*) FILTER (WHERE approved = TRUE)
        FROM project_publication_approvals
        WHERE project_id = p_project_id
      ),
      FALSE
    ) INTO v_all_approved;
  ELSE
    v_all_approved := TRUE;
  END IF;

  RETURN v_has_pricing AND v_has_content AND v_all_approved;
END;
$$;

-- Function to publish project
CREATE OR REPLACE FUNCTION publish_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_can_publish BOOLEAN;
BEGIN
  -- Check if project can be published
  v_can_publish := can_publish_project(p_project_id);

  IF NOT v_can_publish THEN
    RAISE EXCEPTION 'Project does not meet publishing requirements';
  END IF;

  -- Update project status
  UPDATE projects
  SET
    status = 'published',
    published_at = NOW()
  WHERE id = p_project_id;

  -- Create notifications for all co-owners
  INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
  SELECT
    pc.collaborator_id,
    'asset_reference_approved',
    'Project Published',
    'Your collaborative project has been published to the marketplace!',
    '/projects/' || p_project_id,
    jsonb_build_object('project_id', p_project_id, 'action', 'published')
  FROM project_collaborators pc
  WHERE pc.project_id = p_project_id
    AND pc.is_active = TRUE;

  RETURN TRUE;
END;
$$;

COMMENT ON TABLE project_publication_approvals IS 'Co-owner approvals required before publishing project to marketplace';
COMMENT ON FUNCTION can_publish_project IS 'Validates if project meets all requirements for publication';
COMMENT ON FUNCTION publish_project IS 'Publishes project to marketplace and notifies co-owners';
