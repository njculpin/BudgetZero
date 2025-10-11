-- Teams System Migration
-- Allows users to create teams, invite members, and assign ownership of assets/projects/products to teams

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_slug ON teams(slug);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'rejected')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(invitation_status);

-- Team invitations table (for email invites to non-users)
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

-- Add team_id to assets table
ALTER TABLE assets ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX idx_assets_team_id ON assets(team_id);

-- Add team_id to projects table
ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX idx_projects_team_id ON projects(team_id);

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically accept team creator as owner
CREATE OR REPLACE FUNCTION handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role, invitation_status, joined_at)
  VALUES (NEW.id, NEW.created_by, 'owner', 'accepted', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_team_created
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_team();

-- RLS Policies for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Users can view teams they created (will be expanded after team creation)
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (created_by = auth.uid());

-- Users can create teams
CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Team creators can update teams (simplified to avoid recursion)
CREATE POLICY "Team creators can update teams" ON teams
  FOR UPDATE USING (created_by = auth.uid());

-- Only team creators can delete teams (simplified to avoid recursion)
CREATE POLICY "Team creators can delete teams" ON teams
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their teams
CREATE POLICY "Users can view their team members" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );

-- Team owners and admins can invite members (simplified to avoid recursion)
CREATE POLICY "Team owners and admins can invite members" ON team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );

-- Users can update their own membership (accept/reject invites)
CREATE POLICY "Users can update their own membership" ON team_members
  FOR UPDATE USING (user_id = auth.uid());

-- Team owners and admins can update member roles (simplified to avoid recursion)
CREATE POLICY "Team owners and admins can update member roles" ON team_members
  FOR UPDATE USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );

-- Team owners and admins can remove members (simplified to avoid recursion)
CREATE POLICY "Team owners and admins can remove members" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );

-- RLS Policies for team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations for their teams (simplified to avoid recursion)
CREATE POLICY "Users can view their team invitations" ON team_invitations
  FOR SELECT USING (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );

-- Team owners and admins can create invitations (simplified to avoid recursion)
CREATE POLICY "Team owners and admins can create invitations" ON team_invitations
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );

-- Team owners and admins can update invitations (simplified to avoid recursion)
CREATE POLICY "Team owners and admins can update invitations" ON team_invitations
  FOR UPDATE USING (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );

-- Team owners and admins can delete invitations (simplified to avoid recursion)
CREATE POLICY "Team owners and admins can delete invitations" ON team_invitations
  FOR DELETE USING (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.created_by = auth.uid()
    )
  );
