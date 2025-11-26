-- Jams Domain
-- Game jams with voting system, prizes, submissions, reviews, and categories

-- ============================================
-- 1. JAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.jams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_end_date TIMESTAMPTZ,
  results_reveal_date TIMESTAMPTZ,
  preview_image_url TEXT,
  preview_image_storage_path TEXT,
  preview_image_mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  CHECK (end_date > start_date),
  CHECK (voting_end_date IS NULL OR voting_end_date > end_date),
  CHECK (results_reveal_date IS NULL OR results_reveal_date > voting_end_date)
);

COMMENT ON TABLE public.jams IS 'Game jam competitions with timeline, voting, and results';

-- ============================================
-- 2. JAM ATTACHMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.jam_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.jam_attachments IS 'Resource files for jams';

-- ============================================
-- 3. JAM PRIZES
-- ============================================

CREATE TABLE IF NOT EXISTS public.jam_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.jam_prizes IS 'Prizes for jam winners';

CREATE TABLE IF NOT EXISTS public.jam_prize_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id UUID NOT NULL REFERENCES public.jam_prizes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.jam_prize_attachments IS 'Images and files for prize descriptions';

-- ============================================
-- 4. JAM PRODUCTS (SUBMISSIONS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.jam_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(jam_id, product_id)
);

COMMENT ON TABLE public.jam_products IS 'Products submitted to jams';

-- ============================================
-- 5. JAM PRODUCT REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS public.jam_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  review_rating INTEGER NOT NULL CHECK (review_rating >= 1 AND review_rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(jam_id, user_id, product_id)
);

COMMENT ON TABLE public.jam_product_reviews IS 'Reviews for products submitted to jams';

-- ============================================
-- 6. JAM CATEGORIES (FOR VOTING)
-- ============================================

CREATE TABLE IF NOT EXISTS public.jam_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(jam_id, title, deleted)
);

COMMENT ON TABLE public.jam_categories IS 'Voting categories (e.g., Best Artwork, Most Innovative). Categories lock when voting opens to prevent changes.';

-- ============================================
-- 7. JAM VOTES (APPROVAL VOTING SYSTEM)
-- ============================================

CREATE TABLE IF NOT EXISTS public.jam_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES public.jams(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.jam_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(jam_id, category_id, user_id, product_id)
);

COMMENT ON TABLE public.jam_votes IS 'Approval voting: users can select up to 3 products per category. NULL submitted_at = draft, NOT NULL = final vote.';

-- ============================================
-- 8. INDEXES
-- ============================================

-- Jams indexes
CREATE INDEX IF NOT EXISTS jams_handle_idx ON public.jams(handle);
CREATE INDEX IF NOT EXISTS jams_user_id_idx ON public.jams(user_id);
CREATE INDEX IF NOT EXISTS jams_status_idx ON public.jams(status);
CREATE INDEX IF NOT EXISTS jams_start_date_idx ON public.jams(start_date);
CREATE INDEX IF NOT EXISTS jams_end_date_idx ON public.jams(end_date);
CREATE INDEX IF NOT EXISTS jams_created_at_idx ON public.jams(created_at DESC);
CREATE INDEX IF NOT EXISTS jams_preview_image_storage_path_idx ON public.jams(preview_image_storage_path);

-- Jam attachments indexes
CREATE INDEX IF NOT EXISTS jam_attachments_jam_id_idx ON public.jam_attachments(jam_id);

-- Jam prizes indexes
CREATE INDEX IF NOT EXISTS jam_prizes_jam_id_idx ON public.jam_prizes(jam_id);

-- Jam prize attachments indexes
CREATE INDEX IF NOT EXISTS jam_prize_attachments_prize_id_idx ON public.jam_prize_attachments(prize_id);

-- Jam products indexes
CREATE INDEX IF NOT EXISTS jam_products_jam_id_idx ON public.jam_products(jam_id);
CREATE INDEX IF NOT EXISTS jam_products_product_id_idx ON public.jam_products(product_id);

-- Jam product reviews indexes
CREATE INDEX IF NOT EXISTS jam_product_reviews_jam_id_idx ON public.jam_product_reviews(jam_id);
CREATE INDEX IF NOT EXISTS jam_product_reviews_product_id_idx ON public.jam_product_reviews(product_id);
CREATE INDEX IF NOT EXISTS jam_product_reviews_user_id_idx ON public.jam_product_reviews(user_id);
CREATE INDEX IF NOT EXISTS jam_product_reviews_rating_idx ON public.jam_product_reviews(review_rating);

-- Jam categories indexes
CREATE INDEX IF NOT EXISTS jam_categories_jam_id_idx ON public.jam_categories(jam_id);
CREATE INDEX IF NOT EXISTS jam_categories_position_idx ON public.jam_categories(position);

-- Jam votes indexes
CREATE INDEX IF NOT EXISTS jam_votes_jam_id_idx ON public.jam_votes(jam_id);
CREATE INDEX IF NOT EXISTS jam_votes_category_id_idx ON public.jam_votes(category_id);
CREATE INDEX IF NOT EXISTS jam_votes_user_id_idx ON public.jam_votes(user_id);
CREATE INDEX IF NOT EXISTS jam_votes_product_id_idx ON public.jam_votes(product_id);
CREATE INDEX IF NOT EXISTS jam_votes_submitted_idx ON public.jam_votes(submitted_at) WHERE submitted_at IS NOT NULL;

-- ============================================
-- 9. TRIGGERS
-- ============================================

CREATE TRIGGER set_updated_at_jams
  BEFORE UPDATE ON public.jams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jam_attachments
  BEFORE UPDATE ON public.jam_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jam_prizes
  BEFORE UPDATE ON public.jam_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jam_prize_attachments
  BEFORE UPDATE ON public.jam_prize_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jam_products
  BEFORE UPDATE ON public.jam_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jam_product_reviews
  BEFORE UPDATE ON public.jam_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jam_categories
  BEFORE UPDATE ON public.jam_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_jam_votes
  BEFORE UPDATE ON public.jam_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 10. VOTING FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to lock categories when voting opens
CREATE OR REPLACE FUNCTION lock_categories_on_voting_open()
RETURNS TRIGGER AS $$
BEGIN
  -- If voting_end_date is being set and jam has ended, lock categories
  IF NEW.voting_end_date IS NOT NULL
     AND OLD.voting_end_date IS NULL
     AND NOW() > NEW.end_date THEN
    UPDATE public.jam_categories
    SET locked = TRUE
    WHERE jam_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION lock_categories_on_voting_open() IS
  'Automatically locks voting categories when voting period opens to prevent changes';

CREATE TRIGGER lock_categories_trigger
  AFTER UPDATE OF voting_end_date ON public.jams
  FOR EACH ROW
  EXECUTE FUNCTION lock_categories_on_voting_open();

-- Function to prevent category changes when locked
CREATE OR REPLACE FUNCTION prevent_locked_category_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.locked = TRUE AND (
    NEW.title != OLD.title OR
    NEW.deleted != OLD.deleted
  ) THEN
    RAISE EXCEPTION 'Cannot modify locked categories';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_locked_category_changes() IS
  'Prevents modifying or deleting locked categories during voting period';

CREATE TRIGGER prevent_category_changes_when_locked
  BEFORE UPDATE ON public.jam_categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_category_changes();

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.jams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_prize_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jam_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jams
CREATE POLICY "Jams are publicly viewable"
  ON public.jams FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Users can create jams"
  ON public.jams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Jam owners can update jams"
  ON public.jams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Jam owners can delete jams"
  ON public.jams FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for jam_attachments
CREATE POLICY "Jam attachments are publicly viewable"
  ON public.jam_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_attachments.jam_id
      AND jams.deleted = FALSE
    )
  );

CREATE POLICY "Jam owners can manage attachments"
  ON public.jam_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_attachments.jam_id
      AND jams.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_prizes
CREATE POLICY "Jam prizes are publicly viewable"
  ON public.jam_prizes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_prizes.jam_id
      AND jams.deleted = FALSE
    )
  );

CREATE POLICY "Jam owners can manage prizes"
  ON public.jam_prizes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_prizes.jam_id
      AND jams.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_prize_attachments
CREATE POLICY "Prize attachments are publicly viewable"
  ON public.jam_prize_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jam_prizes jp
      JOIN public.jams j ON j.id = jp.jam_id
      WHERE jp.id = jam_prize_attachments.prize_id
      AND j.deleted = FALSE
    )
  );

CREATE POLICY "Jam owners can manage prize attachments"
  ON public.jam_prize_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jam_prizes jp
      JOIN public.jams j ON j.id = jp.jam_id
      WHERE jp.id = jam_prize_attachments.prize_id
      AND j.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_products
CREATE POLICY "Jam products are publicly viewable"
  ON public.jam_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_products.jam_id
      AND jams.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can submit to active jams"
  ON public.jam_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_id
      AND products.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_id
      AND jams.status = 'active'
    )
  );

CREATE POLICY "Product owners can remove own submissions"
  ON public.jam_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = jam_products.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_product_reviews
CREATE POLICY "Jam product reviews are publicly viewable"
  ON public.jam_product_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_product_reviews.jam_id
      AND jams.deleted = FALSE
      AND jam_product_reviews.deleted = FALSE
    )
  );

CREATE POLICY "Users can review jam products"
  ON public.jam_product_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.jam_products
      WHERE jam_products.jam_id = jam_id
      AND jam_products.product_id = product_id
      AND jam_products.deleted = FALSE
    )
  );

CREATE POLICY "Users can update own reviews"
  ON public.jam_product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.jam_product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for jam_categories
CREATE POLICY "Categories are publicly viewable"
  ON public.jam_categories FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Jam owners can create categories"
  ON public.jam_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_categories.jam_id
      AND jams.user_id = auth.uid()
    )
  );

CREATE POLICY "Jam owners can update categories"
  ON public.jam_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_categories.jam_id
      AND jams.user_id = auth.uid()
    )
  );

CREATE POLICY "Jam owners can delete categories"
  ON public.jam_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_categories.jam_id
      AND jams.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_votes
CREATE POLICY "Votes are viewable after results reveal"
  ON public.jam_votes FOR SELECT
  USING (
    -- Users can always see their own votes
    auth.uid() = user_id
    OR
    -- Everyone can see votes after results are revealed
    EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_votes.jam_id
      AND jams.results_reveal_date IS NOT NULL
      AND NOW() >= jams.results_reveal_date
    )
  );

CREATE POLICY "Users can vote during voting window"
  ON public.jam_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.jams
      WHERE jams.id = jam_id
      AND NOW() > jams.end_date
      AND jams.voting_end_date IS NOT NULL
      AND NOW() <= jams.voting_end_date
    )
    -- Prevent voting for own products
    AND user_id != (
      SELECT user_id FROM public.products WHERE id = product_id
    )
    -- Ensure product was submitted to this jam
    AND EXISTS (
      SELECT 1 FROM public.jam_products
      WHERE jam_products.jam_id = jam_id
      AND jam_products.product_id = product_id
      AND jam_products.deleted = FALSE
    )
  );

CREATE POLICY "Users can update own draft votes"
  ON public.jam_votes FOR UPDATE
  USING (
    auth.uid() = user_id
    AND submitted_at IS NULL
  );

CREATE POLICY "Users can delete own draft votes"
  ON public.jam_votes FOR DELETE
  USING (
    auth.uid() = user_id
    AND submitted_at IS NULL
  );
