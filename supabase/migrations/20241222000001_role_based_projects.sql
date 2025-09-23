-- Role-Based Project System
-- Remove artificial owner/contributor distinctions

-- Update contributor_role to be more flexible
ALTER TYPE contributor_role ADD VALUE IF NOT EXISTS 'project-lead';
ALTER TYPE contributor_role ADD VALUE IF NOT EXISTS 'business-developer';
ALTER TYPE contributor_role ADD VALUE IF NOT EXISTS 'publisher';

-- Create project_roles table for flexible role management
CREATE TABLE IF NOT EXISTS public.project_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role contributor_role NOT NULL,
    permissions JSONB DEFAULT '{
        "can_edit_content": true,
        "can_manage_team": false,
        "can_publish": false,
        "can_merge_projects": false,
        "can_create_milestones": false,
        "can_manage_finances": false
    }',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(project_id, user_id, role)
);

-- Create project_merges table for tracking merged projects
CREATE TABLE IF NOT EXISTS public.project_merges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    merged_project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    merge_type TEXT CHECK (merge_type IN ('full_merge', 'asset_merge', 'content_merge')),
    merged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    merge_reason TEXT,
    merged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_contributions table for tracking specific contributions
CREATE TABLE IF NOT EXISTS public.project_contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    contributor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    contribution_type TEXT NOT NULL, -- 'illustration', 'model', 'writing', 'design', etc.
    asset_id UUID, -- Reference to specific asset
    page_id UUID REFERENCES public.project_pages(id) ON DELETE CASCADE, -- Reference to page content
    block_id UUID REFERENCES public.content_blocks(id) ON DELETE CASCADE, -- Reference to specific block
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_roles_project_id ON public.project_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_project_roles_user_id ON public.project_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_project_merges_parent ON public.project_merges(parent_project_id);
CREATE INDEX IF NOT EXISTS idx_project_merges_merged ON public.project_merges(merged_project_id);
CREATE INDEX IF NOT EXISTS idx_project_contributions_project ON public.project_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contributions_contributor ON public.project_contributions(contributor_id);

-- Add triggers for updated_at
CREATE TRIGGER update_project_roles_updated_at
    BEFORE UPDATE ON public.project_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_roles
CREATE POLICY "Anyone can view project roles" ON public.project_roles FOR SELECT USING (true);
CREATE POLICY "Users can manage roles they have permission for" ON public.project_roles FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.project_roles pr
        WHERE pr.project_id = project_roles.project_id
        AND pr.user_id = auth.uid()
        AND (pr.permissions->>'can_manage_team')::boolean = true
    )
);

-- RLS Policies for project_merges
CREATE POLICY "Anyone can view project merges" ON public.project_merges FOR SELECT USING (true);
CREATE POLICY "Team members can create merges" ON public.project_merges FOR INSERT WITH CHECK (
    auth.uid() = merged_by AND
    EXISTS (
        SELECT 1 FROM public.project_roles
        WHERE project_id IN (parent_project_id, merged_project_id)
        AND user_id = auth.uid()
        AND (permissions->>'can_merge_projects')::boolean = true
    )
);

-- RLS Policies for project_contributions
CREATE POLICY "Anyone can view contributions" ON public.project_contributions FOR SELECT USING (true);
CREATE POLICY "Contributors can manage their contributions" ON public.project_contributions FOR ALL USING (
    contributor_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.project_roles
        WHERE project_id = project_contributions.project_id
        AND user_id = auth.uid()
        AND (permissions->>'can_edit_content')::boolean = true
    )
);

-- Migration function to convert existing data
CREATE OR REPLACE FUNCTION migrate_to_role_based_projects()
RETURNS void AS $$
DECLARE
    project_record RECORD;
    contributor_record RECORD;
BEGIN
    -- Convert project creators to project leads with full permissions
    FOR project_record IN
        SELECT id, creator_id FROM public.game_projects
    LOOP
        INSERT INTO public.project_roles (project_id, user_id, role, permissions)
        VALUES (
            project_record.id,
            project_record.creator_id,
            'project-lead',
            '{
                "can_edit_content": true,
                "can_manage_team": true,
                "can_publish": true,
                "can_merge_projects": true,
                "can_create_milestones": true,
                "can_manage_finances": true
            }'::jsonb
        )
        ON CONFLICT (project_id, user_id, role) DO NOTHING;
    END LOOP;

    -- Convert existing contributors to project roles
    FOR contributor_record IN
        SELECT project_id, user_id, role, status FROM public.contributors WHERE status = 'accepted'
    LOOP
        INSERT INTO public.project_roles (project_id, user_id, role, permissions)
        VALUES (
            contributor_record.project_id,
            contributor_record.user_id,
            contributor_record.role,
            '{
                "can_edit_content": true,
                "can_manage_team": false,
                "can_publish": false,
                "can_merge_projects": false,
                "can_create_milestones": false,
                "can_manage_finances": false
            }'::jsonb
        )
        ON CONFLICT (project_id, user_id, role) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Default role permissions configuration
CREATE OR REPLACE FUNCTION get_default_role_permissions(role_name contributor_role)
RETURNS jsonb AS $$
BEGIN
    CASE role_name
        WHEN 'project-lead' THEN
            RETURN '{
                "can_edit_content": true,
                "can_manage_team": true,
                "can_publish": true,
                "can_merge_projects": true,
                "can_create_milestones": true,
                "can_manage_finances": true
            }'::jsonb;
        WHEN 'game-designer' THEN
            RETURN '{
                "can_edit_content": true,
                "can_manage_team": false,
                "can_publish": false,
                "can_merge_projects": true,
                "can_create_milestones": true,
                "can_manage_finances": false
            }'::jsonb;
        WHEN 'business-developer', 'publisher' THEN
            RETURN '{
                "can_edit_content": false,
                "can_manage_team": true,
                "can_publish": true,
                "can_merge_projects": true,
                "can_create_milestones": true,
                "can_manage_finances": true
            }'::jsonb;
        ELSE
            RETURN '{
                "can_edit_content": true,
                "can_manage_team": false,
                "can_publish": false,
                "can_merge_projects": false,
                "can_create_milestones": false,
                "can_manage_finances": false
            }'::jsonb;
    END CASE;
END;
$$ LANGUAGE plpgsql;