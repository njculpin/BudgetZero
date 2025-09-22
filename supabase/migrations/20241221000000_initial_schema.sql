-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE project_category AS ENUM ('board-game', 'card-game', 'rpg', 'miniature-game', 'other');
CREATE TYPE project_status AS ENUM ('idea', 'in-development', 'completed', 'published');
CREATE TYPE milestone_status AS ENUM ('planning', 'funding', 'in-progress', 'completed');
CREATE TYPE contributor_role AS ENUM ('illustrator', '3d-modeler', 'writer', 'graphic-designer', 'game-designer', 'playtester');
CREATE TYPE compensation_type AS ENUM ('equity', 'fixed', 'royalty', 'credit', 'hybrid');
CREATE TYPE contributor_status AS ENUM ('applied', 'accepted', 'active', 'completed');
CREATE TYPE asset_type AS ENUM ('image', '3d-model', 'document', 'audio', 'video', 'other');
CREATE TYPE asset_status AS ENUM ('draft', 'review', 'approved', 'rejected');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_projects table
CREATE TABLE IF NOT EXISTS public.game_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category project_category NOT NULL,
    status project_status DEFAULT 'idea',
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_audience TEXT NOT NULL,
    estimated_players TEXT NOT NULL,
    estimated_playtime TEXT NOT NULL,
    concept_art_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    funding_goal INTEGER DEFAULT 0,
    current_funding INTEGER DEFAULT 0,
    deliverables TEXT[] DEFAULT '{}',
    timeline_weeks INTEGER NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    status milestone_status DEFAULT 'planning',
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contributors table
CREATE TABLE IF NOT EXISTS public.contributors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
    role contributor_role NOT NULL,
    compensation_type compensation_type NOT NULL,
    compensation_details TEXT NOT NULL,
    status contributor_status DEFAULT 'applied',
    application_message TEXT,
    portfolio_links TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_assets table
CREATE TABLE IF NOT EXISTS public.game_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    contributor_id UUID REFERENCES public.contributors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type asset_type NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    version INTEGER DEFAULT 1,
    status asset_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rulebooks table
CREATE TABLE IF NOT EXISTS public.rulebooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    version INTEGER DEFAULT 1,
    template_id TEXT,
    last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rulebook_versions table
CREATE TABLE IF NOT EXISTS public.rulebook_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rulebook_id UUID REFERENCES public.rulebooks(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_projects_creator_id ON public.game_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_game_projects_status ON public.game_projects(status);
CREATE INDEX IF NOT EXISTS idx_game_projects_category ON public.game_projects(category);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_contributors_project_id ON public.contributors(project_id);
CREATE INDEX IF NOT EXISTS idx_contributors_user_id ON public.contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_contributors_milestone_id ON public.contributors(milestone_id);
CREATE INDEX IF NOT EXISTS idx_game_assets_project_id ON public.game_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_game_assets_contributor_id ON public.game_assets(contributor_id);
CREATE INDEX IF NOT EXISTS idx_rulebooks_project_id ON public.rulebooks(project_id);
CREATE INDEX IF NOT EXISTS idx_rulebook_versions_rulebook_id ON public.rulebook_versions(rulebook_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_projects_updated_at BEFORE UPDATE ON public.game_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rulebooks_updated_at BEFORE UPDATE ON public.rulebooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rulebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rulebook_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Game projects policies
CREATE POLICY "Anyone can view published game projects" ON public.game_projects FOR SELECT USING (true);
CREATE POLICY "Users can insert own game projects" ON public.game_projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own game projects" ON public.game_projects FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own game projects" ON public.game_projects FOR DELETE USING (auth.uid() = creator_id);

-- Milestones policies
CREATE POLICY "Anyone can view milestones" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "Project creators can manage milestones" ON public.milestones FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.game_projects
        WHERE id = project_id AND creator_id = auth.uid()
    )
);

-- Contributors policies
CREATE POLICY "Anyone can view contributors" ON public.contributors FOR SELECT USING (true);
CREATE POLICY "Users can apply as contributors" ON public.contributors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contributions" ON public.contributors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Project creators can manage contributors" ON public.contributors FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.game_projects
        WHERE id = project_id AND creator_id = auth.uid()
    )
);

-- Game assets policies
CREATE POLICY "Anyone can view approved assets" ON public.game_assets FOR SELECT USING (status = 'approved');
CREATE POLICY "Contributors can view their assets" ON public.game_assets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.contributors
        WHERE id = contributor_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Contributors can manage their assets" ON public.game_assets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.contributors
        WHERE id = contributor_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Project creators can manage all assets" ON public.game_assets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.game_projects
        WHERE id = project_id AND creator_id = auth.uid()
    )
);

-- Rulebooks policies
CREATE POLICY "Anyone can view published rulebooks" ON public.rulebooks FOR SELECT USING (is_published = true);
CREATE POLICY "Project members can view rulebooks" ON public.rulebooks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.game_projects
        WHERE id = project_id AND creator_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.contributors
        WHERE project_id = rulebooks.project_id AND user_id = auth.uid()
    )
);
CREATE POLICY "Project creators can manage rulebooks" ON public.rulebooks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.game_projects
        WHERE id = project_id AND creator_id = auth.uid()
    )
);

-- Rulebook versions policies
CREATE POLICY "Project members can view rulebook versions" ON public.rulebook_versions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.rulebooks r
        JOIN public.game_projects p ON r.project_id = p.id
        WHERE r.id = rulebook_id AND (
            p.creator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contributors
                WHERE project_id = p.id AND user_id = auth.uid()
            )
        )
    )
);
CREATE POLICY "Project members can create rulebook versions" ON public.rulebook_versions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.rulebooks r
        JOIN public.game_projects p ON r.project_id = p.id
        WHERE r.id = rulebook_id AND (
            p.creator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contributors
                WHERE project_id = p.id AND user_id = auth.uid()
            )
        )
    )
);