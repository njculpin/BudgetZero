-- Create project_forks table for tracking fork/merge requests between projects
CREATE TABLE project_forks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_project_id UUID NOT NULL REFERENCES game_projects(id) ON DELETE CASCADE,
  child_project_id UUID NOT NULL REFERENCES game_projects(id) ON DELETE CASCADE,
  fork_type TEXT NOT NULL CHECK (fork_type IN ('merge', 'reference')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  message TEXT,
  UNIQUE(parent_project_id, child_project_id),
  CHECK (parent_project_id != child_project_id)
);

CREATE INDEX idx_project_forks_parent ON project_forks(parent_project_id);
CREATE INDEX idx_project_forks_child ON project_forks(child_project_id);
CREATE INDEX idx_project_forks_requested_by ON project_forks(requested_by);
CREATE INDEX idx_project_forks_status ON project_forks(status) WHERE status = 'pending';

-- Create collaborative_projects table for merged projects
CREATE TABLE collaborative_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  source_project_ids UUID[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'published', 'archived')),
  revenue_split JSONB NOT NULL DEFAULT '{}',
  requires_unanimous_approval BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collaborative_projects_slug ON collaborative_projects(slug);
CREATE INDEX idx_collaborative_projects_status ON collaborative_projects(status);
CREATE INDEX idx_collaborative_projects_created_by ON collaborative_projects(created_by);

-- Create collaborative_project_approvals table for tracking approvals
CREATE TABLE collaborative_project_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborative_project_id UUID NOT NULL REFERENCES collaborative_projects(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES profiles(id),
  approved BOOLEAN,
  approved_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collaborative_project_id, approver_id)
);

CREATE INDEX idx_collab_approvals_project ON collaborative_project_approvals(collaborative_project_id);
CREATE INDEX idx_collab_approvals_approver ON collaborative_project_approvals(approver_id);

-- Create collaborative_project_members table for co-owners
CREATE TABLE collaborative_project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborative_project_id UUID NOT NULL REFERENCES collaborative_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  source_project_id UUID REFERENCES game_projects(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'contributor')),
  revenue_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collaborative_project_id, user_id),
  CHECK (revenue_percentage >= 0 AND revenue_percentage <= 100)
);

CREATE INDEX idx_collab_members_project ON collaborative_project_members(collaborative_project_id);
CREATE INDEX idx_collab_members_user ON collaborative_project_members(user_id);

-- Enable RLS
ALTER TABLE project_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_project_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_project_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_forks

-- Users can view fork requests for their own projects
CREATE POLICY "Users can view fork requests for their projects"
  ON project_forks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_forks.parent_project_id
      AND game_projects.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_forks.child_project_id
      AND game_projects.creator_id = auth.uid()
    )
    OR requested_by = auth.uid()
  );

-- Project creators can create fork requests
CREATE POLICY "Project creators can create fork requests"
  ON project_forks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_forks.parent_project_id
      AND game_projects.creator_id = auth.uid()
    )
  );

-- Project creators can respond to fork requests
CREATE POLICY "Project creators can respond to fork requests"
  ON project_forks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_forks.child_project_id
      AND game_projects.creator_id = auth.uid()
    )
  );

-- Users can delete their own fork requests if still pending
CREATE POLICY "Users can delete pending fork requests"
  ON project_forks
  FOR DELETE
  USING (
    requested_by = auth.uid()
    AND status = 'pending'
  );

-- RLS Policies for collaborative_projects

-- Anyone can view published collaborative projects
CREATE POLICY "Anyone can view published collaborative projects"
  ON collaborative_projects
  FOR SELECT
  USING (
    status = 'published'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborative_project_members
      WHERE collaborative_project_members.collaborative_project_id = collaborative_projects.id
      AND collaborative_project_members.user_id = auth.uid()
    )
  );

-- Users can create collaborative projects
CREATE POLICY "Users can create collaborative projects"
  ON collaborative_projects
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Members can update their collaborative projects
CREATE POLICY "Members can update collaborative projects"
  ON collaborative_projects
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborative_project_members
      WHERE collaborative_project_members.collaborative_project_id = collaborative_projects.id
      AND collaborative_project_members.user_id = auth.uid()
      AND collaborative_project_members.role = 'owner'
    )
  );

-- RLS Policies for collaborative_project_approvals

-- Members can view approvals for their collaborative projects
CREATE POLICY "Members can view approvals"
  ON collaborative_project_approvals
  FOR SELECT
  USING (
    approver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborative_project_members
      WHERE collaborative_project_members.collaborative_project_id = collaborative_project_approvals.collaborative_project_id
      AND collaborative_project_members.user_id = auth.uid()
    )
  );

-- Members can approve/reject
CREATE POLICY "Members can approve or reject"
  ON collaborative_project_approvals
  FOR ALL
  USING (approver_id = auth.uid())
  WITH CHECK (approver_id = auth.uid());

-- RLS Policies for collaborative_project_members

-- Members can view other members
CREATE POLICY "Members can view other members"
  ON collaborative_project_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM collaborative_project_members cpm
      WHERE cpm.collaborative_project_id = collaborative_project_members.collaborative_project_id
      AND cpm.user_id = auth.uid()
    )
  );

-- Project creator can manage members
CREATE POLICY "Project creator can manage members"
  ON collaborative_project_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collaborative_projects
      WHERE collaborative_projects.id = collaborative_project_members.collaborative_project_id
      AND collaborative_projects.created_by = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_collaborative_projects_updated_at
  BEFORE UPDATE ON collaborative_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE project_forks IS 'Tracks fork/merge requests between projects';
COMMENT ON TABLE collaborative_projects IS 'Merged projects with multiple co-owners';
COMMENT ON TABLE collaborative_project_approvals IS 'Tracks approval status for publishing collaborative projects';
COMMENT ON TABLE collaborative_project_members IS 'Co-owners and contributors of collaborative projects';