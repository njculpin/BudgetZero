-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    bio TEXT,
    avatar_url TEXT,
    stripe_account_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Add RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read all public profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.users
    FOR SELECT
    USING (deleted = false);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Create index on handle for lookups
CREATE INDEX IF NOT EXISTS users_handle_idx ON public.users(handle);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    random_suffix TEXT;
    new_handle TEXT;
BEGIN
    -- Generate a random 4-character suffix
    random_suffix := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);

    -- Create handle from email (before @) + random suffix
    new_handle := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || random_suffix;

    -- Insert into public.users
    INSERT INTO public.users (id, email, handle, name)
    VALUES (
        NEW.id,
        NEW.email,
        new_handle,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
