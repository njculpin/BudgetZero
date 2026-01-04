-- Migration: Remove chat system
-- Date: 2026-01-04
-- Description: Removes all chat-related tables, indexes, triggers, and RLS policies

-- Drop product chat tables first (cascades will handle related objects)
DROP TABLE IF EXISTS public.product_chat_message_attachments CASCADE;
DROP TABLE IF EXISTS public.product_chat_message_reactions CASCADE;
DROP TABLE IF EXISTS public.product_chat_messages CASCADE;

-- Drop document chat tables
DROP TABLE IF EXISTS public.document_chat_messages CASCADE;

-- Drop asset chat tables (if they still exist from old schema)
DROP TABLE IF EXISTS public.asset_chat_message_attachments CASCADE;
DROP TABLE IF EXISTS public.asset_chat_message_reactions CASCADE;
DROP TABLE IF EXISTS public.asset_chat_messages CASCADE;

-- Note: CASCADE automatically drops:
-- - All foreign key constraints
-- - All indexes
-- - All triggers (including set_updated_at triggers)
-- - All RLS policies
-- - All comments
-- - Entries in publications (realtime)
