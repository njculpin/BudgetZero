-- Add mock credits system for testing user journeys without Stripe
-- Users get 10,000 credits on signup (equivalent to $100)

-- Add credits balance to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 10000 NOT NULL;

-- Add comment explaining credits system
COMMENT ON COLUMN public.users.credits_balance IS 'Mock credits for testing (100 credits = $1). New users get 10,000 credits ($100).';

-- Backfill existing users with 10,000 credits
UPDATE public.users
SET credits_balance = 10000
WHERE credits_balance IS NULL OR credits_balance = 0;

-- Add product_type field for physical services
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'digital' NOT NULL
CHECK (product_type IN ('digital', 'print_service', 'paint_service'));

-- Add comment
COMMENT ON COLUMN public.products.product_type IS 'Type of product: digital (files/documents), print_service (3D printing), paint_service (miniature painting)';

-- Add shipping fields to sales table for physical services
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS order_notes TEXT;

-- Add comments
COMMENT ON COLUMN public.sales.shipping_address IS 'Customer shipping address for physical service orders. Format: {name, address1, address2, city, state, postal_code, country}';
COMMENT ON COLUMN public.sales.order_notes IS 'Customer notes for service providers (color preferences, materials, special instructions)';

-- Add payment_method field to track if payment was with credits or Stripe
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe' NOT NULL
CHECK (payment_method IN ('stripe', 'credits'));

COMMENT ON COLUMN public.sales.payment_method IS 'Payment method used: stripe (real payment) or credits (mock payment for testing)';
