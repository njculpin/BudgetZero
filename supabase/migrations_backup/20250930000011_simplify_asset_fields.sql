-- Simplify asset fields - remove unnecessary technical details
-- Both models and illustrations should only have: files, name, description, tags, license

-- Remove model-specific technical fields
ALTER TABLE assets
DROP COLUMN IF EXISTS polygon_count,
DROP COLUMN IF EXISTS vertex_count,
DROP COLUMN IF EXISTS is_textured,
DROP COLUMN IF EXISTS is_game_ready,
DROP COLUMN IF EXISTS scale_unit,
DROP COLUMN IF EXISTS print_settings,
DROP COLUMN IF EXISTS model_category;

-- Remove illustration-specific technical fields
ALTER TABLE assets
DROP COLUMN IF EXISTS illustration_type,
DROP COLUMN IF EXISTS is_vector,
DROP COLUMN IF EXISTS has_transparency,
DROP COLUMN IF EXISTS color_mode,
DROP COLUMN IF EXISTS dpi,
DROP COLUMN IF EXISTS art_style,
DROP COLUMN IF EXISTS subject_matter,
DROP COLUMN IF EXISTS is_print_ready;

-- Keep only essential fields:
-- id, creator_id, title, description, asset_type, file_url, file_size_bytes,
-- file_format, thumbnail_url, preview_url, dimensions, tags, license_type,
-- license_terms, price_cents, download_count, usage_count, is_public,
-- is_featured, seeking_collaborators, created_at, updated_at

COMMENT ON TABLE assets IS 'Simplified asset storage - models and illustrations with minimal metadata';
