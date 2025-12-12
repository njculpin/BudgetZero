-- Migration: Product Documents
-- Date: 2025-12-11
-- Description: Create product_documents table to link documents to products with pricing

-- Create product_documents table
CREATE TABLE IF NOT EXISTS product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE product_documents IS 'Documents attached to products with pricing';
COMMENT ON COLUMN product_documents.price_cents IS 'Price for this document when product is purchased';

-- Enable RLS on product_documents
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_documents
CREATE POLICY "Product documents visible via product"
  ON product_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_documents.product_id
      AND (products.status = 'public' OR products.user_id = auth.uid())
      AND products.deleted = FALSE
    )
  );

CREATE POLICY "Product owners can manage documents"
  ON product_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_documents.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create indexes for product_documents
CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON product_documents(product_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_documents_document_id ON product_documents(document_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_product_documents_position ON product_documents(position);

-- Prevent duplicate document assignments to same product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_documents_unique
  ON product_documents(product_id, document_id)
  WHERE deleted = false;

-- Create trigger for product_documents
CREATE TRIGGER set_updated_at_product_documents
  BEFORE UPDATE ON product_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
