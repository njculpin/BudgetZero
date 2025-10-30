-- Create jam (game jam) system tables
-- Community game creation competitions with prizes and reviews

-- ============================================
-- JAMS TABLE
-- ============================================

-- Create jams table
CREATE TABLE IF NOT EXISTS jams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  CHECK (end_date > start_date)
);

-- ============================================
-- JAM ATTACHMENTS TABLE
-- ============================================

-- Create jam_attachments table
CREATE TABLE IF NOT EXISTS jam_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES jams(id) ON DELETE CASCADE,
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

-- ============================================
-- JAM PRIZES TABLE
-- ============================================

-- Create jam_prizes table
CREATE TABLE IF NOT EXISTS jam_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES jams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create jam_prize_attachments table
CREATE TABLE IF NOT EXISTS jam_prize_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id UUID NOT NULL REFERENCES jam_prizes(id) ON DELETE CASCADE,
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

-- ============================================
-- JAM PRODUCTS TABLE
-- ============================================

-- Create jam_products table (products submitted to jams)
CREATE TABLE IF NOT EXISTS jam_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES jams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(jam_id, product_id)
);

-- ============================================
-- JAM PRODUCT REVIEWS TABLE
-- ============================================

-- Create jam_product_reviews table
CREATE TABLE IF NOT EXISTS jam_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES jams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  review_rating INTEGER NOT NULL CHECK (review_rating >= 1 AND review_rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(jam_id, user_id, product_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for jams
CREATE INDEX IF NOT EXISTS jams_handle_idx ON jams(handle);
CREATE INDEX IF NOT EXISTS jams_user_id_idx ON jams(user_id);
CREATE INDEX IF NOT EXISTS jams_status_idx ON jams(status);
CREATE INDEX IF NOT EXISTS jams_start_date_idx ON jams(start_date);
CREATE INDEX IF NOT EXISTS jams_end_date_idx ON jams(end_date);
CREATE INDEX IF NOT EXISTS jams_created_at_idx ON jams(created_at DESC);

-- Indexes for jam_attachments
CREATE INDEX IF NOT EXISTS jam_attachments_jam_id_idx ON jam_attachments(jam_id);

-- Indexes for jam_prizes
CREATE INDEX IF NOT EXISTS jam_prizes_jam_id_idx ON jam_prizes(jam_id);

-- Indexes for jam_prize_attachments
CREATE INDEX IF NOT EXISTS jam_prize_attachments_prize_id_idx ON jam_prize_attachments(prize_id);

-- Indexes for jam_products
CREATE INDEX IF NOT EXISTS jam_products_jam_id_idx ON jam_products(jam_id);
CREATE INDEX IF NOT EXISTS jam_products_product_id_idx ON jam_products(product_id);

-- Indexes for jam_product_reviews
CREATE INDEX IF NOT EXISTS jam_product_reviews_jam_id_idx ON jam_product_reviews(jam_id);
CREATE INDEX IF NOT EXISTS jam_product_reviews_product_id_idx ON jam_product_reviews(product_id);
CREATE INDEX IF NOT EXISTS jam_product_reviews_user_id_idx ON jam_product_reviews(user_id);
CREATE INDEX IF NOT EXISTS jam_product_reviews_rating_idx ON jam_product_reviews(review_rating);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE jams ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_prize_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_product_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jams
CREATE POLICY "Jams are publicly viewable"
  ON jams FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Users can create jams"
  ON jams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Jam owners can update jams"
  ON jams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Jam owners can delete jams"
  ON jams FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for jam_attachments
CREATE POLICY "Jam attachments are publicly viewable"
  ON jam_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_attachments.jam_id
      AND jams.deleted = FALSE
    )
  );

CREATE POLICY "Jam owners can manage attachments"
  ON jam_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_attachments.jam_id
      AND jams.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_prizes
CREATE POLICY "Jam prizes are publicly viewable"
  ON jam_prizes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_prizes.jam_id
      AND jams.deleted = FALSE
    )
  );

CREATE POLICY "Jam owners can manage prizes"
  ON jam_prizes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_prizes.jam_id
      AND jams.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_prize_attachments
CREATE POLICY "Prize attachments are publicly viewable"
  ON jam_prize_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jam_prizes jp
      JOIN jams j ON j.id = jp.jam_id
      WHERE jp.id = jam_prize_attachments.prize_id
      AND j.deleted = FALSE
    )
  );

CREATE POLICY "Jam owners can manage prize attachments"
  ON jam_prize_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jam_prizes jp
      JOIN jams j ON j.id = jp.jam_id
      WHERE jp.id = jam_prize_attachments.prize_id
      AND j.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_products
CREATE POLICY "Jam products are publicly viewable"
  ON jam_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_products.jam_id
      AND jams.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can submit to active jams"
  ON jam_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
      AND products.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_id
      AND jams.status = 'active'
    )
  );

CREATE POLICY "Product owners can remove own submissions"
  ON jam_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = jam_products.product_id
      AND products.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_product_reviews
CREATE POLICY "Jam product reviews are publicly viewable"
  ON jam_product_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_product_reviews.jam_id
      AND jams.deleted = FALSE
      AND jam_product_reviews.deleted = FALSE
    )
  );

CREATE POLICY "Users can review jam products"
  ON jam_product_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM jam_products
      WHERE jam_products.jam_id = jam_id
      AND jam_products.product_id = product_id
      AND jam_products.deleted = FALSE
    )
  );

CREATE POLICY "Users can update own reviews"
  ON jam_product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON jam_product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_jams
  BEFORE UPDATE ON jams
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_jam_attachments
  BEFORE UPDATE ON jam_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_jam_prizes
  BEFORE UPDATE ON jam_prizes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_jam_prize_attachments
  BEFORE UPDATE ON jam_prize_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_jam_products
  BEFORE UPDATE ON jam_products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_jam_product_reviews
  BEFORE UPDATE ON jam_product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
