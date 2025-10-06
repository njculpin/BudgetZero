-- Fix infinite recursion in game_projects RLS policy

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Collaborators can view projects" ON game_projects;

-- Create a simpler policy that avoids recursion by combining conditions
CREATE POLICY "Users can view their projects and public projects" ON game_projects
  FOR SELECT USING (
    is_public = true
    OR auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = id
      AND pc.collaborator_id = auth.uid()
      AND pc.invitation_status = 'accepted'
      AND pc.is_active = true
    )
  );