-- Add new fields to profiles table for settings functionality

-- Profile information fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Privacy settings fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_email_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_collaboration_requests BOOLEAN DEFAULT true;

-- Notification preferences as JSONB
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_enabled": true,
  "in_app_enabled": true,
  "collaboration_requests": true,
  "project_updates": true,
  "marketplace_sales": true,
  "playtest_reviews": true,
  "comments": true,
  "marketing": false,
  "frequency": "instant"
}'::jsonb;

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
