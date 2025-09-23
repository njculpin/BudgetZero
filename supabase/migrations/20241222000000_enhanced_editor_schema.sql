-- Enhanced Editor Schema for Block-Based Content System
-- This extends the existing rulebooks system with sections, pages, and blocks

-- Create new types for the enhanced editor system
CREATE TYPE block_type AS ENUM (
    'paragraph',
    'heading',
    'list',
    'quote',
    'image',
    'table',
    'divider',
    'rule_snippet',
    'component_definition',
    'stat_block',
    'example_play',
    'designer_note',
    'template'
);

CREATE TYPE page_template_type AS ENUM (
    'blank',
    'rules_section',
    'component_spec',
    'quick_start',
    'playtesting_notes',
    'design_rationale'
);

-- Create project_sections table
CREATE TABLE IF NOT EXISTS public.project_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📁',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_pages table
CREATE TABLE IF NOT EXISTS public.project_pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    section_id UUID REFERENCES public.project_sections(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    template_type page_template_type DEFAULT 'blank',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content_blocks table
CREATE TABLE IF NOT EXISTS public.content_blocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id UUID REFERENCES public.project_pages(id) ON DELETE CASCADE NOT NULL,
    type block_type NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    style_config JSONB DEFAULT '{}',
    grid_position JSONB DEFAULT '{"row": 1, "col": 1, "rowSpan": 1, "colSpan": 12}',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_template BOOLEAN DEFAULT FALSE,
    template_name TEXT,
    template_category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create block_templates table for reusable blocks
CREATE TABLE IF NOT EXISTS public.block_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.game_projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    type block_type NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    style_config JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create page_collaboration table for real-time editing
CREATE TABLE IF NOT EXISTS public.page_collaboration (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id UUID REFERENCES public.project_pages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cursor_position JSONB,
    is_editing BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_sections_project_id ON public.project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sections_order ON public.project_sections(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_project_pages_section_id ON public.project_pages(section_id);
CREATE INDEX IF NOT EXISTS idx_project_pages_order ON public.project_pages(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_blocks_page_id ON public.content_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_order ON public.content_blocks(page_id, order_index);
CREATE INDEX IF NOT EXISTS idx_content_blocks_grid ON public.content_blocks USING GIN (grid_position);
CREATE INDEX IF NOT EXISTS idx_content_blocks_type ON public.content_blocks(type);
CREATE INDEX IF NOT EXISTS idx_block_templates_project_id ON public.block_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_block_templates_category ON public.block_templates(category);
CREATE INDEX IF NOT EXISTS idx_page_collaboration_page_id ON public.page_collaboration(page_id);

-- Add triggers for updated_at
CREATE TRIGGER update_project_sections_updated_at
    BEFORE UPDATE ON public.project_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_pages_updated_at
    BEFORE UPDATE ON public.project_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at
    BEFORE UPDATE ON public.content_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_block_templates_updated_at
    BEFORE UPDATE ON public.block_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_collaboration ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_sections
CREATE POLICY "Anyone can view project sections" ON public.project_sections FOR SELECT USING (true);
CREATE POLICY "Project creators can manage sections" ON public.project_sections FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.game_projects
        WHERE id = project_id AND creator_id = auth.uid()
    )
);

-- RLS Policies for project_pages
CREATE POLICY "Anyone can view project pages" ON public.project_pages FOR SELECT USING (true);
CREATE POLICY "Project members can manage pages" ON public.project_pages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.project_sections ps
        JOIN public.game_projects p ON ps.project_id = p.id
        WHERE ps.id = section_id AND (
            p.creator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contributors
                WHERE project_id = p.id AND user_id = auth.uid()
            )
        )
    )
);

-- RLS Policies for content_blocks
CREATE POLICY "Anyone can view content blocks" ON public.content_blocks FOR SELECT USING (true);
CREATE POLICY "Project members can manage blocks" ON public.content_blocks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.project_pages pp
        JOIN public.project_sections ps ON pp.section_id = ps.id
        JOIN public.game_projects p ON ps.project_id = p.id
        WHERE pp.id = page_id AND (
            p.creator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contributors
                WHERE project_id = p.id AND user_id = auth.uid()
            )
        )
    )
);

-- RLS Policies for block_templates
CREATE POLICY "Anyone can view block templates" ON public.block_templates FOR SELECT USING (true);
CREATE POLICY "Project members can manage templates" ON public.block_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.game_projects
        WHERE id = project_id AND (
            creator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contributors
                WHERE project_id = game_projects.id AND user_id = auth.uid()
            )
        )
    )
);

-- RLS Policies for page_collaboration
CREATE POLICY "Project members can view collaboration data" ON public.page_collaboration FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.project_pages pp
        JOIN public.project_sections ps ON pp.section_id = ps.id
        JOIN public.game_projects p ON ps.project_id = p.id
        WHERE pp.id = page_id AND (
            p.creator_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.contributors
                WHERE project_id = p.id AND user_id = auth.uid()
            )
        )
    )
);
CREATE POLICY "Users can manage own collaboration data" ON public.page_collaboration FOR ALL USING (auth.uid() = user_id);

-- Migration function to convert existing rulebooks to the new structure
CREATE OR REPLACE FUNCTION migrate_existing_rulebooks()
RETURNS void AS $$
DECLARE
    project_record RECORD;
    section_id UUID;
    page_id UUID;
    block_id UUID;
BEGIN
    -- For each project with a rulebook, create a default section and page
    FOR project_record IN
        SELECT DISTINCT p.id as project_id, r.id as rulebook_id, r.title, r.content
        FROM public.game_projects p
        JOIN public.rulebooks r ON p.id = r.project_id
    LOOP
        -- Create default "Rules" section
        INSERT INTO public.project_sections (project_id, name, description, icon, order_index)
        VALUES (project_record.project_id, 'Rules', 'Game rules and mechanics', '📋', 0)
        RETURNING id INTO section_id;

        -- Create default page with the rulebook title
        INSERT INTO public.project_pages (section_id, title, template_type, order_index)
        VALUES (section_id, COALESCE(project_record.title, 'Rulebook'), 'rules_section', 0)
        RETURNING id INTO page_id;

        -- Create a single content block with the existing rulebook content
        IF project_record.content IS NOT NULL AND project_record.content != '' THEN
            INSERT INTO public.content_blocks (page_id, type, content, order_index)
            VALUES (
                page_id,
                'paragraph',
                jsonb_build_object('text', project_record.content),
                0
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Default sections and templates for new projects
CREATE OR REPLACE FUNCTION create_default_project_structure(p_project_id UUID)
RETURNS void AS $$
DECLARE
    rules_section_id UUID;
    components_section_id UUID;
    design_section_id UUID;
BEGIN
    -- Create default sections
    INSERT INTO public.project_sections (project_id, name, description, icon, order_index) VALUES
        (p_project_id, 'Rules', 'Core game rules and mechanics', '📋', 0),
        (p_project_id, 'Components', 'Game pieces, cards, and materials', '🎲', 1),
        (p_project_id, 'Design Notes', 'Development process and rationale', '📝', 2)
    RETURNING id INTO rules_section_id;

    -- Get the section IDs
    SELECT id INTO rules_section_id FROM public.project_sections
    WHERE project_id = p_project_id AND name = 'Rules';

    SELECT id INTO components_section_id FROM public.project_sections
    WHERE project_id = p_project_id AND name = 'Components';

    SELECT id INTO design_section_id FROM public.project_sections
    WHERE project_id = p_project_id AND name = 'Design Notes';

    -- Create default pages
    INSERT INTO public.project_pages (section_id, title, template_type, order_index) VALUES
        (rules_section_id, 'Quick Start Guide', 'quick_start', 0),
        (rules_section_id, 'Complete Rules', 'rules_section', 1),
        (components_section_id, 'Game Board', 'component_spec', 0),
        (components_section_id, 'Playing Pieces', 'component_spec', 1),
        (design_section_id, 'Design Goals', 'design_rationale', 0);
END;
$$ LANGUAGE plpgsql;