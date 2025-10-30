-- Fix field name mismatches in product_variants table
-- TypeScript type ProductVariant uses 'title' but database has 'name'
-- This migration renames 'name' to 'title' and adds missing fields

-- Rename name column to title to match TypeScript types
ALTER TABLE product_variants RENAME COLUMN name TO title;

-- Add missing columns from TypeScript ProductVariant type
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{}';
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Drop sort_order as it's not in TypeScript types (using position instead)
ALTER TABLE product_variants DROP COLUMN IF EXISTS sort_order;

-- Update products table to add missing fields from TypeScript Product type
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Remove cover_image_url as it's not in TypeScript types
ALTER TABLE products DROP COLUMN IF EXISTS cover_image_url;
