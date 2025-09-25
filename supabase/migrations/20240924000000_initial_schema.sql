-- Initial schema for BudgetZero collaborative tabletop game platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE creator_role AS ENUM ('designer', 'illustrator', 'modeler', 'editor', 'photographer');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'archived', 'published');
CREATE TYPE collaboration_permission AS ENUM ('read', 'comment', 'edit', 'admin');
CREATE TYPE license_type AS ENUM ('free', 'attribution', 'commercial', 'exclusive');

-- User profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  creator_roles creator_role[] DEFAULT '{}',
  location TEXT,
  website_url TEXT,
  portfolio_url TEXT,
  social_links JSONB DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game projects table
CREATE TABLE game_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 1000),
  slug TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status project_status DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE,
  cover_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  license_type license_type DEFAULT 'free',
  license_terms TEXT,
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
  revenue_split_percentage INTEGER DEFAULT 100 CHECK (revenue_split_percentage > 0 AND revenue_split_percentage <= 100),
  genre TEXT,
  player_count_min INTEGER CHECK (player_count_min > 0),
  player_count_max INTEGER CHECK (player_count_max >= player_count_min),
  play_time_minutes INTEGER CHECK (play_time_minutes > 0),
  complexity_rating INTEGER CHECK (complexity_rating >= 1 AND complexity_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project collaborators (many-to-many relationship)
CREATE TABLE project_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  collaborator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role creator_role NOT NULL,
  permissions collaboration_permission[] DEFAULT '{"read"}',
  invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'revoked')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  revenue_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (revenue_percentage >= 0 AND revenue_percentage <= 100),
  contribution_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, collaborator_id)
);

-- Rulebooks table (for storing TipTap editor content)
CREATE TABLE rulebooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Rulebook',
  content JSONB DEFAULT '{"type":"doc","content":[]}',
  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT FALSE,
  word_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  last_edited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rulebook versions for history tracking
CREATE TABLE rulebook_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rulebook_id UUID REFERENCES rulebooks(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  changes_summary TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rulebook_id, version_number)
);

-- Assets table (for 3D models, illustrations, etc.)
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  description TEXT CHECK (length(description) <= 500),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('model', 'illustration', 'photo', 'texture', 'audio')),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  dimensions JSONB, -- For storing width, height, depth, etc.
  tags TEXT[] DEFAULT '{}',
  license_type license_type DEFAULT 'attribution',
  license_terms TEXT,
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
  download_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project assets (linking assets to projects)
CREATE TABLE project_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  usage_context TEXT, -- Where/how the asset is used in the project
  added_by UUID REFERENCES profiles(id) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, asset_id)
);

-- Activity feed for tracking changes
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('project_created', 'project_updated', 'collaborator_added', 'asset_added', 'rulebook_updated', 'comment_added')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('project', 'rulebook', 'asset', 'collaboration')),
  resource_id UUID NOT NULL,
  project_id UUID REFERENCES game_projects(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments system
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('project', 'rulebook', 'asset')),
  resource_id UUID NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  is_resolved BOOLEAN DEFAULT FALSE,
  position JSONB, -- For contextual comments in editor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_creator_roles ON profiles USING GIN(creator_roles);
CREATE INDEX idx_game_projects_creator_id ON game_projects(creator_id);
CREATE INDEX idx_game_projects_status ON game_projects(status);
CREATE INDEX idx_game_projects_slug ON game_projects(slug);
CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_collaborator_id ON project_collaborators(collaborator_id);
CREATE INDEX idx_rulebooks_project_id ON rulebooks(project_id);
CREATE INDEX idx_assets_creator_id ON assets(creator_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX idx_activities_actor_id ON activities(actor_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_projects_updated_at BEFORE UPDATE ON game_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_collaborators_updated_at BEFORE UPDATE ON project_collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rulebooks_updated_at BEFORE UPDATE ON rulebooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulebook_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for game_projects
CREATE POLICY "Public projects are viewable by everyone" ON game_projects
  FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

CREATE POLICY "Collaborators can view projects" ON game_projects
  FOR SELECT USING (
    auth.uid() IN (
      SELECT collaborator_id FROM project_collaborators
      WHERE project_id = game_projects.id
      AND invitation_status = 'accepted'
      AND is_active = true
    )
  );

CREATE POLICY "Project creators can manage their projects" ON game_projects
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can create projects" ON game_projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for project_collaborators
CREATE POLICY "Collaborators can view collaborations" ON project_collaborators
  FOR SELECT USING (
    auth.uid() = collaborator_id OR
    auth.uid() IN (
      SELECT creator_id FROM game_projects WHERE id = project_collaborators.project_id
    ) OR
    auth.uid() IN (
      SELECT collaborator_id FROM project_collaborators AS pc2
      WHERE pc2.project_id = project_collaborators.project_id
      AND pc2.invitation_status = 'accepted'
      AND 'admin' = ANY(pc2.permissions)
    )
  );

CREATE POLICY "Project creators can manage collaborations" ON project_collaborators
  FOR ALL USING (
    auth.uid() IN (
      SELECT creator_id FROM game_projects WHERE id = project_collaborators.project_id
    )
  );

-- RLS Policies for rulebooks
CREATE POLICY "Collaborators can view rulebooks" ON rulebooks
  FOR SELECT USING (
    auth.uid() IN (
      SELECT gp.creator_id FROM game_projects gp WHERE gp.id = rulebooks.project_id
    ) OR
    auth.uid() IN (
      SELECT pc.collaborator_id FROM project_collaborators pc
      WHERE pc.project_id = rulebooks.project_id
      AND pc.invitation_status = 'accepted'
      AND pc.is_active = true
    )
  );

CREATE POLICY "Collaborators with edit permission can modify rulebooks" ON rulebooks
  FOR ALL USING (
    auth.uid() IN (
      SELECT gp.creator_id FROM game_projects gp WHERE gp.id = rulebooks.project_id
    ) OR
    auth.uid() IN (
      SELECT pc.collaborator_id FROM project_collaborators pc
      WHERE pc.project_id = rulebooks.project_id
      AND pc.invitation_status = 'accepted'
      AND 'edit' = ANY(pc.permissions)
    )
  );

-- RLS Policies for assets
CREATE POLICY "Public assets are viewable by everyone" ON assets
  FOR SELECT USING (is_public = true);

CREATE POLICY "Asset creators can manage their assets" ON assets
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can create assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for activities
CREATE POLICY "Users can view activities for their projects" ON activities
  FOR SELECT USING (
    auth.uid() = actor_id OR
    project_id IN (
      SELECT id FROM game_projects WHERE creator_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE collaborator_id = auth.uid()
      AND invitation_status = 'accepted'
    )
  );

-- RLS Policies for comments
CREATE POLICY "Users can view comments on accessible resources" ON comments
  FOR SELECT USING (
    CASE
      WHEN resource_type = 'project' THEN
        resource_id::uuid IN (
          SELECT id FROM game_projects
          WHERE creator_id = auth.uid() OR is_public = true
        ) OR
        resource_id::uuid IN (
          SELECT project_id FROM project_collaborators
          WHERE collaborator_id = auth.uid()
          AND invitation_status = 'accepted'
        )
      WHEN resource_type = 'asset' THEN
        resource_id::uuid IN (
          SELECT id FROM assets WHERE creator_id = auth.uid() OR is_public = true
        )
      ELSE false
    END
  );

CREATE POLICY "Users can create comments on accessible resources" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);