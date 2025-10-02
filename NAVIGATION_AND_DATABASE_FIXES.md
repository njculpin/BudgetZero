# Navigation & Database Fixes - Session Summary

## Overview
Fixed critical navigation issues, database table mismatches, and consolidated the project structure to use a unified `projects` table instead of the legacy `game_projects` table.

---

## 1. Database Migration Fixes

### Problem
- Code was referencing `projects` table but database only had `game_projects`
- Migration to create unified `projects` table existed but had multiple issues:
  - Rollback migration was running immediately after the "up" migration
  - Documents migration had SQL errors (missing JOINs, wrong column references)
  - Performance indexes referenced non-existent `users` table

### Solution
- **Deleted** rollback migration: `20251001000001_phase0_unified_projects_down.sql`
- **Fixed** documents migration: Added proper JOIN for migrating rulebooks
- **Fixed** indexes migration: Removed reference to non-existent `users` table
- **Reset** database to apply all migrations correctly

### Result
✅ Unified `projects` table with `project_type` field ('game', 'model', 'illustration')
✅ Each project can contain documents, models, and illustrations (as assets)
✅ Attribution system with `project_asset_references` table for royalty tracking

---

## 2. Global Table Reference Updates

### Problem
- 12 files still referenced `game_projects` table instead of `projects`
- Caused "table not found" errors throughout the application

### Solution
Replaced all `game_projects` references with `projects` in:

**Services:**
- `/lib/services/game-projects.ts` - All queries
- `/lib/services/project-service.ts` - All queries
- `/lib/services/asset-integration.ts` - Foreign key reference

**Pages:**
- `/app/dashboard/page.tsx` - Both project queries
- `/app/projects/[slug]/models/[id]/page.tsx` - Breadcrumb query
- `/app/projects/[slug]/illustrations/[id]/page.tsx` - Breadcrumb query

**API Routes:**
- `/app/api/project-asset-references/route.ts` - Project verification
- `/app/api/documents/route.ts` - Project ownership check

**Components:**
- `/components/projects/project-search-modal.tsx` - Search query

### Result
✅ 0 occurrences of `game_projects` in codebase
✅ All queries now use unified `projects` table
✅ Build passes successfully

---

## 3. Navigation Improvements

### Breadcrumb Context Fixes
**Problem:** Asset detail pages lost project context in breadcrumbs

**Solution:**
- Models/Illustrations detail pages now fetch parent project
- Breadcrumbs show: `My Projects → {Project Title} → {Asset Title}`
- Falls back to global browse breadcrumbs when accessed outside project context

**Files Updated:**
- `/app/projects/[slug]/models/[id]/page.tsx`
- `/app/projects/[slug]/illustrations/[id]/page.tsx`

### Breadcrumb Label Standardization
**Problem:** Inconsistent labels ("Projects" vs "My Projects")

**Solution:**
- Standardized all pages to use "My Projects" as root label
- Updated `/app/projects/[slug]/create-asset/page.tsx`

### Direct Navigation Links
**Problem:** Redirect routes added unnecessary latency

**Solution:**
- Updated project detail page CTAs to link directly to unified create page
- Changed: `/create-model` → `/create-asset?type=model`
- Changed: `/create-illustration` → `/create-asset?type=illustration`
- Eliminated server redirect step

**File Updated:**
- `/app/projects/[slug]/page.tsx`

### Sidebar Navigation Fix
**Problem:** Links to non-existent `/discover/*` routes (404s)

**Solution:**
- Updated sidebar to use existing `/browse` route
- Consolidated 3 broken links into single working Browse link

**File Updated:**
- `/components/layouts/app-sidebar.tsx`

---

## 4. UI/UX Improvements

### Project Creation Page
**Problem:** Page said "Create New Game Project" - too specific

**Solution:**
- Changed to "Create New Project" (generic)
- Updated description: "Start a new project for your tabletop game"

**File Updated:**
- `/app/projects/new/page.tsx`

### Asset Creation Flow
**Created:** Unified asset creation page with type-based routing
- Single page handles all asset types (model, illustration, photo, texture, audio)
- Configuration-based approach using `ASSET_CONFIG` object
- Old routes now redirect to unified page

**File Created:**
- `/app/projects/[slug]/create-asset/page.tsx`

**Files Updated (redirects):**
- `/app/projects/[slug]/create-model/page.tsx`
- `/app/projects/[slug]/create-illustration/page.tsx`

---

## 5. Reusable Components Created

### RevenueSplitPreview Component
**Purpose:** Eliminate duplicate revenue calculation logic

**Features:**
- 3 variants: `default`, `compact`, `card`
- Centralized revenue calculations
- Consistent display across app

**File Created:**
- `/components/shared/revenue-split-preview.tsx`

**Files Using Component:**
- `/app/projects/[slug]/page.tsx`
- `/components/dashboard/attribution-request-card.tsx`
- `/components/assets/reference-asset-button.tsx`

### Revenue Utilities
**File Created:**
- `/lib/constants/revenue.ts` - Platform fee constants
- `/lib/utils/revenue.ts` - Calculation utilities

---

## 6. Database Schema (Final State)

### Main Tables
- **`projects`** - Unified table with `project_type` discriminator
- **`documents`** - Text-based assets (rulebooks, guides)
- **`assets`** - Models, illustrations, photos, textures, audio
- **`profiles`** - User profiles

### Attribution & Collaboration Tables
- **`project_asset_references`** - Asset attribution with royalty tracking
- **`project_document_references`** - Document attribution
- **`project_collaborators`** - Collaboration management
- **`project_assets`** - Direct project-asset relationships
- **`project_merge_proposals`** - Merge proposals
- **`project_relationships`** - Project relationships

---

## 7. Build & Testing Status

✅ **Build:** Passes successfully
✅ **TypeScript:** No errors
✅ **Database:** All migrations applied
✅ **Tables:** Verified structure correct
✅ **References:** All code uses correct table names

---

## 8. Key Architectural Decisions

### Unified Projects Table
- Single `projects` table with `project_type` field
- Supports: 'game', 'model', 'illustration' types
- Game-specific fields are nullable for other types
- Simplifies queries and reduces joins

### Asset Type Strategy
- Documents, models, illustrations are all "assets"
- Separate tables for different asset characteristics
- Attribution tracked via `project_asset_references`
- Royalty percentages stored per reference (0-50%)

### Attribution System
- Assets can be used across multiple projects
- Creator must approve each reference
- Royalty split tracked per usage
- Platform fee: 2%, Creator royalty: 0-50%, Project owner: remainder

---

## Files Modified (Total: 21)

### Migrations (3)
- Deleted: `20251001000001_phase0_unified_projects_down.sql`
- Fixed: `20251001000002_create_documents_table.sql`
- Fixed: `20251001000003_add_performance_indexes.sql`

### Services (3)
- `/lib/services/game-projects.ts`
- `/lib/services/project-service.ts`
- `/lib/services/asset-integration.ts`

### Pages (6)
- `/app/projects/page.tsx`
- `/app/projects/new/page.tsx`
- `/app/projects/[slug]/page.tsx`
- `/app/projects/[slug]/models/[id]/page.tsx`
- `/app/projects/[slug]/illustrations/[id]/page.tsx`
- `/app/dashboard/page.tsx`

### API Routes (2)
- `/app/api/project-asset-references/route.ts`
- `/app/api/documents/route.ts`

### Components (4)
- `/components/layouts/app-sidebar.tsx`
- `/components/projects/project-search-modal.tsx`
- `/components/dashboard/attribution-request-card.tsx`
- `/components/assets/reference-asset-button.tsx`

### New Files Created (3)
- `/components/shared/revenue-split-preview.tsx`
- `/lib/constants/revenue.ts`
- `/lib/utils/revenue.ts`

---

## Next Steps

### Recommended Cleanup
1. Consider consolidating migrations into fewer files (24 → ~5-10)
2. Remove or archive unused migration files when ready for production
3. Add seed data for testing

### Future Enhancements
1. Add project type-specific views/filtering
2. Implement document collaboration features
3. Add project analytics dashboard
4. Build marketplace for published projects

---

## Testing Checklist

- [x] Database migrations apply successfully
- [x] All tables exist with correct schema
- [x] Build passes without errors
- [x] No TypeScript errors
- [x] No references to legacy `game_projects` table
- [x] Navigation breadcrumbs maintain context
- [x] Sidebar links work correctly
- [ ] Manual testing: Create project flow
- [ ] Manual testing: Add assets to project
- [ ] Manual testing: Attribution request flow
- [ ] Manual testing: Dashboard pending requests

---

*Session completed: 2025-10-01*
