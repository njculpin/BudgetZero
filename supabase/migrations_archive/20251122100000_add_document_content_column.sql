-- Add content column to documents table for TipTap JSON storage
-- This stores the full editor content as JSON instead of using document_blocks

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{"type": "doc", "content": [{"type": "paragraph"}]}';

-- Add index for faster content queries if needed
CREATE INDEX IF NOT EXISTS documents_content_idx ON documents USING GIN (content);

-- Comment on the column
COMMENT ON COLUMN documents.content IS 'TipTap editor content stored as JSON';
