-- Restrict product chat to contributors only
-- This migration updates RLS policies to ensure only product contributors can view and post chat messages
-- Similar to how asset chat works

-- Drop existing permissive chat message policies
DROP POLICY IF EXISTS "Chat messages visible for published products" ON product_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can post chat messages" ON product_chat_messages;

-- Create new policies that restrict to contributors only
-- Contributors are defined as:
-- 1. Product owner
-- 2. Users who have royalties on assets linked to the product's variants

CREATE POLICY "Chat messages visible to contributors only"
  ON product_chat_messages FOR SELECT
  USING (
    -- User is the product owner
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_chat_messages.product_id
      AND products.user_id = auth.uid()
      AND products.deleted = FALSE
    )
    OR
    -- User has royalties on assets linked to this product's variants
    EXISTS (
      SELECT 1 FROM products p
      JOIN product_variants pv ON pv.product_id = p.id
      JOIN product_assets pa ON pa.variant_id = pv.id
      JOIN asset_royalties ar ON ar.asset_id = pa.asset_id
      WHERE p.id = product_chat_messages.product_id
      AND ar.user_id = auth.uid()
      AND ar.deleted = FALSE
      AND pv.deleted = FALSE
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Contributors can post chat messages"
  ON product_chat_messages FOR INSERT
  WITH CHECK (
    -- User is the product owner
    (
      EXISTS (
        SELECT 1 FROM products
        WHERE products.id = product_id
        AND products.user_id = auth.uid()
        AND products.deleted = FALSE
      )
      OR
      -- User has royalties on assets linked to this product's variants
      EXISTS (
        SELECT 1 FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        JOIN product_assets pa ON pa.variant_id = pv.id
        JOIN asset_royalties ar ON ar.asset_id = pa.asset_id
        WHERE p.id = product_id
        AND ar.user_id = auth.uid()
        AND ar.deleted = FALSE
        AND pv.deleted = FALSE
        AND p.deleted = FALSE
      )
    )
    AND auth.uid() = user_id
  );

-- Update policies remain unchanged (users can only update their own messages)
-- Delete policies remain unchanged (users can only delete their own messages)

-- Update reaction policies to match (restrict to contributors)
DROP POLICY IF EXISTS "Reactions visible with messages" ON product_chat_message_reactions;
DROP POLICY IF EXISTS "Authenticated users can react to messages" ON product_chat_message_reactions;

CREATE POLICY "Reactions visible to contributors"
  ON product_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_chat_messages pcm
      JOIN products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_reactions.message_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM product_variants pv
          JOIN product_assets pa ON pa.variant_id = pv.id
          JOIN asset_royalties ar ON ar.asset_id = pa.asset_id
          WHERE pv.product_id = p.id
          AND ar.user_id = auth.uid()
          AND ar.deleted = FALSE
          AND pv.deleted = FALSE
        )
      )
      AND p.deleted = FALSE
    )
  );

CREATE POLICY "Contributors can react to messages"
  ON product_chat_message_reactions FOR ALL
  USING (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM product_chat_messages pcm
        JOIN products p ON p.id = pcm.product_id
        WHERE pcm.id = message_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM product_variants pv
            JOIN product_assets pa ON pa.variant_id = pv.id
            JOIN asset_royalties ar ON ar.asset_id = pa.asset_id
            WHERE pv.product_id = p.id
            AND ar.user_id = auth.uid()
            AND ar.deleted = FALSE
            AND pv.deleted = FALSE
          )
        )
        AND p.deleted = FALSE
      )
    )
  );

-- Update attachment policies to match (restrict to contributors)
DROP POLICY IF EXISTS "Attachments visible with messages" ON product_chat_message_attachments;

CREATE POLICY "Attachments visible to contributors"
  ON product_chat_message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_chat_messages pcm
      JOIN products p ON p.id = pcm.product_id
      WHERE pcm.id = product_chat_message_attachments.message_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM product_variants pv
          JOIN product_assets pa ON pa.variant_id = pv.id
          JOIN asset_royalties ar ON ar.asset_id = pa.asset_id
          WHERE pv.product_id = p.id
          AND ar.user_id = auth.uid()
          AND ar.deleted = FALSE
          AND pv.deleted = FALSE
        )
      )
      AND p.deleted = FALSE
    )
  );

-- Enable realtime for product_chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE product_chat_messages;

-- Add comment explaining the contributor definition
COMMENT ON POLICY "Chat messages visible to contributors only" ON product_chat_messages IS
'Contributors are product owners or users who have royalties on assets linked to the product''s variants';
