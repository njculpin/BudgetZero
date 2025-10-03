-- Victory Points System for Workshop
-- Rewards users for playtesting, reviewing, and community engagement

-- User Victory Points balance
CREATE TABLE user_victory_points (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_points INTEGER DEFAULT 0 NOT NULL CHECK (total_points >= 0),
  lifetime_earned INTEGER DEFAULT 0 NOT NULL CHECK (lifetime_earned >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Victory Points transaction log
CREATE TABLE victory_points_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL, -- positive for earned, negative for spent
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'playtest_review',
    'review_upvoted',
    'review_downvoted',
    'helpful_comment',
    'project_completion',
    'manual_adjustment'
  )),
  reference_type TEXT CHECK (reference_type IN ('comment', 'review', 'project', 'other')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table (extends comments for playtesting)
CREATE TABLE playtest_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) >= 50 AND char_length(review_text) <= 5000),
  playtime_hours DECIMAL(4,1) CHECK (playtime_hours > 0),
  playtest_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE, -- verified by project owner
  upvotes INTEGER DEFAULT 0 NOT NULL CHECK (upvotes >= 0),
  downvotes INTEGER DEFAULT 0 NOT NULL CHECK (downvotes >= 0),
  vp_earned INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id, playtest_date)
);

-- Review votes (users vote on review quality)
CREATE TABLE review_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES playtest_reviews(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, voter_id)
);

-- Indexes
CREATE INDEX victory_points_transactions_user_id_idx ON victory_points_transactions(user_id, created_at DESC);
CREATE INDEX victory_points_transactions_type_idx ON victory_points_transactions(transaction_type, created_at DESC);
CREATE INDEX playtest_reviews_project_id_idx ON playtest_reviews(project_id, created_at DESC);
CREATE INDEX playtest_reviews_reviewer_id_idx ON playtest_reviews(reviewer_id, created_at DESC);
CREATE INDEX review_votes_review_id_idx ON review_votes(review_id);

-- Enable RLS
ALTER TABLE user_victory_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE victory_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playtest_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Victory Points Balance
CREATE POLICY "Users can view their own VP balance"
  ON user_victory_points FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view others' VP balance"
  ON user_victory_points FOR SELECT
  USING (true);

-- RLS Policies: VP Transactions
CREATE POLICY "Users can view their own transactions"
  ON victory_points_transactions FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies: Playtest Reviews
CREATE POLICY "Anyone can view published reviews"
  ON playtest_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON playtest_reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update own reviews within 24 hours"
  ON playtest_reviews FOR UPDATE
  USING (
    reviewer_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

CREATE POLICY "Users can delete own reviews within 24 hours"
  ON playtest_reviews FOR DELETE
  USING (
    reviewer_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- RLS Policies: Review Votes
CREATE POLICY "Anyone can view votes"
  ON review_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on reviews"
  ON review_votes FOR INSERT
  WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Users can update own votes"
  ON review_votes FOR UPDATE
  USING (voter_id = auth.uid());

CREATE POLICY "Users can delete own votes"
  ON review_votes FOR DELETE
  USING (voter_id = auth.uid());

-- Triggers
CREATE TRIGGER update_playtest_reviews_updated_at
  BEFORE UPDATE ON playtest_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to award Victory Points
CREATE OR REPLACE FUNCTION award_victory_points(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert transaction
  INSERT INTO victory_points_transactions (
    user_id,
    points,
    transaction_type,
    reference_type,
    reference_id,
    description
  ) VALUES (
    p_user_id,
    p_points,
    p_transaction_type,
    p_reference_type,
    p_reference_id,
    p_description
  );

  -- Update user balance
  INSERT INTO user_victory_points (user_id, total_points, lifetime_earned)
  VALUES (p_user_id, p_points, GREATEST(p_points, 0))
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = user_victory_points.total_points + p_points,
    lifetime_earned = user_victory_points.lifetime_earned + GREATEST(p_points, 0),
    updated_at = NOW();
END;
$$;

-- Function to handle review vote changes
CREATE OR REPLACE FUNCTION handle_review_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  review_author_id UUID;
  vp_delta INTEGER;
BEGIN
  -- Get review author
  SELECT reviewer_id INTO review_author_id
  FROM playtest_reviews
  WHERE id = NEW.review_id;

  -- Don't allow self-voting
  IF review_author_id = NEW.voter_id THEN
    RAISE EXCEPTION 'Cannot vote on your own review';
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Update review vote counts
    IF NEW.vote_type = 'upvote' THEN
      UPDATE playtest_reviews SET upvotes = upvotes + 1 WHERE id = NEW.review_id;
      vp_delta := 5; -- Award 5 VP for upvote
    ELSE
      UPDATE playtest_reviews SET downvotes = downvotes + 1 WHERE id = NEW.review_id;
      vp_delta := -2; -- Deduct 2 VP for downvote
    END IF;

    -- Award/deduct VP to review author
    PERFORM award_victory_points(
      review_author_id,
      vp_delta,
      'review_' || NEW.vote_type,
      'review',
      NEW.review_id,
      'Review ' || NEW.vote_type
    );

  ELSIF TG_OP = 'UPDATE' AND OLD.vote_type != NEW.vote_type THEN
    -- Handle vote change (upvote -> downvote or vice versa)
    IF OLD.vote_type = 'upvote' THEN
      UPDATE playtest_reviews SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.review_id;
      vp_delta := -7; -- Remove 5 VP from upvote, deduct 2 for downvote
    ELSE
      UPDATE playtest_reviews SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.review_id;
      vp_delta := 7; -- Remove -2 VP from downvote, add 5 for upvote
    END IF;

    PERFORM award_victory_points(
      review_author_id,
      vp_delta,
      'review_vote_changed',
      'review',
      NEW.review_id,
      'Vote changed from ' || OLD.vote_type || ' to ' || NEW.vote_type
    );

  ELSIF TG_OP = 'DELETE' THEN
    -- Remove vote
    IF OLD.vote_type = 'upvote' THEN
      UPDATE playtest_reviews SET upvotes = upvotes - 1 WHERE id = OLD.review_id;
      vp_delta := -5;
    ELSE
      UPDATE playtest_reviews SET downvotes = downvotes - 1 WHERE id = OLD.review_id;
      vp_delta := 2;
    END IF;

    PERFORM award_victory_points(
      review_author_id,
      vp_delta,
      'review_vote_removed',
      'review',
      OLD.review_id,
      'Vote removed'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER review_vote_trigger
  AFTER INSERT OR UPDATE OR DELETE ON review_votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_review_vote();

-- Function to award VP for new playtest review
CREATE OR REPLACE FUNCTION award_review_vp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_vp INTEGER := 50; -- Base VP for submitting review
BEGIN
  -- Award base VP for creating review
  PERFORM award_victory_points(
    NEW.reviewer_id,
    base_vp,
    'playtest_review',
    'review',
    NEW.id,
    'Submitted playtest review'
  );

  -- Update VP earned on review
  NEW.vp_earned := base_vp;

  RETURN NEW;
END;
$$;

CREATE TRIGGER award_review_vp_trigger
  BEFORE INSERT ON playtest_reviews
  FOR EACH ROW
  EXECUTE FUNCTION award_review_vp();

COMMENT ON TABLE user_victory_points IS 'User Victory Points balance and lifetime totals';
COMMENT ON TABLE victory_points_transactions IS 'Log of all VP transactions';
COMMENT ON TABLE playtest_reviews IS 'Playtest reviews that earn Victory Points';
COMMENT ON TABLE review_votes IS 'Community votes on review quality';
COMMENT ON FUNCTION award_victory_points IS 'Awards Victory Points to a user and logs transaction';
