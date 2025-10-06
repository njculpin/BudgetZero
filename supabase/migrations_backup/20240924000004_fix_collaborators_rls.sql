-- Fix infinite recursion in project_collaborators RLS policies

-- Drop all existing project_collaborators policies
DROP POLICY IF EXISTS "Collaborators can view collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project creators can manage collaborations" ON project_collaborators;

-- Create simple, non-recursive policies for project_collaborators

-- Users can view collaborations they are part of
CREATE POLICY "view_own_collaborations" ON project_collaborators
  FOR SELECT USING (collaborator_id = auth.uid());

-- Project creators can view all collaborations on their projects
CREATE POLICY "creators_view_project_collaborations" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_collaborators.project_id
      AND game_projects.creator_id = auth.uid()
    )
  );

-- Project creators can manage collaborations on their projects
CREATE POLICY "creators_manage_collaborations" ON project_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_collaborators.project_id
      AND game_projects.creator_id = auth.uid()
    )
  );

-- Users can be invited as collaborators (for INSERT)
CREATE POLICY "invite_collaborators" ON project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_projects
      WHERE game_projects.id = project_collaborators.project_id
      AND game_projects.creator_id = auth.uid()
    )
  );