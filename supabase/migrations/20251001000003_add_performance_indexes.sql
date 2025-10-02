-- Add performance indexes for attribution reference queries
-- Migration: 20251001000003_add_performance_indexes.sql

-- Index for fast lookup of pending asset references by asset owner
-- Supports query: WHERE asset_id IN (...) AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_asset_references_asset_status
ON project_asset_references(asset_id, status)
WHERE status = 'pending';

-- Index for fast lookup of pending asset references by project
-- Supports query: WHERE project_id = ? AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_asset_references_project_status
ON project_asset_references(project_id, status)
WHERE status = 'pending';

-- Index for approved references by project (for attribution chain display)
-- Supports query: WHERE project_id = ? AND status = 'approved'
CREATE INDEX IF NOT EXISTS idx_asset_references_project_approved
ON project_asset_references(project_id, status, created_at DESC)
WHERE status = 'approved';

-- Index for fast lookup of pending document references by document owner
-- Supports query: WHERE document_id IN (...) AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_document_references_document_status
ON project_document_references(document_id, status)
WHERE status = 'pending';

-- Index for fast lookup of pending document references by project
-- Supports query: WHERE project_id = ? AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_document_references_project_status
ON project_document_references(project_id, status)
WHERE status = 'pending';

-- Index for approved document references by project
-- Supports query: WHERE project_id = ? AND status = 'approved'
CREATE INDEX IF NOT EXISTS idx_document_references_project_approved
ON project_document_references(project_id, status, created_at DESC)
WHERE status = 'approved';

-- Index for fast user/profile lookup (used in joins)
-- Supports query: WHERE id = ?
-- Note: users table is actually auth.users, profiles has user data
-- CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id); -- Primary key already indexed

-- Index for fast asset lookup by creator
-- Supports query: WHERE creator_id = ?
CREATE INDEX IF NOT EXISTS idx_assets_creator
ON assets(creator_id);

-- Index for fast document lookup by creator
-- Supports query: WHERE creator_id = ?
CREATE INDEX IF NOT EXISTS idx_documents_creator
ON documents(creator_id);

-- Index for fast project lookup by creator
-- Supports query: WHERE creator_id = ?
CREATE INDEX IF NOT EXISTS idx_projects_creator
ON projects(creator_id);

-- Composite index for asset references with all commonly queried fields
-- Supports complex queries in dashboard
CREATE INDEX IF NOT EXISTS idx_asset_references_composite
ON project_asset_references(status, asset_id, project_id, requested_at DESC);

-- Composite index for document references with all commonly queried fields
-- Supports complex queries in dashboard
CREATE INDEX IF NOT EXISTS idx_document_references_composite
ON project_document_references(status, document_id, project_id, requested_at DESC);

-- Add comment for documentation
COMMENT ON INDEX idx_asset_references_asset_status IS 'Optimizes dashboard query for pending asset references by owner';
COMMENT ON INDEX idx_asset_references_project_status IS 'Optimizes lookup of pending references for a project';
COMMENT ON INDEX idx_asset_references_project_approved IS 'Optimizes attribution chain display on project pages';
COMMENT ON INDEX idx_document_references_document_status IS 'Optimizes dashboard query for pending document references by owner';
COMMENT ON INDEX idx_document_references_project_status IS 'Optimizes lookup of pending document references for a project';
COMMENT ON INDEX idx_document_references_project_approved IS 'Optimizes document attribution chain display';
COMMENT ON INDEX idx_asset_references_composite IS 'Composite index for complex dashboard queries';
COMMENT ON INDEX idx_document_references_composite IS 'Composite index for complex dashboard queries';
