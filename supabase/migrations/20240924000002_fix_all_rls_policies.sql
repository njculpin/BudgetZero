-- Comprehensive fix for all RLS policy recursion issues

-- Drop ALL existing game_projects policies to start fresh
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON game_projects;
DROP POLICY IF EXISTS "Collaborators can view projects" ON game_projects;
DROP POLICY IF EXISTS "Users can view their projects and public projects" ON game_projects;
DROP POLICY IF EXISTS "Project creators can manage their projects" ON game_projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON game_projects;

-- Create simple, non-recursive policies

-- Allow users to view public projects and their own projects
CREATE POLICY "view_projects" ON game_projects
  FOR SELECT USING (
    is_public = true
    OR creator_id = auth.uid()
  );

-- Allow users to insert projects they own
CREATE POLICY "insert_own_projects" ON game_projects
  FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Allow users to update their own projects
CREATE POLICY "update_own_projects" ON game_projects
  FOR UPDATE USING (creator_id = auth.uid());

-- Allow users to delete their own projects
CREATE POLICY "delete_own_projects" ON game_projects
  FOR DELETE USING (creator_id = auth.uid());

-- Create a separate view for projects with collaborator access
-- This avoids recursion by using a function instead of inline policy
CREATE OR REPLACE FUNCTION user_can_access_project(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_collaborators.project_id = user_can_access_project.project_id
    AND collaborator_id = auth.uid()
    AND invitation_status = 'accepted'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for collaborator access using the function
CREATE POLICY "collaborator_access_projects" ON game_projects
  FOR SELECT USING (user_can_access_project(id));