# Remaining Work - Form Conversion & Missing Functionality

## Forms Still Using Server-Side POST (Need Island Conversion)

### High Priority - Complex Edit Pages

#### 1. `/src/pages/products/[product]/edit.astro`
**7 Form Actions:**
- ✅ `update-product` - Update product details, tags, cover image (uses file upload)
- ✅ `create-variant` - Create new product variant
- ✅ `update-variant` - Update variant details
- ✅ `delete-variant` - Delete variant
- ✅ `link-asset` - Link asset to variant
- ✅ `unlink-asset` - Remove asset from variant
- ✅ `create-price` - Create variant pricing with price breaks

**Complexity:** High - Multiple nested forms, file uploads, requires multiple island components

#### 2. `/src/pages/assets/[asset]/edit.astro`
**2 Form Actions:**
- ✅ `create-royalty` - Add royalty split to asset
- ✅ `delete-royalty` - Remove royalty split

**Complexity:** Medium - Royalty management with user lookup

### Medium Priority - Detail Pages

#### 3. `/src/pages/assets/[asset]/index.astro`
**1 Form Action:**
- ✅ `delete` - Delete asset (owner only)

**Complexity:** Low - Single delete action with confirmation

#### 4. `/src/pages/products/[product]/index.astro`
**1 Form Action:**
- ✅ `delete` - Delete product (owner only)

**Status:** Partially complete - delete form still server-side, add-to-cart now uses island

### Low Priority - Read-Only Pages

#### 5. `/src/pages/purchases/index.astro`
**No POST Forms:** Uses `/api/download` link (GET request)
**Status:** No changes needed

---

## Missing Functionality Audit

### Auth Module ✅ COMPLETE
- ✅ Sign in (island)
- ✅ Sign up (island)
- ✅ Sign out (API)
- ✅ OAuth callback
- ⚠️ Password reset (not yet implemented)
- ⚠️ Email verification (not yet implemented)

### Cart Module ✅ COMPLETE
- ✅ Add to cart (island + API)
- ✅ Update quantity (island + API)
- ✅ Remove item (island + API)
- ✅ Clear cart (API)
- ✅ View cart (page with islands)
- ✅ Checkout (island + API)

### Products Module ⚠️ PARTIAL
**Complete:**
- ✅ List products
- ✅ View product detail (with AddToCartButton island)
- ✅ Create product (island)
- ✅ Add to cart from product page (island)

**Missing/Incomplete:**
- ❌ Edit product (needs island conversion)
- ❌ Delete product (needs island conversion)
- ❌ Create variants (needs island conversion)
- ❌ Edit variants (needs island conversion)
- ❌ Delete variants (needs island conversion)
- ❌ Manage variant pricing (needs island conversion)
- ❌ Link assets to variants (needs island conversion)
- ❌ Upload product cover image (needs FileUpload component)
- ❌ Upload variant images (not yet implemented)

### Assets Module ⚠️ PARTIAL
**Complete:**
- ✅ List assets
- ✅ View asset detail
- ⚠️ Create asset (exists but may need file upload update)

**Missing/Incomplete:**
- ❌ Edit asset (needs island conversion + file upload)
- ❌ Delete asset (needs island conversion)
- ❌ Manage royalty splits (needs island conversion)
- ❌ Upload asset files (needs FileUpload component)
- ❌ Upload asset images (needs FileUpload component)
- ❌ Download assets (API exists, needs UI improvement)

### Users Module ⚠️ PARTIAL
**Complete:**
- ✅ View user profile
- ✅ Edit user profile (island exists)
- ✅ User directory

**Missing/Incomplete:**
- ❌ Upload avatar (needs FileUpload component)
- ❌ Follow/unfollow users (not yet implemented)
- ❌ User reviews (not yet implemented)

### Tags Module ✅ MOSTLY COMPLETE
**Complete:**
- ✅ View products by tag
- ✅ Tag management in product creation (TagInput island)

**Missing:**
- ⚠️ Tag search/autocomplete (could be enhanced)

### Jams Module ❌ NOT STARTED
- ❌ Create jam
- ❌ Edit jam
- ❌ Submit products to jams
- ❌ Jam reviews/voting
- ❌ Prize management

### Documents Module ❌ NOT STARTED
- ❌ Create document
- ❌ Edit document (collaborative editor)
- ❌ Publish document as PDF asset
- ❌ Document blocks/components

### Purchases Module ⚠️ BASIC
**Complete:**
- ✅ View purchases
- ✅ Download purchased assets (API)
- ✅ Checkout success page

**Missing:**
- ❌ Order history filtering
- ❌ Invoice generation
- ❌ Refund requests

---

## Recommended Implementation Order

### Phase 1: Complete Core Commerce Flow (HIGH PRIORITY)
1. **Product Edit Island** - Convert products/[product]/edit.astro
   - ProductEditForm island
   - VariantForm island
   - VariantPricingForm island
   - AssetLinkForm island
   - Integrate FileUpload for cover images

2. **Asset Edit Island** - Convert assets/[asset]/edit.astro
   - AssetEditForm island
   - RoyaltyManagementForm island
   - Integrate FileUpload for asset files and images

3. **Delete Confirmations** - Convert remaining delete actions
   - ProductDeleteButton island
   - AssetDeleteButton island

### Phase 2: File Upload Integration (MEDIUM PRIORITY)
4. **Product Images** - Add cover image and variant image uploads
5. **Asset Files** - Add asset file and image uploads
6. **User Avatars** - Add avatar upload to user edit

### Phase 3: Missing Core Features (MEDIUM PRIORITY)
7. **User Social** - Follow/unfollow, reviews
8. **Advanced Cart** - Wishlist, saved for later
9. **Order Management** - Invoices, refunds

### Phase 4: Advanced Features (LOW PRIORITY)
10. **Jams Module** - Complete jam functionality
11. **Documents Module** - Collaborative editor
12. **Auth Enhancements** - Password reset, email verification

---

## Current Status Summary

**Completed (Options 1-3):**
- ✅ Base component library (FormField, FileUploadField, LoadingButton, etc.)
- ✅ Cart islands (AddToCartButton, CartItemRow, CheckoutButton)
- ✅ Generic file upload system (FileUpload, API endpoint, storage layer)
- ✅ Auth islands (LoginForm, RegisterForm)
- ✅ Product creation island
- ✅ User edit island

**In Progress:**
- ⏳ Product edit (7 forms need conversion)
- ⏳ Asset edit (2 forms need conversion)

**Not Started:**
- ❌ Jams module
- ❌ Documents module
- ❌ Advanced user features
- ❌ Enhanced purchase management

---

## Estimated Complexity

**High Complexity (1-2 days each):**
- Product edit page (7 forms, nested data, file uploads)
- Documents module (collaborative editing)

**Medium Complexity (4-6 hours each):**
- Asset edit page (2 forms, file uploads)
- Jams module
- User social features

**Low Complexity (1-2 hours each):**
- Delete button conversions
- File upload integrations
- Order history enhancements
