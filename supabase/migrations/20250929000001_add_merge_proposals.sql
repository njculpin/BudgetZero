-- Add merge status type
CREATE TYPE merge_status AS ENUM ('proposed', 'accepted', 'declined', 'completed');

-- Project merge proposals table for collaborative project creation
CREATE TABLE project_merge_proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  source_project_ids UUID[] NOT NULL,
  proposed_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  proposed_title TEXT NOT NULL CHECK (length(proposed_title) >= 1 AND length(proposed_title) <= 100),
  proposed_description TEXT,
  merge_status merge_status DEFAULT 'proposed' NOT NULL,
  revenue_split JSONB NOT NULL DEFAULT '{}', -- Maps user_id -> percentage
  merge_terms TEXT,
  requires_approval_from UUID[] NOT NULL DEFAULT '{}',
  approved_by UUID[] NOT NULL DEFAULT '{}',
  declined_by UUID[] NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_merge_proposals_target ON project_merge_proposals(target_project_id);
CREATE INDEX idx_merge_proposals_proposed_by ON project_merge_proposals(proposed_by);
CREATE INDEX idx_merge_proposals_status ON project_merge_proposals(merge_status);
CREATE INDEX idx_merge_proposals_approval ON project_merge_proposals USING GIN(requires_approval_from);

-- Updated_at trigger
CREATE TRIGGER update_project_merge_proposals_updated_at
  BEFORE UPDATE ON project_merge_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE project_merge_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_merge_proposals
-- Users can view proposals they're involved in
CREATE POLICY "Users can view proposals they're involved in" ON project_merge_proposals
  FOR SELECT USING (
    auth.uid() = proposed_by OR
    auth.uid() = ANY(requires_approval_from) OR
    target_project_id IN (
      SELECT id FROM game_projects WHERE creator_id = auth.uid()
    ) OR
    target_project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE collaborator_id = auth.uid()
      AND invitation_status = 'accepted'
      AND 'admin' = ANY(permissions)
    )
  );

-- Project creators can create merge proposals
CREATE POLICY "Project creators can create merge proposals" ON project_merge_proposals
  FOR INSERT WITH CHECK (
    auth.uid() = proposed_by AND
    (
      auth.uid() IN (
        SELECT creator_id FROM game_projects WHERE id = target_project_id
      ) OR
      auth.uid() IN (
        SELECT collaborator_id FROM project_collaborators
        WHERE project_id = target_project_id
        AND invitation_status = 'accepted'
        AND 'admin' = ANY(permissions)
      )
    )
  );

-- Users can update proposals they're involved in (for approvals/declines)
CREATE POLICY "Users can update proposals requiring their approval" ON project_merge_proposals
  FOR UPDATE USING (
    auth.uid() = ANY(requires_approval_from) OR
    auth.uid() = proposed_by
  );

-- Proposers can delete their own pending proposals
CREATE POLICY "Proposers can delete pending proposals" ON project_merge_proposals
  FOR DELETE USING (
    auth.uid() = proposed_by AND
    merge_status = 'proposed'
  );