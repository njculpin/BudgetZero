-- Add project relationship types for tracking project genealogy
CREATE TYPE project_relationship_type AS ENUM ('fork', 'merge', 'component');

-- Project relationships table for tracking project connections
CREATE TABLE project_relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  child_project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  relationship_type project_relationship_type NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_projects CHECK (parent_project_id != child_project_id)
);

-- Indexes for performance
CREATE INDEX idx_project_relationships_parent ON project_relationships(parent_project_id);
CREATE INDEX idx_project_relationships_child ON project_relationships(child_project_id);
CREATE INDEX idx_project_relationships_type ON project_relationships(relationship_type);

-- Updated_at trigger
CREATE TRIGGER update_project_relationships_updated_at
  BEFORE UPDATE ON project_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE project_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_relationships
-- Anyone can view relationships for public projects
CREATE POLICY "Users can view relationships for accessible projects" ON project_relationships
  FOR SELECT USING (
    parent_project_id IN (
      SELECT id FROM game_projects WHERE is_public = true OR creator_id = auth.uid()
    ) OR
    child_project_id IN (
      SELECT id FROM game_projects WHERE is_public = true OR creator_id = auth.uid()
    ) OR
    parent_project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE collaborator_id = auth.uid()
      AND invitation_status = 'accepted'
    ) OR
    child_project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE collaborator_id = auth.uid()
      AND invitation_status = 'accepted'
    )
  );

-- Project creators and admins can create relationships
CREATE POLICY "Project creators can create relationships" ON project_relationships
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT creator_id FROM game_projects WHERE id = parent_project_id
    ) OR
    auth.uid() IN (
      SELECT collaborator_id FROM project_collaborators
      WHERE project_id = parent_project_id
      AND invitation_status = 'accepted'
      AND 'admin' = ANY(permissions)
    )
  );

-- Project creators can delete relationships
CREATE POLICY "Project creators can delete relationships" ON project_relationships
  FOR DELETE USING (
    auth.uid() IN (
      SELECT creator_id FROM game_projects WHERE id = parent_project_id OR id = child_project_id
    )
  );