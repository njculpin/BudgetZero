-- Create creator profiles table for showcasing creator capabilities and facilitating collaboration

-- Experience levels enum
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Availability status enum
CREATE TYPE availability_status AS ENUM ('available', 'limited', 'unavailable');

-- Creator profiles table
CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  portfolio_links TEXT[] DEFAULT '{}',
  experience_level experience_level DEFAULT 'beginner',
  availability_status availability_status DEFAULT 'available',
  preferred_project_types TEXT[] DEFAULT '{}',
  rate_range TEXT,
  location TEXT,
  time_zone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_profile UNIQUE(user_id),
  CONSTRAINT display_name_length CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 50),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Indexes for performance
CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_availability ON creator_profiles(availability_status);
CREATE INDEX idx_creator_profiles_experience ON creator_profiles(experience_level);
CREATE INDEX idx_creator_profiles_skills ON creator_profiles USING GIN(skills);
CREATE INDEX idx_creator_profiles_specialties ON creator_profiles USING GIN(specialties);
CREATE INDEX idx_creator_profiles_project_types ON creator_profiles USING GIN(preferred_project_types);

-- Enable RLS
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read creator profiles (for discovery)
CREATE POLICY "Creator profiles are viewable by everyone" ON creator_profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own creator profile" ON creator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own creator profile" ON creator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own creator profile" ON creator_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_creator_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_profile_updated_at();

-- Function to create default creator profile when user signs up
CREATE OR REPLACE FUNCTION create_default_creator_profile()
RETURNS TRIGGER AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_creator_profile();