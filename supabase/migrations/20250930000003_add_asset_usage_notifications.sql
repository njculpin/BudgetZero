-- Create function to notify asset creator when their asset is added to a project
CREATE OR REPLACE FUNCTION notify_asset_creator()
RETURNS TRIGGER AS $$
DECLARE
  v_asset_creator_id UUID;
  v_asset_name TEXT;
  v_project_title TEXT;
  v_added_by_name TEXT;
BEGIN
  -- Get asset creator and name
  SELECT creator_id, name INTO v_asset_creator_id, v_asset_name
  FROM assets
  WHERE id = NEW.asset_id;

  -- Get project title
  SELECT title INTO v_project_title
  FROM game_projects
  WHERE id = NEW.project_id;

  -- Get the name of the person who added the asset
  SELECT COALESCE(full_name, username, email) INTO v_added_by_name
  FROM profiles
  WHERE id = NEW.added_by;

  -- Insert notification (you can customize this to your notification system)
  INSERT INTO activities (
    actor_id,
    action_type,
    resource_type,
    resource_id,
    project_id,
    metadata
  ) VALUES (
    NEW.added_by,
    'asset_added',
    'asset',
    NEW.asset_id,
    NEW.project_id,
    jsonb_build_object(
      'asset_name', v_asset_name,
      'project_title', v_project_title,
      'asset_creator_id', v_asset_creator_id,
      'added_by_name', v_added_by_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on project_assets
DROP TRIGGER IF EXISTS on_project_asset_added ON project_assets;
CREATE TRIGGER on_project_asset_added
  AFTER INSERT ON project_assets
  FOR EACH ROW
  EXECUTE FUNCTION notify_asset_creator();

COMMENT ON FUNCTION notify_asset_creator() IS 'Notifies asset creator when their asset is added to a project';