# Consolidated Database Migrations

This directory contains the new consolidated migration structure for Game Loopers.

## Migration Structure

**6 domain-based migration files:**

1. **00001_core_extensions.sql** - PostgreSQL extensions and utility functions
2. **00002_users_domain.sql** - Users, tags, reviews, follows
3. **00003_documents_domain.sql** - Documents, blocks, attachments, collaborators
4. **00004_products_domain.sql** - Products, files, documents, components, royalties
5. **00005_commerce_domain.sql** - Carts, sales, royalties, wishlists, payouts
6. **00006_system_domain.sql** - Notifications, activity feed, sessions, storage buckets

## What Was Removed

### Removed Features (Obsolete)
- ❌ **Assets Domain** (9 tables) - Replaced by product-centric model
- ❌ **Jams Feature** (8 tables) - Removed in Phase 1
- ❌ **Variants/SKU System** (3 tables) - Over-engineered for MVP
- ❌ **Chat System** (7 tables) - Already removed in December 2024
- ❌ **sale_item_assets** table - Asset-specific

### Removed Objects
- **25 unused tables** total
- **3 obsolete functions/triggers** (asset notification triggers)
- **2 storage buckets** (asset-files, asset-images)
- **Multiple columns** from notification_settings (email_jam_updates, inapp_jam_updates, email_asset_changes, inapp_asset_changes)

## What Changed

### Updated Tables

**products table:**
- Added: `product_type`, `is_embeddable`, `needs_attention`, `attention_reason`, `attention_since`
- Status: Now includes 'private' option ('draft', 'private', 'public', 'archived')

**sales table:**
- Added: `payment_method`, `shipping_address`, `order_notes`

**users table:**
- Added: `credits_balance`, `onboarding_completed`

**sale_royalty_transactions:**
- Removed: `sale_item_asset_id`, `asset_royalty_id`
- Added: `product_royalty_id` (now references product_royalties)

**notifications, activity_feed, log_events:**
- Entity types: Removed 'asset' and 'jam', now only: 'user', 'document', 'product', 'sale'

**notifications.action_type:**
- Removed: 'asset_price_changed', 'asset_files_changed', 'asset_royalties_changed', 'jam_submission_approved'
- Kept: 'product_needs_review', 'product_price_conflict', 'sale_completed', 'royalty_payment_received', 'document_shared', 'general'

### New Tables
- `product_files` - Downloadable files for products
- `product_documents` - Documents attached to products with PDF generation
- `product_components` - Product-in-product embedding
- `product_royalties` - Royalty splits for contributors
- `notification_settings` - User notification preferences

### Storage Buckets
- Removed: `asset-files`, `asset-images`
- Added: `product-files` (private - requires purchase to download)
- Kept: `product-images`, `user-avatars`

## TypeScript Type Updates

Updated `/src/types/` files:

### system.types.ts
- `NotificationEntityType`: Removed 'asset', 'jam'
- `NotificationActionType`: Removed asset/jam specific actions
- `ActivityEntityType`: Removed 'asset', 'jam'
- `NotificationSettings`: Removed jam/asset preference fields
- Removed: `AssetChangeLog` interface, `AssetChangeType` type

### commerce.types.ts
- Removed: `SaleItemAsset` interface
- `SaleRoyaltyTransaction`: Updated to use `product_royalty_id` instead of `asset_royalty_id`/`sale_item_asset_id`

## Benefits of Consolidation

1. **Clarity**: Each migration file represents one complete domain
2. **Maintainability**: Single source of truth per domain
3. **Performance**: All indexes defined upfront
4. **Consistency**: Naming conventions consistent throughout
5. **Reduced Complexity**: 18 migration files → 6 migration files

## Applying These Migrations

**⚠️ IMPORTANT: No production deployment exists yet, so backwards compatibility is not an issue.**

### Option 1: Automated Script (Recommended)
```bash
cd supabase
./apply_consolidated_migrations.sh
```

This script will:
1. Backup current migrations to `migrations_backup_[timestamp]`
2. Replace migrations with consolidated files
3. Guide you through database reset

### Option 2: Manual Process
```bash
# 1. Backup current migrations
cd supabase
cp -r migrations migrations_backup_$(date +%Y%m%d_%H%M%S)

# 2. Replace with new migrations
rm -rf migrations
mv migrations_new migrations

# 3. Reset local database
supabase db reset

# 4. Verify
supabase db diff
```

### After Application
1. ✅ Run `supabase db reset` to apply fresh migrations
2. ✅ Verify all tables exist with `supabase db diff`
3. ✅ Run application smoke tests
4. ✅ Commit changes to git

## Migration File Sizes

| File | Tables | Approx Lines |
|------|--------|--------------|
| 00001_core_extensions.sql | 0 | 30 |
| 00002_users_domain.sql | 4 | 235 |
| 00003_documents_domain.sql | 4 | 290 |
| 00004_products_domain.sql | 9 | 580 |
| 00005_commerce_domain.sql | 8 | 380 |
| 00006_system_domain.sql | 9 | 450 |
| **Total** | **34 tables** | **~1,965 lines** |

## Verification Checklist

After applying migrations:

- [ ] All 34 tables exist in database
- [ ] No asset-related tables remain
- [ ] No jam-related tables remain
- [ ] product_royalties table exists
- [ ] sale_royalty_transactions references product_royalties (not asset_royalties)
- [ ] Storage buckets: product-files, product-images, user-avatars exist
- [ ] RLS policies are in place for all tables
- [ ] TypeScript types match database schema
- [ ] Application builds without errors
- [ ] All tests pass

## Need Help?

If you encounter issues:
1. Check the backup in `migrations_backup_[timestamp]`
2. Review the agent reports in `/.claude/plans/jiggly-snacking-cake.md`
3. Verify TypeScript types in `/src/types/`

---

**Consolidation Date**: 2026-01-11
**Agent Reports**: Project PM (ab778c8), Database Architect (a0180c2)
