-- Create request_comments table for collaboration request messaging
CREATE TABLE request_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference_id UUID REFERENCES project_asset_references(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL CHECK (char_length(comment_text) > 0 AND char_length(comment_text) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX request_comments_reference_id_idx ON request_comments(reference_id, created_at DESC);
CREATE INDEX request_comments_user_id_idx ON request_comments(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view comments on requests they're involved in (requester or asset owner)
CREATE POLICY "Users can view comments on their requests"
  ON request_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_asset_references par
      JOIN assets a ON par.asset_id = a.id
      WHERE par.id = request_comments.reference_id
      AND (par.requested_by = auth.uid() OR a.creator_id = auth.uid())
    )
  );

-- Users can create comments on requests they're involved in
CREATE POLICY "Users can comment on their requests"
  ON request_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_asset_references par
      JOIN assets a ON par.asset_id = a.id
      WHERE par.id = request_comments.reference_id
      AND (par.requested_by = auth.uid() OR a.creator_id = auth.uid())
    )
  );

-- Users can update their own comments (within 5 minutes)
CREATE POLICY "Users can update own comments"
  ON request_comments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- Users can delete their own comments (within 5 minutes)
CREATE POLICY "Users can delete own comments"
  ON request_comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- Add updated_at trigger
CREATE TRIGGER update_request_comments_updated_at
  BEFORE UPDATE ON request_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE request_comments IS 'Comments/messages on collaboration asset reference requests';
COMMENT ON COLUMN request_comments.comment_text IS 'Message text, max 2000 characters';
