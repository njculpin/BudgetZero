-- Restrict asset chat to contributors only
-- This migration updates RLS policies to ensure only asset collaborators can view and post chat messages

-- Drop existing chat message policies
DROP POLICY IF EXISTS "Chat messages visible for published assets" ON asset_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can post chat messages" ON asset_chat_messages;

-- Create new policies that restrict to collaborators only
CREATE POLICY "Chat messages visible to collaborators only"
  ON asset_chat_messages FOR SELECT
  USING (
    -- User is a collaborator on this asset
    EXISTS (
      SELECT 1 FROM asset_collaborators
      WHERE asset_collaborators.asset_id = asset_chat_messages.asset_id
      AND asset_collaborators.user_id = auth.uid()
      AND asset_collaborators.deleted = FALSE
    )
    OR
    -- User is the asset owner
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_chat_messages.asset_id
      AND assets.user_id = auth.uid()
      AND assets.deleted = FALSE
    )
  );

CREATE POLICY "Collaborators can post chat messages"
  ON asset_chat_messages FOR INSERT
  WITH CHECK (
    -- User is a collaborator on this asset
    (
      EXISTS (
        SELECT 1 FROM asset_collaborators
        WHERE asset_collaborators.asset_id = asset_id
        AND asset_collaborators.user_id = auth.uid()
        AND asset_collaborators.deleted = FALSE
      )
      OR
      -- User is the asset owner
      EXISTS (
        SELECT 1 FROM assets
        WHERE assets.id = asset_id
        AND assets.user_id = auth.uid()
        AND assets.deleted = FALSE
      )
    )
    AND auth.uid() = user_id
  );

-- Update reaction policies to match (restrict to collaborators)
DROP POLICY IF EXISTS "Reactions visible with messages" ON asset_chat_message_reactions;
DROP POLICY IF EXISTS "Authenticated users can react to messages" ON asset_chat_message_reactions;

CREATE POLICY "Reactions visible to collaborators"
  ON asset_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM asset_chat_messages acm
      JOIN asset_collaborators ac ON ac.asset_id = acm.asset_id
      WHERE acm.id = asset_chat_message_reactions.message_id
      AND ac.user_id = auth.uid()
      AND ac.deleted = FALSE
    )
    OR
    EXISTS (
      SELECT 1 FROM asset_chat_messages acm
      JOIN assets a ON a.id = acm.asset_id
      WHERE acm.id = asset_chat_message_reactions.message_id
      AND a.user_id = auth.uid()
      AND a.deleted = FALSE
    )
  );

CREATE POLICY "Collaborators can react to messages"
  ON asset_chat_message_reactions FOR ALL
  USING (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM asset_chat_messages acm
        JOIN asset_collaborators ac ON ac.asset_id = acm.asset_id
        WHERE acm.id = message_id
        AND ac.user_id = auth.uid()
        AND ac.deleted = FALSE
      )
      OR
      EXISTS (
        SELECT 1 FROM asset_chat_messages acm
        JOIN assets a ON a.id = acm.asset_id
        WHERE acm.id = message_id
        AND a.user_id = auth.uid()
        AND a.deleted = FALSE
      )
    )
  );

-- Update attachment policies to match (restrict to collaborators)
DROP POLICY IF EXISTS "Attachments visible with messages" ON asset_chat_message_attachments;

CREATE POLICY "Attachments visible to collaborators"
  ON asset_chat_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM asset_chat_messages acm
      JOIN asset_collaborators ac ON ac.asset_id = acm.asset_id
      WHERE acm.id = asset_chat_message_attachments.message_id
      AND ac.user_id = auth.uid()
      AND ac.deleted = FALSE
    )
    OR
    EXISTS (
      SELECT 1 FROM asset_chat_messages acm
      JOIN assets a ON a.id = acm.asset_id
      WHERE acm.id = asset_chat_message_attachments.message_id
      AND a.user_id = auth.uid()
      AND a.deleted = FALSE
    )
  );
