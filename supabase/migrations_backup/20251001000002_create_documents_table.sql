-- Create documents table to replace rulebooks
-- Documents are text-based assets (rulebooks, expansions, guides) that belong to projects
-- Similar to models and illustrations, documents can have contributors with royalty splits

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership & Project
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT DEFAULT 'rulebook' CHECK (document_type IN ('rulebook', 'expansion', 'quick_start', 'reference', 'other')),

  -- Content (TipTap JSON)
  content JSONB DEFAULT '{"type":"doc","content":[]}'::jsonb,

  -- Version control
  version INTEGER DEFAULT 1,

  -- Royalty & Licensing (same as assets)
  royalty_percentage INTEGER DEFAULT 0 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),
  license_type TEXT DEFAULT 'free' CHECK (license_type IN ('free', 'attribution', 'commercial', 'exclusive')),
  license_terms TEXT,

  -- Publishing
  is_public BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Stats
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,

  -- Collaboration
  seeking_collaborators BOOLEAN DEFAULT false,

  -- Tags
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_creator ON documents(creator_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_public ON documents(is_public);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- RLS Policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Public documents are readable by everyone
CREATE POLICY "Public documents are viewable by everyone"
  ON documents FOR SELECT
  USING (is_public = true);

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = creator_id);

-- Users can create documents
CREATE POLICY "Users can create documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = creator_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = creator_id);

-- Migrate existing rulebooks to documents
INSERT INTO documents (
  id,
  creator_id,
  project_id,
  title,
  description,
  document_type,
  content,
  version,
  is_public,
  status,
  created_at,
  updated_at
)
SELECT
  rulebooks.id,
  projects.creator_id,
  rulebooks.project_id,
  rulebooks.title,
  'Rulebook for ' || projects.title as description,
  'rulebook' as document_type,
  rulebooks.content,
  rulebooks.version,
  projects.is_public,
  'published' as status,
  rulebooks.created_at,
  rulebooks.updated_at
FROM rulebooks
INNER JOIN projects ON projects.id = rulebooks.project_id
ON CONFLICT (id) DO NOTHING;

-- Create project_document_references table (similar to project_asset_references)
CREATE TABLE IF NOT EXISTS project_document_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference relationship
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Royalty info
  royalty_percentage INTEGER NOT NULL CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),

  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, document_id)
);

CREATE INDEX idx_project_document_refs_project ON project_document_references(project_id);
CREATE INDEX idx_project_document_refs_document ON project_document_references(document_id);
CREATE INDEX idx_project_document_refs_status ON project_document_references(status);

-- RLS for project_document_references
ALTER TABLE project_document_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document references for their projects"
  ON project_document_references FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM projects WHERE id = project_id
      UNION
      SELECT creator_id FROM documents WHERE id = document_id
    )
  );

CREATE POLICY "Users can create document references"
  ON project_document_references FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by
    AND auth.uid() IN (SELECT creator_id FROM projects WHERE id = project_id)
  );

CREATE POLICY "Document owners can update references"
  ON project_document_references FOR UPDATE
  USING (
    auth.uid() IN (SELECT creator_id FROM documents WHERE id = document_id)
  );
