-- Fix creator profile trigger to handle RLS properly
-- The issue is that the trigger runs in a context where auth.uid() may not be available

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the function to run with SECURITY DEFINER and set proper context
CREATE OR REPLACE FUNCTION create_default_creator_profile()
RETURNS TRIGGER
SECURITY DEFINER -- This allows the function to bypass RLS
LANGUAGE plpgsql AS $$
BEGIN
  -- Insert the creator profile without RLS restrictions
  INSERT INTO creator_profiles (
    user_id,
    display_name,
    bio,
    skills,
    specialties,
    portfolio_links,
    experience_level,
    availability_status,
    preferred_project_types
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name',
             NEW.raw_user_meta_data->>'full_name',
             split_part(NEW.email, '@', 1)),
    'Game creator looking to collaborate on exciting projects',
    '{}',
    '{}',
    '{}',
    'beginner',
    'available',
    '{}'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create creator profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_creator_profile();

-- Update the RLS policy to allow the system to insert profiles during user creation
-- We'll modify the INSERT policy to be more permissive for the trigger
DROP POLICY IF EXISTS "Users can insert own creator profile" ON creator_profiles;

CREATE POLICY "Users can insert own creator profile" ON creator_profiles
  FOR INSERT
  WITH CHECK (
    -- Allow if the user is authenticated and it's their profile
    auth.uid() = user_id
    OR
    -- Allow during user creation (when auth context might not be fully set)
    auth.uid() IS NULL
  );