-- Add voting system to jams
-- Implements approval voting (up to 3 selections per category)
-- Users vote during voting window, results revealed after voting closes

-- ============================================
-- UPDATE JAMS TABLE
-- ============================================

-- Add voting date columns to jams table
ALTER TABLE jams ADD COLUMN voting_end_date TIMESTAMPTZ;
ALTER TABLE jams ADD COLUMN results_reveal_date TIMESTAMPTZ;

-- Add constraints for voting dates
ALTER TABLE jams ADD CONSTRAINT voting_dates_check
  CHECK (voting_end_date IS NULL OR voting_end_date > end_date);

ALTER TABLE jams ADD CONSTRAINT results_dates_check
  CHECK (results_reveal_date IS NULL OR results_reveal_date > voting_end_date);

-- ============================================
-- JAM CATEGORIES TABLE
-- ============================================

-- Create categories table for voting (e.g., "Best Artwork", "Most Innovative")
CREATE TABLE IF NOT EXISTS jam_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES jams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT FALSE, -- Lock categories when voting opens
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  UNIQUE(jam_id, title, deleted) -- Prevent duplicate category names per jam
);

-- ============================================
-- JAM VOTES TABLE
-- ============================================

-- Create votes table for approval voting
CREATE TABLE IF NOT EXISTS jam_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jam_id UUID NOT NULL REFERENCES jams(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES jam_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ, -- NULL = draft, NOT NULL = final vote
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(jam_id, category_id, user_id, product_id) -- One vote per product per category per user
);

-- ============================================
-- INDEXES
-- ============================================

-- Indexes for jam_categories
CREATE INDEX IF NOT EXISTS jam_categories_jam_id_idx ON jam_categories(jam_id);
CREATE INDEX IF NOT EXISTS jam_categories_position_idx ON jam_categories(position);

-- Indexes for jam_votes
CREATE INDEX IF NOT EXISTS jam_votes_jam_id_idx ON jam_votes(jam_id);
CREATE INDEX IF NOT EXISTS jam_votes_category_id_idx ON jam_votes(category_id);
CREATE INDEX IF NOT EXISTS jam_votes_user_id_idx ON jam_votes(user_id);
CREATE INDEX IF NOT EXISTS jam_votes_product_id_idx ON jam_votes(product_id);
CREATE INDEX IF NOT EXISTS jam_votes_submitted_idx ON jam_votes(submitted_at) WHERE submitted_at IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE jam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jam_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jam_categories
CREATE POLICY "Categories are publicly viewable"
  ON jam_categories FOR SELECT
  USING (deleted = FALSE);

CREATE POLICY "Jam owners can create categories"
  ON jam_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_categories.jam_id
      AND jams.user_id = auth.uid()
    )
  );

CREATE POLICY "Jam owners can update categories"
  ON jam_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_categories.jam_id
      AND jams.user_id = auth.uid()
    )
  );

CREATE POLICY "Jam owners can delete categories"
  ON jam_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_categories.jam_id
      AND jams.user_id = auth.uid()
    )
  );

-- RLS Policies for jam_votes
CREATE POLICY "Votes are viewable after results reveal"
  ON jam_votes FOR SELECT
  USING (
    -- Users can always see their own votes
    auth.uid() = user_id
    OR
    -- Everyone can see votes after results are revealed
    EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_votes.jam_id
      AND jams.results_reveal_date IS NOT NULL
      AND NOW() >= jams.results_reveal_date
    )
  );

CREATE POLICY "Users can vote during voting window"
  ON jam_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM jams
      WHERE jams.id = jam_id
      AND NOW() > jams.end_date
      AND jams.voting_end_date IS NOT NULL
      AND NOW() <= jams.voting_end_date
    )
    -- Prevent voting for own products
    AND user_id != (
      SELECT user_id FROM products WHERE id = product_id
    )
    -- Ensure product was submitted to this jam
    AND EXISTS (
      SELECT 1 FROM jam_products
      WHERE jam_products.jam_id = jam_id
      AND jam_products.product_id = product_id
      AND jam_products.deleted = FALSE
    )
  );

CREATE POLICY "Users can update own draft votes"
  ON jam_votes FOR UPDATE
  USING (
    auth.uid() = user_id
    AND submitted_at IS NULL
  );

CREATE POLICY "Users can delete own draft votes"
  ON jam_votes FOR DELETE
  USING (
    auth.uid() = user_id
    AND submitted_at IS NULL
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_jam_categories
  BEFORE UPDATE ON jam_categories
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_jam_votes
  BEFORE UPDATE ON jam_votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to lock categories when voting opens
CREATE OR REPLACE FUNCTION lock_categories_on_voting_open()
RETURNS TRIGGER AS $$
BEGIN
  -- If voting_end_date is being set and jam has ended, lock categories
  IF NEW.voting_end_date IS NOT NULL
     AND OLD.voting_end_date IS NULL
     AND NOW() > NEW.end_date THEN
    UPDATE jam_categories
    SET locked = TRUE
    WHERE jam_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_categories_trigger
  AFTER UPDATE OF voting_end_date ON jams
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

CREATE TRIGGER prevent_category_changes_when_locked
  BEFORE UPDATE ON jam_categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_locked_category_changes();
