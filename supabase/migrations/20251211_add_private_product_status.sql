-- Migration: Add 'private' status to products
-- Date: 2025-12-11
-- Description: Add 'private' status to the products table status constraint

-- Drop the existing constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;

-- Add new constraint with 'private' status included
ALTER TABLE products ADD CONSTRAINT products_status_check
  CHECK (status IN ('draft', 'private', 'public', 'archived'));

COMMENT ON CONSTRAINT products_status_check ON products IS 'Ensures product status is one of: draft, private, public, or archived';
