# Asset to Product Migration - Code Audit

This document tracks all files that reference the old Asset entity and need to be updated or removed.

## Summary

- **Pages to Remove**: 11 files
- **Components to Remove**: ~15 files in `/src/components/assets/`
- **Components to Update**: 3 files
- **API Routes to Remove**: 8 files
- **API Routes to Update**: 3 files
- **Types to Remove**: 1 file (`assets.types.ts`)
- **Data Access to Remove**: 2 files

---

## Pages

### 🗑️ To Remove (Asset-specific pages)

1. **`/src/pages/assets/[asset].astro`**
   - Old asset detail/edit page
   - Functionality now in product pages
   - **Action**: DELETE

### ⚠️ To Review (May reference assets)

2. **`/src/pages/products/[product].astro`**
   - Product detail page
   - May show linked assets
   - **Action**: UPDATE to show product components instead

---

## API Routes

### 🗑️ To Remove (Asset CRUD)

1. **`/src/pages/api/assets/create-asset.ts`**
   - Creates new asset
   - **Action**: DELETE (use product creation instead)

2. **`/src/pages/api/assets/delete-asset.ts`**
   - Deletes asset
   - **Action**: DELETE

3. **`/src/pages/api/assets/update-asset.ts`**
   - Updates asset metadata
   - **Action**: DELETE

### 🔄 To Update (Asset linking → Component embedding)

4. **`/src/pages/api/products/variants/[variantId]/assets.ts`**
   - Gets assets for a variant
   - **Action**: UPDATE to get product components

5. **`/src/pages/api/products/variants/link-asset.ts`**
   - Links asset to variant
   - **Action**: UPDATE to link product as component

6. **`/src/pages/api/products/variants/unlink-asset.ts`**
   - Unlinks asset from variant
   - **Action**: UPDATE to unlink product component

### ⚠️ To Review (May need updates)

7. **`/src/pages/api/downloads/[assetId].ts`**
   - Downloads asset files
   - **Action**: UPDATE to download product files (or keep for backward compat)

8. **`/src/pages/api/purchases/[saleId]/download/[assetId].ts`**
   - Downloads purchased asset
   - **Action**: UPDATE to reference product files

9. **`/src/pages/api/documents/create-asset.ts`**
   - Creates asset from document (PDF generation?)
   - **Action**: UPDATE to create product from document

10. **`/src/pages/api/documents/generate-document-asset.ts`**
    - Generates asset from document
    - **Action**: UPDATE to generate product from document

---

## Components

### 🗑️ To Remove (`/src/components/assets/` directory)

**Interactive Components (SolidJS):**
1. **`AssetChat.tsx`** + `asset-chat.css`
   - Asset-specific chat
   - **Action**: Merge into `ProductChat` or DELETE

2. **`AssetFilesForm.tsx`** + `asset-files-form.css`
   - File upload for assets
   - **Action**: Adapt to `ProductFilesForm` or DELETE

3. **`AssetImagesForm.tsx`** + `asset-images-form.css`
   - Image upload for assets
   - **Action**: Already have `ProductImagesForm`, DELETE

4. **`AssetProductPicker.tsx`** + `asset-product-picker.css`
   - Picker to select products for asset
   - **Action**: DELETE (inverse relationship now)

5. **`AssetRoyaltyManager.tsx`** + `asset-royalty-manager.css`
   - Royalty management for assets
   - **Action**: Adapt to `ProductRoyaltyManager`

6. **`AssetStatusEditor.tsx`** + `asset-status-editor.css`
   - Status editing for assets
   - **Action**: DELETE (use product status editor)

7. **`AssetStatusRequirements.tsx`** + `asset-status-requirements.css`
   - Shows requirements for publishing asset
   - **Action**: DELETE (use product requirements)

8. **`AssetTagsForm.tsx`** + `asset-tags-form.css`
   - Tag management for assets
   - **Action**: DELETE (use product tags form)

**Astro Components:**
9. **`AssetCard.astro`**
   - Card for displaying asset in marketplace
   - **Action**: DELETE (not in search results, may not exist)

10. **`AssetDetail.astro`**
    - Asset detail view
    - **Action**: DELETE

### 🔄 To Update (Reference assets, need product equivalent)

**In `/src/components/products/`:**

1. **`AssetSearchModal.tsx`** + `asset-search-modal.css`
   - Modal to search and select assets
   - **Action**: UPDATE to `ProductComponentSearchModal` (search embeddable products)

2. **`VariantAssetPicker.tsx`** + `variant-asset-picker.css`
   - Picker to link assets to variant
   - **Action**: UPDATE to `VariantComponentPicker` (pick product components)

3. **`VariantCard.tsx`**
   - Shows variant details including linked assets
   - **Action**: UPDATE to show linked product components

**In `/src/components/documents/`:**

4. **`DocumentCreateAssetButton.tsx`** + `document-create-asset-button.css`
   - Button to create asset from document
   - **Action**: UPDATE to create product from document

---

## Data Access Layer

### 🗑️ To Remove

1. **`/src/lib/data-access/assets.ts`** (804 lines)
   - All asset CRUD operations
   - **Action**: DELETE (functionality moved to `products.ts`)

2. **`/src/lib/data-access/asset-validation.ts`**
   - Asset-specific validation
   - **Action**: DELETE or merge into product validation

3. **`/src/lib/data-access/__tests__/assets-data-access.test.ts`**
   - Asset data access tests
   - **Action**: DELETE or adapt to product tests

---

## Types

### 🗑️ To Remove

1. **`/src/types/assets.types.ts`**
   - All asset type definitions
   - **Action**: DELETE (moved to `products.types.ts`)

### 🔄 To Update

2. **`/src/types/index.ts`**
   - Barrel export file
   - **Action**: REMOVE asset type exports

3. **`/src/types/commerce.types.ts`**
   - May reference Asset types
   - **Action**: UPDATE to use Product types

---

## Navigation & Routes

### ✅ Already Clean

- `/src/components/Navigation.astro` - NO asset references found ✓
- `/src/components/NavigationMobile.tsx` - Need to check
- `/src/components/NavigationUserMenu.tsx` - Need to check

---

## Migration Strategy

### Phase 1: Remove Unused Asset Pages ✅
- Delete `/src/pages/assets/[asset].astro`
- Delete asset API routes: `/src/pages/api/assets/*`

### Phase 2: Update Product Components ✅
- Rename `AssetSearchModal` → `ProductComponentSearchModal`
- Rename `VariantAssetPicker` → `VariantComponentPicker`
- Update `VariantCard` to show components

### Phase 3: Update API Routes ✅
- Update variant asset APIs to use components
- Update document→asset APIs to create products
- Update download APIs to reference products

### Phase 4: Create New Product Components ✅
- `ProductFilesForm.tsx` (adapted from `AssetFilesForm`)
- `ProductRoyaltyManager.tsx` (adapted from `AssetRoyaltyManager`)

### Phase 5: Remove Old Code ✅
- Delete `/src/components/assets/` directory
- Delete `/src/lib/data-access/assets.ts`
- Delete `/src/types/assets.types.ts`
- Update barrel exports

### Phase 6: Test ✅
- Product creation with files
- Product embedding in variants
- Royalty calculations
- Downloads

---

## Next Steps

1. Start with Phase 1 (remove asset pages)
2. Update product components (Phase 2)
3. Update API routes (Phase 3)
4. Create new product components (Phase 4)
5. Clean up old code (Phase 5)
6. Test everything (Phase 6)
