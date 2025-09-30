-- Add RLS policies for project_assets table

-- Policy: Anyone can view project assets for projects they can view
CREATE POLICY "Users can view project assets for viewable projects"
  ON project_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_assets.project_id
      AND (
        game_projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = game_projects.id
          AND project_collaborators.collaborator_id = auth.uid()
          AND project_collaborators.invitation_status = 'accepted'
        )
      )
    )
  );

-- Policy: Project collaborators with write access can add assets
CREATE POLICY "Project collaborators can add assets"
  ON project_assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_assets.project_id
      AND (
        game_projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = game_projects.id
          AND project_collaborators.collaborator_id = auth.uid()
          AND project_collaborators.invitation_status = 'accepted'
          AND project_collaborators.role = 'editor'
        )
      )
    )
  );

-- Policy: Project collaborators with write access can remove assets
CREATE POLICY "Project collaborators can remove assets"
  ON project_assets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_assets.project_id
      AND (
        game_projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = game_projects.id
          AND project_collaborators.collaborator_id = auth.uid()
          AND project_collaborators.invitation_status = 'accepted'
          AND project_collaborators.role = 'editor'
        )
      )
    )
  );

-- Policy: Project collaborators with write access can update asset metadata
CREATE POLICY "Project collaborators can update assets"
  ON project_assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_assets.project_id
      AND (
        game_projects.creator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = game_projects.id
          AND project_collaborators.collaborator_id = auth.uid()
          AND project_collaborators.invitation_status = 'accepted'
          AND project_collaborators.role = 'editor'
        )
      )
    )
  );