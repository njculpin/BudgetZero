# Asset to Product Migration Plan

## Overview
This document outlines the migration from a two-entity system (Assets + Products) to a single-entity system (Products only with embedding).

## Database Schema Changes

### New Tables

#### 1. `product_files` (replaces `asset_files`)
```sql
CREATE TABLE product_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);
```

#### 2. `product_components` (replaces `product_assets`)
```sql
CREATE TABLE product_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_variant_id UUID REFERENCES product_variants(id) NOT NULL,
  child_product_id UUID REFERENCES products(id) NOT NULL,
  royalty_amount_cents INTEGER NOT NULL, -- Captured at link time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);
```

#### 3. `product_royalties` (replaces `asset_royalties`)
```sql
CREATE TABLE product_royalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  royalty_type TEXT NOT NULL CHECK (royalty_type IN ('fixed', 'percentage')),
  royalty_value INTEGER NOT NULL, -- Fixed: cents | Percentage: 0-100
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);
```

### Updated Tables

#### `products` - Add new fields
```sql
ALTER TABLE products ADD COLUMN is_embeddable BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN direct_sale_price_cents INTEGER;
ALTER TABLE products ADD COLUMN embedding_royalty_cents INTEGER;
ALTER TABLE products ADD COLUMN download_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN total_size_bytes BIGINT DEFAULT 0;
ALTER TABLE products ADD COLUMN file_count INTEGER DEFAULT 0;
```

### Tables to Drop (after migration)
- `assets`
- `asset_files`
- `asset_images` (merge into `product_images`)
- `asset_royalties`
- `asset_collaborators` (merge into `product_collaborators`)
- `asset_tags` (merge into `product_tags`)
- `asset_downloads` (merge into `sale_downloads` or product-specific table)
- `product_assets` (replaced by `product_components`)
- `asset_chat_messages` (merge into `product_chat_messages`)
- `asset_chat_message_reactions`
- `asset_chat_message_attachments`

## Data Migration Steps

### 1. Convert Assets to Products
```sql
-- Insert all assets as products with is_embeddable = true
INSERT INTO products (
  id, -- Keep same ID for easier migration
  handle,
  title,
  user_id,
  description,
  status,
  view_count,
  created_at,
  updated_at,
  deleted,
  deleted_at,
  is_embeddable,
  download_count,
  total_size_bytes,
  file_count
)
SELECT
  id,
  handle,
  title,
  user_id,
  description,
  status,
  0 as view_count,
  created_at,
  updated_at,
  deleted,
  deleted_at,
  TRUE as is_embeddable,
  download_count,
  total_size_bytes,
  file_count
FROM assets;
```

### 2. Migrate Asset Files to Product Files
```sql
INSERT INTO product_files (
  id,
  product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
)
SELECT
  id,
  asset_id as product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
FROM asset_files;
```

### 3. Migrate Asset Images to Product Images
```sql
INSERT INTO product_images (
  id,
  product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
)
SELECT
  id,
  asset_id as product_id,
  title,
  description,
  file_url,
  storage_path,
  file_size_bytes,
  mime_type,
  position,
  created_at,
  updated_at,
  deleted,
  deleted_at
FROM asset_images;
```

### 4. Migrate Asset Royalties to Product Royalties
```sql
INSERT INTO product_royalties (
  id,
  product_id,
  user_id,
  royalty_type,
  royalty_value,
  created_at,
  updated_at,
  deleted,
  deleted_at
)
SELECT
  id,
  asset_id as product_id,
  user_id,
  royalty_type,
  royalty_value,
  created_at,
  updated_at,
  deleted,
  deleted_at
FROM asset_royalties;
```

### 5. Convert ProductAssets to ProductComponents
```sql
-- For each product_asset link, calculate the royalty and create a component
INSERT INTO product_components (
  parent_variant_id,
  child_product_id,
  royalty_amount_cents,
  created_at,
  updated_at
)
SELECT
  pa.variant_id as parent_variant_id,
  pa.asset_id as child_product_id, -- asset is now a product
  COALESCE(
    (SELECT SUM(royalty_value)
     FROM asset_royalties
     WHERE asset_id = pa.asset_id AND deleted = FALSE),
    0
  ) as royalty_amount_cents,
  pa.created_at,
  pa.updated_at
FROM product_assets pa;
```

### 6. Merge Asset Collaborators into Product Collaborators
```sql
INSERT INTO product_collaborators (
  product_id,
  user_id,
  role,
  can_edit,
  can_delete,
  can_invite,
  created_at,
  updated_at
)
SELECT DISTINCT
  ac.asset_id as product_id,
  ac.user_id,
  'editor' as role,
  TRUE as can_edit,
  FALSE as can_delete,
  FALSE as can_invite,
  ac.created_at,
  ac.updated_at
FROM asset_collaborators ac
WHERE NOT EXISTS (
  SELECT 1 FROM product_collaborators pc
  WHERE pc.product_id = ac.asset_id AND pc.user_id = ac.user_id
);
```

### 7. Merge Asset Tags into Product Tags
```sql
INSERT INTO product_tags (
  product_id,
  value,
  created_at,
  updated_at,
  deleted,
  deleted_at
)
SELECT DISTINCT
  at.asset_id as product_id,
  at.value,
  at.created_at,
  at.updated_at,
  at.deleted,
  at.deleted_at
FROM asset_tags at
WHERE NOT EXISTS (
  SELECT 1 FROM product_tags pt
  WHERE pt.product_id = at.asset_id AND pt.value = at.value
);
```

### 8. Update sale_royalty_transactions references
```sql
-- Update foreign key references if needed
-- Note: asset_royalty_id now points to product_royalties
-- No schema change needed, just verify data integrity
```

## Code Changes

### Types to Update

#### `/src/types/products.types.ts`
- Add `ProductFile` interface (copy from AssetFile)
- Add `ProductRoyalty` interface (copy from AssetRoyalty)
- Add `ProductComponent` interface
- Add new fields to `Product`: `is_embeddable`, `direct_sale_price_cents`, `embedding_royalty_cents`, `download_count`, `total_size_bytes`, `file_count`

#### Remove `/src/types/assets.types.ts`

### Data Access Layer Updates

#### `/src/lib/data-access/products.ts`
- Add file upload functions (from assets.ts)
- Add component embedding functions
- Add royalty management functions
- Update all functions to handle new schema

#### Remove `/src/lib/data-access/assets.ts`

#### `/src/lib/data-access/royalties.ts`
- Update to use `product_royalties` instead of `asset_royalties`
- Update references from `assetId` to `productId`

### Components to Remove
- `/src/components/assets/*` (all asset-specific components)

### Components to Update
- `/src/components/products/*` - Add file upload, royalty management
- Create `ProductFileForm.tsx` (adapted from AssetFileForm)
- Create `ProductRoyaltyManager.tsx` (adapted from AssetRoyaltyManager)
- Create `ProductComponentManager.tsx` (for embedding products)

### Pages to Remove
- `/src/pages/assets/*` (all asset pages)

### Pages to Update
- `/src/pages/products/[handle].astro` - Show files and download options
- `/src/pages/products/[handle]/edit.astro` - Add file upload, royalty config, embedding options

### Navigation Updates
- Remove "Assets" links from navigation
- Update user menu to show only "Products"
- Remove asset-related routes

## Testing Plan

### 1. Database Migration Testing
- [ ] Run migration script on dev database
- [ ] Verify all assets converted to products
- [ ] Verify all relationships preserved
- [ ] Verify royalty calculations still work

### 2. Feature Testing
- [ ] Create new product with file upload
- [ ] Embed one product into another
- [ ] Test dual pricing (direct sale + embedding)
- [ ] Test royalty calculations for embedded products
- [ ] Test checkout flow with embedded products
- [ ] Test download functionality

### 3. Edge Cases
- [ ] Product embedding itself (should be prevented)
- [ ] Circular dependencies (A embeds B, B embeds A)
- [ ] Royalty calculations with deeply nested products
- [ ] Products with no files (just for bundling)

## Rollback Plan

If migration fails:
1. Keep backup of all dropped tables
2. Restore from backup
3. Revert code changes
4. Deploy previous version

## Timeline

- Database migration: 2-3 hours
- Type updates: 1 hour
- Data access layer: 4-6 hours
- Component updates: 6-8 hours
- Page updates: 3-4 hours
- Testing: 4-6 hours
- **Total: ~24-30 hours (3-4 days)**
