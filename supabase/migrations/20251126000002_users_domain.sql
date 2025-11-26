-- Users Domain
-- Users, social features (tags, reviews, follows), and role-based access

-- ============================================
-- 1. USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    bio TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    stripe_account_id TEXT,
    stripe_customer_id TEXT,
    stripe_connect_account_id TEXT,
    stripe_connect_onboarded BOOLEAN DEFAULT FALSE,
    stripe_connect_details_submitted BOOLEAN DEFAULT FALSE,
    stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE,
    stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.users IS 'User profiles with Stripe integration for payments and payouts';
COMMENT ON COLUMN public.users.role IS 'User role: user (default) or admin';
COMMENT ON COLUMN public.users.stripe_account_id IS 'Stripe customer account ID';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for purchases';
COMMENT ON COLUMN public.users.stripe_connect_account_id IS 'Stripe Connect account ID for receiving payouts';
COMMENT ON COLUMN public.users.stripe_connect_onboarded IS 'Whether user has completed Stripe Connect onboarding';
COMMENT ON COLUMN public.users.stripe_connect_details_submitted IS 'Whether user has submitted required details to Stripe';
COMMENT ON COLUMN public.users.stripe_connect_charges_enabled IS 'Whether Stripe account can accept charges';
COMMENT ON COLUMN public.users.stripe_connect_payouts_enabled IS 'Whether Stripe account can receive payouts';

-- ============================================
-- 2. USER SOCIAL TABLES
-- ============================================

-- User tags (skills, specialties, interests)
CREATE TABLE IF NOT EXISTS public.user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, value)
);

COMMENT ON TABLE public.user_tags IS 'User skills, specialties, and interests for profile discovery';

-- User reviews (peer reviews)
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_rating INTEGER NOT NULL CHECK (review_rating >= 1 AND review_rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, reviewer_id),
  CHECK (user_id != reviewer_id)
);

COMMENT ON TABLE public.user_reviews IS 'Peer reviews between users for reputation building';

-- User follows (social following)
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

COMMENT ON TABLE public.user_follows IS 'Social following relationships between users';

-- ============================================
-- 3. INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS users_handle_idx ON public.users(handle);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role) WHERE role = 'admin';

-- User tags indexes
CREATE INDEX IF NOT EXISTS user_tags_user_id_idx ON public.user_tags(user_id);
CREATE INDEX IF NOT EXISTS user_tags_value_idx ON public.user_tags(value);

-- User reviews indexes
CREATE INDEX IF NOT EXISTS user_reviews_user_id_idx ON public.user_reviews(user_id);
CREATE INDEX IF NOT EXISTS user_reviews_reviewer_id_idx ON public.user_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS user_reviews_rating_idx ON public.user_reviews(review_rating);

-- User follows indexes
CREATE INDEX IF NOT EXISTS user_follows_follower_id_idx ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_id_idx ON public.user_follows(following_id);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_tags
  BEFORE UPDATE ON public.user_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_reviews
  BEFORE UPDATE ON public.user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_follows
  BEFORE UPDATE ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_handle TEXT;
    handle_exists BOOLEAN;
    counter INTEGER := 1;
BEGIN
    -- Create handle from email (before @)
    new_handle := LOWER(SPLIT_PART(NEW.email, '@', 1));

    -- Check if handle exists
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE handle = new_handle
    ) INTO handle_exists;

    -- If handle exists, append a number
    WHILE handle_exists LOOP
        new_handle := LOWER(SPLIT_PART(NEW.email, '@', 1)) || counter::TEXT;
        counter := counter + 1;

        SELECT EXISTS (
            SELECT 1 FROM public.users WHERE handle = new_handle
        ) INTO handle_exists;
    END LOOP;

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

COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a user profile when a new auth user signs up';

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.users
    FOR SELECT
    USING (deleted = false);

CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for user_tags
CREATE POLICY "User tags are publicly viewable"
  ON public.user_tags FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Users can manage own tags"
  ON public.user_tags FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for user_reviews
CREATE POLICY "User reviews are publicly viewable"
  ON public.user_reviews FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Users can create reviews for others"
  ON public.user_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews"
  ON public.user_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can delete own reviews"
  ON public.user_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- RLS Policies for user_follows
CREATE POLICY "User follows are publicly viewable"
  ON public.user_follows FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can manage own follows"
  ON public.user_follows FOR ALL
  USING (auth.uid() = follower_id);
