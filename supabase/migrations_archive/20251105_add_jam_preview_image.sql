-- Add preview image fields to jams table
-- Allows jams to have a featured preview image displayed on listings and detail pages

ALTER TABLE jams
ADD COLUMN preview_image_url TEXT,
ADD COLUMN preview_image_storage_path TEXT,
ADD COLUMN preview_image_mime_type TEXT;

-- Add index for preview image lookups
CREATE INDEX IF NOT EXISTS jams_preview_image_storage_path_idx ON jams(preview_image_storage_path);
