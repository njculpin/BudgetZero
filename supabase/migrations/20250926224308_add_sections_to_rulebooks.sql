-- Add sections column to rulebooks table to store document structure
ALTER TABLE rulebooks
ADD COLUMN sections JSONB DEFAULT '[]'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN rulebooks.sections IS 'JSON array storing the document structure with sections and pages';