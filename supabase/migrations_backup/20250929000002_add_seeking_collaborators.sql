-- Add seeking_collaborators flag to game_projects
ALTER TABLE game_projects
ADD COLUMN seeking_collaborators BOOLEAN DEFAULT FALSE;

-- Add index for filtering
CREATE INDEX idx_game_projects_seeking_collaborators ON game_projects(seeking_collaborators) WHERE seeking_collaborators = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN game_projects.seeking_collaborators IS 'Whether the project creator is actively looking for collaborators';