# UI/UX Implementation Plan - Workshop Platform

## Current State Analysis

### Existing Pages & Routes

#### Authentication Flow
- `/auth/login` - Login form (uses LoginForm component)
- `/auth/sign-up` - Sign up form (uses SignUpForm component)
- `/auth/sign-up-success` - Success confirmation page
- `/auth/forgot-password` - Password reset request
- `/auth/update-password` - Password update form
- `/auth/error` - Error handling page

**Status**: ✅ Complete - Auth flow is functional

#### Main Navigation
- `/` (Home) - Landing page with quick stats and activity feed
- `/dashboard` - User dashboard with stats, pending requests
- `/projects` - Project listing page
- `/projects/[slug]` - Individual project detail page
- `/assets` - Asset marketplace/library
- `/assets/upload` - Asset upload form
- `/teams` - Team management
- `/teams/[team]` - Individual team page
- `/requests` - Collaboration requests (pending/approved/rejected)
- `/licensing` - License management
- `/profile` - User profile view
- `/settings/*` - Settings pages (profile, billing, payouts, notifications, privacy)

**Status**: ⚠️ Partially complete - Missing product/marketplace pages

---

## Database Changes Impact Analysis

### Schema Changes Completed
1. **Orders table** - Now references `product_id` and `variant_id` instead of pricing tables
2. **Product system** - 11 new tables for product listings (products, variants, prices, images, collections, etc.)
3. **Normalized sub-tables** - Projects and assets broken into settings, stats, tags, royalties, etc.
4. **Multi-currency support** - product_variant_prices table with currency_code

### SDK Hooks Created
- 163 total SDK hooks covering all 51 database tables
- All hooks follow `use-user-{operation}-{table}.ts` naming pattern
- Hooks return consistent `{ data, error }` or `{ data, error, count }` patterns

---

## Missing Pages & Features

### 1. Product/Marketplace System (CRITICAL - NEW)

#### Missing Pages:
- `/shop` or `/marketplace` - Public storefront for browsing products
- `/shop/[handle]` - Individual product detail page with variants/pricing
- `/shop/cart` - Shopping cart
- `/shop/checkout` - Checkout flow with Stripe
- `/shop/orders` - User's purchase history
- `/shop/orders/[id]` - Individual order details with download links

#### Missing Components:
- `components/blocks/products/product-card.tsx` - Product grid card
- `components/blocks/products/product-detail.tsx` - Full product page
- `components/blocks/products/product-variant-selector.tsx` - Variant picker (SKU, options)
- `components/blocks/products/product-price-display.tsx` - Multi-currency price display
- `components/blocks/products/product-image-gallery.tsx` - Product images carousel
- `components/blocks/products/product-collection-browser.tsx` - Browse by collection
- `components/blocks/products/cart-item.tsx` - Cart line item
- `components/blocks/products/checkout-form.tsx` - Checkout with Stripe integration
- `components/blocks/products/order-summary.tsx` - Order details with revenue splits
- `components/blocks/products/digital-download-button.tsx` - Download purchased files

#### Creator Product Management (CRITICAL):
- `/projects/[slug]/publish` - Create product from project
- `/products` - Creator's published products listing
- `/products/[id]/edit` - Edit product details, pricing, images
- `/products/[id]/analytics` - Product sales analytics

#### Missing Creator Components:
- `components/blocks/products/product-create-form.tsx` - Create product from project
- `components/blocks/products/product-edit-form.tsx` - Edit product details
- `components/blocks/products/product-variant-manager.tsx` - Manage variants and pricing
- `components/blocks/products/product-image-uploader.tsx` - Upload/manage product images
- `components/blocks/products/product-collection-manager.tsx` - Assign to collections
- `components/blocks/products/product-seo-form.tsx` - SEO metadata editor
- `components/blocks/products/product-analytics-dashboard.tsx` - Sales stats

### 2. Project Detail Pages (PARTIALLY COMPLETE)

#### Existing:
- `/projects/[slug]` exists but needs full implementation

#### Missing Components for Project Pages:
- `components/blocks/projects/project-header.tsx` - Hero with cover image, title, status
- `components/blocks/projects/project-assets-grid.tsx` - Display project's assets
- `components/blocks/projects/project-collaborators-list.tsx` - Team members with roles
- `components/blocks/projects/project-activity-feed.tsx` - Recent changes/comments
- `components/blocks/projects/project-stats-panel.tsx` - Views, downloads, likes
- `components/blocks/projects/project-license-display.tsx` - Show active licenses
- `components/blocks/projects/project-settings-tabs.tsx` - Settings navigation

### 3. Asset Detail Pages (MISSING)

#### Missing Pages:
- `/assets/[id]` - Individual asset detail page
- `/assets/[id]/edit` - Edit asset metadata

#### Missing Components:
- `components/blocks/assets/asset-detail-header.tsx` - Asset title, creator, status
- `components/blocks/assets/asset-preview-viewer.tsx` - 3D viewer for models, image viewer
- `components/blocks/assets/asset-files-list.tsx` - Download links for files
- `components/blocks/assets/asset-royalty-display.tsx` - Show royalty percentage
- `components/blocks/assets/asset-license-selector.tsx` - Choose license for asset
- `components/blocks/assets/asset-usage-stats.tsx` - Where asset is used
- `components/blocks/assets/asset-comments-section.tsx` - Comment thread

### 4. Earnings & Revenue (MISSING)

#### Missing Pages:
- `/earnings` - Creator earnings dashboard
- `/earnings/history` - Detailed revenue history
- `/earnings/pending` - Pending payouts

#### Missing Components:
- `components/blocks/earnings/earnings-summary.tsx` - Total earnings, pending, paid
- `components/blocks/earnings/revenue-breakdown.tsx` - By project, asset, royalty type
- `components/blocks/earnings/payout-history.tsx` - Past payouts table
- `components/blocks/earnings/revenue-chart.tsx` - Earnings over time graph

### 5. Settings Pages (PARTIALLY COMPLETE)

#### Existing:
- `/settings/profile` - ✅ Complete
- `/settings/notifications` - ✅ Complete
- `/settings/privacy` - ✅ Complete
- `/settings/billing` - ⚠️ Needs Stripe integration
- `/settings/payouts` - ⚠️ Needs Stripe Connect integration

#### Needs Update:
- Update billing page to show order history
- Update payouts page to show revenue splits and payout schedule

---

## Implementation Plan

### Phase 1: Critical SDK Migration (Week 1)
**Priority**: HIGH - Update existing pages to use new SDK hooks

#### 1.1 Dashboard Page Updates
**File**: `app/dashboard/page.tsx`

**Current Issues**:
- References `documents` table which doesn't exist in schema
- References `user_victory_points` table which doesn't exist
- Direct Supabase queries instead of SDK hooks
- References old field names (`download_count`, `usage_count` on assets)

**Changes Needed**:
```typescript
// BEFORE (lines 42-70):
const [
  { count: projectCount },
  { count: assetCount },
  { count: documentCount },  // ❌ No documents table
  { data: assetStats },
  { data: vpData },          // ❌ No user_victory_points table
] = await Promise.all([...])

// AFTER - Use SDK hooks:
const { getProjects } = useUserGetAllProjects()
const { getAssets } = useUserGetAllAssets()
const { getProjectStats } = useUserGetOneProjectStats()

// Get aggregated stats from project_stats and asset_stats tables
```

**SDK Hooks to Use**:
- `use-user-get-all-projects.ts` - Get user's projects count
- `use-user-get-all-assets.ts` - Get user's assets count
- `use-user-get-one-project-stats.ts` - Get project stats (views, downloads)
- `use-user-get-all-project-asset-references.ts` - Get pending requests

**Migration Steps**:
1. Remove references to `documents` table
2. Replace direct Supabase queries with SDK hooks
3. Update stats aggregation logic to use stats tables
4. Fix field names to match normalized schema (asset_stats table)

#### 1.2 Projects Page Updates
**File**: `app/projects/page.tsx`

**Current Issues**:
- Uses `ProjectService` class instead of SDK hooks
- Directly queries projects with embedded fields (tags, is_public)

**Changes Needed**:
```typescript
// BEFORE (line 27):
const projectService = new ProjectService(supabase)
const result = await projectService.getUserProjects(user.id)

// AFTER - Use SDK hooks:
const { getProjects } = useUserGetAllProjects()
const { data: projects, error } = await getProjects({ creatorId: user.id })
```

**SDK Hooks to Use**:
- `use-user-get-all-projects.ts` - Main listing with settings/stats joined
- `use-user-get-all-project-tags.ts` - Get tags for each project

**Migration Steps**:
1. Replace ProjectService with SDK hooks
2. Remove `lib/services/project-service.ts` dependency
3. Update to join project_settings for is_public field
4. Update to join project_tags for tags array

#### 1.3 Assets Page Updates
**File**: `app/assets/page.tsx`

**Current Issues**:
- Direct Supabase queries with old field names
- References `profiles` table (should be `users`)
- References fields that don't exist (`is_public`, `license_type`, `price_cents`)

**Changes Needed**:
```typescript
// BEFORE (lines 44-56):
let query = supabase
  .from("assets")
  .select(`
    *,
    creator:profiles!creator_id(...)  // ❌ Should be 'users'
  `)
  .eq("is_public", true)              // ❌ Should be in asset_settings
  .eq("status", "published")          // ❌ Status enum is 'active', not 'published'

// AFTER - Use SDK hooks:
const { searchAssets } = useUserSearchAssets()
const { data: assets, error, count } = await searchAssets({
  status: 'active',
  limit,
  offset
})
```

**SDK Hooks to Use**:
- `use-user-search-assets.ts` - Main search with filters
- `use-user-get-all-asset-settings.ts` - Get is_public status
- `use-user-get-all-asset-licenses.ts` - Get license info

**Migration Steps**:
1. Replace direct queries with SDK hooks
2. Update field references (profiles → users, is_public → asset_settings)
3. Remove references to non-existent pricing fields
4. Update status enum values

#### 1.4 Requests Page Updates
**File**: `app/requests/page.tsx`

**Current Issues**:
- References `documents` table which doesn't exist
- Direct Supabase queries for references
- Custom enrichment logic should use SDK

**Changes Needed**:
- Remove all document reference logic
- Use SDK hooks for asset references
- Simplify enrichment (SDK handles joins)

**SDK Hooks to Use**:
- `use-user-get-all-project-asset-references.ts`
- Hooks include joins for asset, project, user data

**Migration Steps**:
1. Remove document reference code entirely
2. Replace manual queries with SDK hooks
3. Remove custom enrichment (SDK returns joined data)

### Phase 2: Product System Implementation (Week 2-3)
**Priority**: CRITICAL - Core monetization feature

#### 2.1 Public Storefront
**New Pages**:
- `/shop/page.tsx` - Browse all active products
- `/shop/[handle]/page.tsx` - Product detail with variants
- `/shop/cart/page.tsx` - Shopping cart
- `/shop/checkout/page.tsx` - Checkout with Stripe
- `/shop/orders/page.tsx` - User's order history
- `/shop/orders/[id]/page.tsx` - Order details with downloads

**Components to Build** (in order):
1. `product-card.tsx` - Grid card for product listings
2. `product-image-gallery.tsx` - Image carousel for product page
3. `product-variant-selector.tsx` - Choose variant with price display
4. `product-price-display.tsx` - Multi-currency price formatting
5. `cart-item.tsx` - Cart line item with quantity
6. `checkout-form.tsx` - Stripe Elements integration
7. `order-summary.tsx` - Post-purchase order details
8. `digital-download-button.tsx` - Download purchased files

**SDK Hooks to Use**:
- `use-user-get-all-products.ts`
- `use-user-get-product-by-handle.ts`
- `use-user-create-order.ts`
- `use-user-get-all-orders.ts`
- `use-user-get-one-order.ts`

#### 2.2 Creator Product Management
**New Pages**:
- `/products/page.tsx` - Creator's products dashboard
- `/products/new/page.tsx` - Create product from project
- `/products/[id]/edit/page.tsx` - Edit product
- `/products/[id]/analytics/page.tsx` - Sales analytics

**Components to Build**:
1. `product-create-form.tsx` - Create product, select projects
2. `product-edit-form.tsx` - Update title, description, handle
3. `product-variant-manager.tsx` - Add/edit variants with prices
4. `product-image-uploader.tsx` - Upload/reorder images
5. `product-collection-manager.tsx` - Assign to collections
6. `product-seo-form.tsx` - Meta tags, OG image
7. `product-analytics-dashboard.tsx` - Revenue, views, conversions

**SDK Hooks to Use**:
- `use-user-create-product.ts`
- `use-user-update-product.ts`
- `use-user-create-product-project.ts` (link projects)
- `use-user-create-product-variant.ts`
- `use-user-create-product-variant-price.ts`
- `use-user-create-product-image.ts`
- `use-user-update-product-seo.ts`

### Phase 3: Enhanced Project & Asset Pages (Week 4)

#### 3.1 Project Detail Page
**Update**: `/projects/[slug]/page.tsx`

**Components to Add**:
1. `project-header.tsx` - Cover image, title, description, status badge
2. `project-assets-grid.tsx` - Grid of project's assets with previews
3. `project-collaborators-list.tsx` - Team with contribution descriptions
4. `project-activity-feed.tsx` - Recent comments, updates
5. `project-stats-panel.tsx` - Views, forks, likes from project_stats
6. `project-license-display.tsx` - Active license terms
7. `project-publish-to-product-button.tsx` - Create product from project

**SDK Hooks to Use**:
- `use-user-get-one-project.ts` (with joined settings, stats)
- `use-user-get-all-project-collaborators.ts`
- `use-user-get-all-project-tags.ts`
- `use-user-get-all-project-licenses.ts`
- `use-user-get-one-project-stats.ts`

#### 3.2 Asset Detail Page
**New Page**: `/assets/[id]/page.tsx`

**Components to Build**:
1. `asset-detail-header.tsx` - Title, creator badge, status
2. `asset-preview-viewer.tsx` - 3D model viewer or image lightbox
3. `asset-files-list.tsx` - File downloads with format/size
4. `asset-royalty-display.tsx` - Current royalty percentage
5. `asset-license-selector.tsx` - License dropdown
6. `asset-usage-stats.tsx` - Projects using this asset
7. `asset-comments-section.tsx` - Discussion thread

**SDK Hooks to Use**:
- `use-user-get-one-asset.ts` (with settings, stats, images, files)
- `use-user-get-all-asset-royalties.ts`
- `use-user-get-all-asset-licenses.ts`
- `use-user-get-all-asset-files.ts`
- `use-user-get-all-asset-comments.ts`

### Phase 4: Earnings & Analytics (Week 5)

#### 4.1 Earnings Dashboard
**New Pages**:
- `/earnings/page.tsx` - Overview with charts
- `/earnings/history/page.tsx` - Detailed transaction log
- `/earnings/pending/page.tsx` - Pending revenue splits

**Components to Build**:
1. `earnings-summary.tsx` - Total, pending, paid cards
2. `revenue-breakdown.tsx` - By source (projects, royalties, platform)
3. `revenue-chart.tsx` - Chart.js/Recharts time series
4. `payout-history.tsx` - Table of completed payouts
5. `pending-splits.tsx` - Unpaid revenue splits

**SDK Hooks to Use**:
- `use-user-get-all-order-revenue-splits.ts`
- `use-user-get-all-payout-requests.ts`
- `use-user-get-one-payout-schedule.ts`

### Phase 5: Settings & Integrations (Week 6)

#### 5.1 Billing Settings
**Update**: `/settings/billing/page.tsx`

**Components to Add**:
1. `order-history-table.tsx` - User's purchase history
2. `payment-methods.tsx` - Stripe payment methods management

**SDK Hooks to Use**:
- `use-user-get-all-orders.ts` (filter by buyerId)

#### 5.2 Payout Settings
**Update**: `/settings/payouts/page.tsx`

**Components to Add**:
1. `stripe-connect-onboarding.tsx` - Connect Stripe account
2. `payout-schedule-form.tsx` - Configure payout frequency
3. `earnings-summary-widget.tsx` - Current balance

**SDK Hooks to Use**:
- `use-user-get-one-stripe-account.ts`
- `use-user-create-stripe-account.ts`
- `use-user-get-one-payout-schedule.ts`
- `use-user-update-payout-schedule.ts`

---

## Technical Debt & Cleanup

### Services to Remove
Once SDK migration is complete, remove these old service files:
- `lib/services/project-service.ts` ❌
- `lib/services/assets.ts` ❌ (if exists)
- Any other services replaced by SDK hooks

### Type Definitions
- ✅ `lib/types/database.ts` - Already updated with new schema
- Need to remove old types like:
  - `EnrichedAssetReference` - Should use SDK return types
  - `EnrichedDocumentReference` - Remove (documents table doesn't exist)

### Validation Schemas
- Review `lib/validations/schemas.ts` to ensure alignment with:
  - New product system
  - Normalized tables
  - Multi-currency support

---

## API Routes to Create

### Product Management
- `POST /api/products` - Create product
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `POST /api/products/[id]/variants` - Add variant
- `POST /api/products/[id]/images` - Upload image

### Cart & Checkout
- `POST /api/cart` - Add to cart (session-based)
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### Revenue & Payouts
- `GET /api/earnings` - Get user's revenue data
- `POST /api/payouts/request` - Request manual payout
- `GET /api/revenue-splits/[orderId]` - Get splits for order

---

## Testing Checklist

### Phase 1 (SDK Migration)
- [ ] Dashboard loads without errors
- [ ] Projects page shows correct data
- [ ] Assets page displays properly
- [ ] Requests page shows pending references
- [ ] All stats display correct values from stats tables

### Phase 2 (Products)
- [ ] Public shop displays products
- [ ] Product detail shows variants and prices
- [ ] Cart functionality works
- [ ] Checkout completes with Stripe
- [ ] Orders appear in history
- [ ] Digital files downloadable after purchase
- [ ] Creators can create products from projects
- [ ] Variant pricing supports multiple currencies

### Phase 3 (Enhanced Pages)
- [ ] Project pages show all related data
- [ ] Asset detail pages functional
- [ ] Comments work on assets
- [ ] Royalties display correctly

### Phase 4 (Earnings)
- [ ] Revenue calculations correct
- [ ] Charts display properly
- [ ] Payout requests work

### Phase 5 (Settings)
- [ ] Stripe Connect onboarding works
- [ ] Payment methods saved
- [ ] Payout schedule configurable

---

## Priority Order Summary

1. **WEEK 1**: SDK Migration (Dashboard, Projects, Assets, Requests pages)
   - Critical for data integrity
   - Fixes broken references to old schema

2. **WEEK 2-3**: Product System
   - Core monetization feature
   - Public shop + Creator product management
   - Stripe checkout integration

3. **WEEK 4**: Enhanced Project/Asset Pages
   - Better UX for creators
   - Complete feature set for collaboration

4. **WEEK 5**: Earnings & Analytics
   - Revenue transparency
   - Creator insights

5. **WEEK 6**: Settings & Integrations
   - Stripe Connect
   - Payout management

---

## Notes

### Documents Table
The schema does NOT include a `documents` table. Current pages reference it, but this needs to be removed or a decision made:
- **Option A**: Remove all document references (current plan)
- **Option B**: Add documents table to schema if needed for rulebooks

### Victory Points System
Tables exist (`user_victory_points`, `vp_transactions`) but are not implemented in UI. Consider:
- Is this feature still needed?
- If yes, add to Phase 6

### Stripe Integration
- Need to test Stripe webhooks locally with Stripe CLI
- Ensure webhook events table is populated correctly
- Revenue split calculations need thorough testing

### Multi-Currency
- Default currency should be configurable per user
- Currency selector on product pages
- Exchange rate handling (if needed)
