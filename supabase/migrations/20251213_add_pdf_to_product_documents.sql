-- Migration: Add PDF fields to product_documents
-- Date: 2025-12-13
-- Description: Add pdf_url and pdf_storage_path to product_documents for auto-generated PDFs

-- Add PDF fields to product_documents
ALTER TABLE product_documents
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN product_documents.pdf_url IS 'URL of auto-generated PDF from document';
COMMENT ON COLUMN product_documents.pdf_storage_path IS 'Storage path for the PDF file';
COMMENT ON COLUMN product_documents.pdf_generated_at IS 'Timestamp when PDF was last generated';
