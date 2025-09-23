-- Project Merging Functions (Updated for existing schema)
-- This migration adds the functions for project merging functionality using existing table structure

-- Function to merge project content
CREATE OR REPLACE FUNCTION merge_project_content(
  target_project_id UUID,
  source_project_id UUID,
  merge_type TEXT DEFAULT 'content_merge'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  merge_id UUID;
  source_project game_projects%ROWTYPE;
  target_project game_projects%ROWTYPE;
BEGIN
  -- Validate merge type
  IF merge_type NOT IN ('full_merge', 'content_merge', 'asset_merge') THEN
    RAISE EXCEPTION 'Invalid merge type: %', merge_type;
  END IF;

  -- Get source and target projects
  SELECT * INTO source_project FROM game_projects WHERE id = source_project_id;
  SELECT * INTO target_project FROM game_projects WHERE id = target_project_id;

  IF source_project.id IS NULL THEN
    RAISE EXCEPTION 'Source project not found';
  END IF;

  IF target_project.id IS NULL THEN
    RAISE EXCEPTION 'Target project not found';
  END IF;

  -- Check permissions
  IF NOT (
    target_project.creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_roles pr
      WHERE pr.project_id = target_project_id
        AND pr.user_id = auth.uid()
        AND pr.permissions->>'can_edit_content' = 'true'
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to merge into target project';
  END IF;

  -- Perform the merge based on type
  CASE merge_type
    WHEN 'full_merge' THEN
      -- Update target project with merged description
      UPDATE game_projects
      SET
        description = CASE
          WHEN target_project.description IS NULL OR target_project.description = ''
          THEN source_project.description
          ELSE target_project.description || E'\n\n--- Merged from "' || source_project.name || '" ---\n' || source_project.description
        END,
        updated_at = now()
      WHERE id = target_project_id;

      -- Copy milestones (with new IDs to avoid conflicts)
      INSERT INTO milestones (project_id, title, description, target_date, status)
      SELECT
        target_project_id,
        'From ' || source_project.name || ': ' || title,
        description,
        target_date,
        'pending'  -- Reset status for merged milestones
      FROM milestones
      WHERE project_id = source_project_id;

    WHEN 'content_merge' THEN
      -- Update target project description only
      UPDATE game_projects
      SET
        description = CASE
          WHEN target_project.description IS NULL OR target_project.description = ''
          THEN source_project.description
          ELSE target_project.description || E'\n\n--- Added content from "' || source_project.name || '" ---\n' || source_project.description
        END,
        updated_at = now()
      WHERE id = target_project_id;

    WHEN 'asset_merge' THEN
      -- Copy only game assets (if any exist in the future)
      -- For now, just update the project to indicate assets were considered
      UPDATE game_projects
      SET
        notes = COALESCE(notes, '') || E'\n--- Asset references from "' || source_project.name || '" considered for integration ---',
        updated_at = now()
      WHERE id = target_project_id;
  END CASE;

  -- Record the merge using existing table structure
  INSERT INTO project_merges (parent_project_id, merged_project_id, merged_by, merge_type, merge_reason)
  VALUES (target_project_id, source_project_id, auth.uid(), merge_type, 'Marketplace addition via collaboration feature')
  RETURNING id INTO merge_id;

  RETURN merge_id;
END;
$$;

-- Function to get merge history for a project
CREATE OR REPLACE FUNCTION get_project_merge_history(project_id UUID)
RETURNS TABLE (
  merge_id UUID,
  source_project_name TEXT,
  merge_type TEXT,
  merged_by_email TEXT,
  merge_reason TEXT,
  merged_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pm.id,
    gp.name as source_project_name,
    pm.merge_type,
    au.email as merged_by_email,
    pm.merge_reason,
    pm.merged_at
  FROM project_merges pm
  JOIN game_projects gp ON pm.merged_project_id = gp.id
  JOIN auth.users au ON pm.merged_by = au.id
  WHERE pm.parent_project_id = project_id
  ORDER BY pm.merged_at DESC;
$$;