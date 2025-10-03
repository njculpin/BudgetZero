-- Create notifications table for in-app messaging
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'asset_reference_request',
    'asset_reference_approved',
    'asset_reference_rejected',
    'project_collaboration_invite',
    'project_published',
    'comment_mention',
    'system_announcement'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient querying
CREATE INDEX notifications_user_id_is_read_idx ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX notifications_user_id_created_at_idx ON notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE notifications IS 'In-app notifications for user actions and events';
COMMENT ON COLUMN notifications.type IS 'Type of notification to determine icon and action';
COMMENT ON COLUMN notifications.metadata IS 'Additional data like reference_id, project_id, asset_id';
