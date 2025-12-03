# Navigation UX Analysis

**Date:** 2025-12-03
**Status:** Current navigation has critical UX issues - restructuring recommended
**Priority:** High - Impacts onboarding, discoverability, and user mental model

---

## Executive Summary

The current navigation has a fundamental information architecture problem: **the "Create" and "Discover" dropdowns link to identical pages** (`/products` and `/assets`), creating confusion about whether these pages are for browsing marketplace content or managing your own content.

**Core Issue:** Game Loopers is trying to serve two distinct user journeys (creator and consumer) through a single navigation structure, resulting in unclear affordances and cognitive overload.

**Recommendation:** Implement **Kickstarter-style navigation** optimized for discovery/purchasing (customer-first), with creator tools accessed through a dedicated "Dashboard" or user menu. This aligns with the platform's current state (60% complete MVP, needs customers to validate creator offerings).

---

## 1. Current Navigation UX Issues

### Critical Problems

#### Problem 1: Duplicate Links Create Confusion

**Current Structure:**
```
Create dropdown:
  - Assets      → /assets/index
  - Products    → /products/index
  - Documents   → /documents/index
  - Jams        → /jams/index

Discover dropdown:
  - Products    → /products/index (SAME PAGE!)
  - Assets      → /assets/index (SAME PAGE!)
  - Jams        → /jams/index (SAME PAGE!)
  - Creators    → /users
```

**Why This Fails:**
- **Violates user expectations:** Dropdowns with the same labels should go to different destinations
- **Ambiguous affordance:** Is `/products` a marketplace to browse, or a dashboard to manage my products?
- **Redundancy without purpose:** Users ask "Why are Products in both menus?"
- **Navigation bloat:** 7 links organized into 2 dropdowns that don't clarify intent

#### Problem 2: Mental Model Mismatch

**Page Reality Check:**

Looking at `/src/pages/products/index.astro` (lines 1-50):
```typescript
// This is a PUBLIC MARKETPLACE page:
- Allows GUESTS to browse (no auth required)
- Shows ALL products from ALL creators
- Has search/filter UI
- Optimized for discovery and purchasing
```

Looking at `/src/pages/dashboard.astro` (lines 1-50):
```typescript
// This is a CREATOR DASHBOARD page:
- Requires authentication (line 21-26)
- Shows only YOUR products (line 33: getUserProducts(userId))
- Has "Create New" actions
- Optimized for content management
```

**The Problem:**
- Navigation labels suggest `/products` is for "Create" (implying "my products")
- Page implementation shows `/products` is for "Discover" (showing "all products")
- **This creates a disconnect between navigation intent and page reality**

#### Problem 3: Unclear User Journey

**New Creator Journey (Current Nav):**
1. User signs up
2. Sees "Create" dropdown
3. Clicks "Create → Products"
4. Lands on `/products/index` (marketplace showing everyone's products)
5. Confused: "Wait, I wanted to create MY product, not browse others' products"
6. **Likely outcome:** Bounces or searches for "New Product" button

**New Customer Journey (Current Nav):**
1. User lands on homepage
2. Signs in (or browses as guest)
3. Sees TWO dropdowns: "Create" and "Discover"
4. Confused: "Am I supposed to create or discover? What's the difference?"
5. Clicks both dropdowns, sees duplicate links
6. **Likely outcome:** Cognitive overload, feels like broken UI

#### Problem 4: No Visual Hierarchy

**Issues:**
- All nav items have equal visual weight (no primary CTA)
- Cart button is small and de-emphasized
- User menu (@username) competes with action buttons
- No clear distinction between primary actions (Shop, Browse) and secondary (Settings, Dashboard)

---

## 2. Information Architecture Analysis

### Current IA Problems

**The Root Cause:**

Game Loopers is a **dual-sided marketplace** (creators + consumers) trying to use **single-page-per-entity** architecture. This creates ambiguity:

- `/products` = Marketplace for EVERYONE or Dashboard for ME?
- `/assets` = Browse to purchase or Manage my uploads?
- `/jams` = Discover jams to join or View my jam entries?

**IA Pattern Analysis:**

| Pattern | Example Platform | Approach | Game Loopers Fit? |
|---------|-----------------|----------|-------------------|
| **Single-page (ambiguous)** | Early itch.io | `/games` shows your games if logged in, all games if not | No - creates confusion for MVP |
| **Explicit separation** | Gumroad, Etsy | `/discover` (browse) vs `/products` (manage yours) | Yes - clear separation |
| **Tab-based toggle** | GitHub | `/products` with "Public/Your repos" tabs | Possible - but requires UI complexity |
| **Dashboard-first** | Notion | Landing page is your workspace, marketplace is secondary | No - we need customer discovery first |

**What Game Loopers Needs:**

At MVP stage (60% complete, launching in 1 week), the platform needs:
1. **Customer acquisition first** (need buyers to validate creator offerings)
2. **Clear marketplace discovery** (products, assets, jams visible to guests)
3. **Intuitive creator onboarding** (easy to find "Create New Product" without cluttering nav)
4. **Scalable IA** (can add categories, filters, tabs later without nav overhaul)

---

## 3. Proposed Kickstarter-Style Approach

### Why Kickstarter's Model Fits

**Kickstarter Navigation:**
```
Primary Nav:
  - Discover Projects (categories, trending, search)
  - Start a Project (creator action, less prominent)
  - Search bar (always visible)
  - User menu: My Projects, Backed Projects, Settings

Hierarchy:
  1. Discovery is primary (optimized for backers)
  2. Creation is secondary (accessed via user menu or CTA)
  3. User-specific content hidden until needed (dashboard pattern)
```

**Why This Works for Game Loopers:**

1. **Aligns with current MVP goals** (ROADMAP.md Phase 1):
   - "Launch functional digital marketplace" (discovery focus)
   - "Recruit 20-50 beta creators" (small creator base initially)
   - "100+ registered users" (need customers > creators at launch)

2. **Matches user personas** (PERSONAS.md):
   - **4 personas:** Designer, Modeler, Illustrator, Consumer
   - **1 of 4 is pure consumer** (25% of user base)
   - **3 of 4 are creators who also buy** (browse first, create second)
   - **Insight:** Even creators need to discover assets to use in their products!

3. **Reduces cognitive load:**
   - First-time visitors see clean marketplace (not creator tools)
   - Creators access dashboard via familiar pattern (user menu → "My Products")
   - No duplicate links or ambiguous labels

4. **Scalable for future phases** (ROADMAP.md Phase 2-4):
   - Can add categories to primary nav without restructuring
   - Physical services (printers, painters) fit into user menu as "My Services"
   - Advanced search/filters don't conflict with nav structure

### UX Trade-Offs

**Pros:**
- Clear separation: Browse (public) vs Manage (private)
- Familiar mental model (matches Etsy, Gumroad, Kickstarter)
- Optimized for customer acquisition (Phase 1 goal)
- Reduces navigation clutter (2 dropdowns → 0 dropdowns)
- Easier to A/B test (can add "Create" CTA in header if creator engagement drops)

**Cons:**
- Creators must learn "user menu = my content" pattern
- "Create New Product" is one extra click away (nav → user menu → My Products → Create button)
- Risk: New creators don't discover they can create content

**Mitigation Strategies:**
1. **Onboarding wizard** (already built - `FirstTimeUserOnboarding.tsx`)
2. **Empty state CTAs** (dashboard shows "Create Your First Product" when empty)
3. **Header CTA for creators** (can add "Start Creating" button for authenticated users)
4. **Dashboard as default post-login** (redirect to `/dashboard` after sign-in, not `/products`)

---

## 4. Editor/Viewer Separation

### Question: Where Should Content Management Live?

**Option A: Dashboard-Centric (Recommended)**

```
Public Pages (Browse):
  /products        → Marketplace (all products, search/filter)
  /assets          → Asset marketplace (all assets, search/filter)
  /jams            → Jam directory (all jams, past/active)
  /users           → Creator directory

Private Pages (Manage):
  /dashboard                  → Overview (your stats, recent content)
  /dashboard/products         → Your products (create, edit, archive)
  /dashboard/assets           → Your assets (upload, edit, manage files)
  /dashboard/documents        → Your documents (write, collaborate)
  /dashboard/jams             → Your jam entries (submit, review)
  /dashboard/purchases        → Your purchases (download links)
  /dashboard/payouts          → Payout history & Stripe Connect
```

**Pros:**
- Clear URL structure: `/products` = browse, `/dashboard/products` = manage
- Familiar pattern (YouTube: /videos vs /studio/videos)
- Easy to communicate: "Public pages for browsing, Dashboard for managing"
- Supports future expansion (add `/dashboard/sales`, `/dashboard/analytics`)

**Cons:**
- Requires URL refactoring (move existing pages or create new dashboard pages)
- More pages to build (but can reuse existing components)

**Option B: Tab-Based Toggle (Not Recommended for MVP)**

```
/products page with tabs:
  - "Browse All" tab (default for guests)
  - "My Products" tab (visible when authenticated)
```

**Pros:**
- No new routes needed
- Familiar pattern (GitHub repos)

**Cons:**
- Complex UI state management (tabs, filters, search scoped to tab)
- Performance: Loading "My Products" on every browse visit is wasteful
- SEO: Hard to share links (which tab is the URL for?)
- Doesn't scale (add "Following", "Trending", "New" tabs?)

**Option C: Subdomain Separation (Overkill for MVP)**

```
shop.gameloopers.com  → Browse marketplace
studio.gameloopers.com → Creator tools
```

**When to consider:** Post-Phase 3 if creator tools become complex enough to warrant separate app

---

### How Do Users Discover Creation Features?

**Challenge:** If creator actions are hidden in user menu, how do new creators learn they can create?

**Solution: Multi-Touch Onboarding**

1. **First-Time User Modal** (already built - `FirstTimeUserOnboarding.tsx`):
   ```
   "Welcome to Game Loopers! What brings you here?"
   [Button: I want to sell games/assets]
   [Button: I want to buy games]

   If creator → Show quick tour: "Access your dashboard from the menu"
   ```

2. **Dashboard Empty States** (already implemented):
   ```
   Dashboard shows:
   - "You haven't created any products yet"
   - [CTA Button: "Create Your First Product"]
   ```

3. **Persistent Creator CTA** (new - add to header):
   ```
   For authenticated users without content:
   Show small "Start Creating" button in header (next to user menu)
   Remove after first product/asset created
   ```

4. **Post-Signup Redirect**:
   ```
   After sign-up:
   - Redirect to /dashboard (not /products)
   - Show welcome message: "Check out your dashboard to create products"
   ```

5. **Contextual Hints**:
   ```
   On /products browse page, if authenticated and creator=false:
   Show subtle banner: "Want to sell your own games? Visit your dashboard"
   ```

**Industry Examples:**

- **Etsy:** "Start selling" button in header (always visible, even on shop pages)
- **Gumroad:** Dashboard-first (login lands on dashboard, not public shop)
- **itch.io:** "Upload Game" in main nav (creator-first platform)
- **Kickstarter:** "Start a project" in main nav (but less prominent than "Discover")

**For Game Loopers:**

Given ROADMAP.md goals (100+ users, 20+ creators), the platform needs customers first. Therefore:
- **Don't make "Create" too prominent** (avoid attracting creators without customer base)
- **Do make it discoverable** (onboarding wizard, dashboard CTAs)
- **Scale gradually** (if creator signups drop, add header CTA)

---

## 5. Category-Based Navigation

### Should Categories Be Primary Nav?

**User's Proposal:**
```
Primary Nav:
  - RPGs
  - Board Games
  - Card Games
  - Miniatures
  - Art
  - Models
```

**Analysis:**

#### Is It Too Early?

**Current State (per ROADMAP.md):**
- MVP launching in 1 week
- Target: 20+ creators with public products
- Current: Unknown number of products (likely <10 if in development)

**Too Early Because:**
1. **Empty categories create poor UX**
   - "RPGs" category shows 2 products → looks abandoned
   - Users lose trust in empty marketplaces

2. **Premature optimization**
   - Don't know which categories will be popular
   - Risk: Optimize nav for "Board Games" but users create "TTRPG" content

3. **Limits flexibility**
   - Hard-coding categories in nav = committed to that taxonomy
   - What if "Miniatures" is too broad? Should it be "Fantasy Minis" vs "Sci-Fi Minis"?

**Better Approach for MVP:**

**Phase 1 (Week 8 - Launch):**
```
Primary Nav:
  - [Logo: Game Loopers]
  - [Search Bar] (always visible)
  - Cart
  - User Menu
```

Simple, clean, search-focused. Let users find content via search and tags.

**Phase 2 (Month 2 - After Launch Data):**
```
Primary Nav:
  - Shop (or "Browse Products")
  - Assets (or "Creator Resources")
  - Jams
  - [Search Bar]
  - Cart
  - User Menu
```

Establish high-level categories based on actual content distribution.

**Phase 3 (Month 4 - After Product-Market Fit):**
```
Primary Nav:
  - RPGs (mega menu with subcategories)
  - Board Games
  - Miniatures
  - Assets (creator tools)
  - Jams
  - [Search Bar]
  - Cart
  - User Menu
```

Add specific categories with mega-menus once each category has 50+ products.

#### How Categories Work with Assets, Documents, Jams

**Problem:** Categories make sense for products, but how do assets fit?

**Option A: Products Only**
- Categories nav only shows products
- Assets accessed via "Creator Resources" or "Asset Marketplace" link
- Jams remain separate (time-based events, not categories)

**Option B: Shared Taxonomy**
- Products and Assets share categories (RPG assets, Board Game assets)
- Category pages have tabs: "Products | Assets"
- Example: `/rpgs` shows all RPG content, toggle to see just products or just assets

**Option C: Separate Hierarchies**
- Products have content categories (RPGs, Board Games)
- Assets have type categories (3D Models, Art, PDFs)
- Two separate nav sections (not recommended - cluttered)

**Recommendation: Option A + Smart Filtering**

```
Primary Nav (Phase 3+):
  - RPGs → /products?category=rpgs
  - Board Games → /products?category=board-games
  - Assets → /assets (with filters: 3D Models, Art, PDFs, Audio)
  - Jams → /jams
```

**Why:**
- Keeps nav clean (products are primary monetization)
- Assets are creator-focused (not end-consumer-focused)
- Jams are time-based events (don't fit category model)

#### Category Navigation Best Practices

**From Industry Leaders:**

**Etsy:**
- Mega-menus with image previews
- 3 levels: Category → Subcategory → Material
- Always shows "All Categories" link
- Search bar is more prominent than categories

**Amazon:**
- Hamburger menu for all categories (not always visible)
- Home page shows category tiles (not nav)
- Search is primary, categories are secondary

**Kickstarter:**
- Simple category links (Arts, Comics, Crafts, etc.)
- No subcategories in nav (handled on category page)
- "Discover" page shows all categories as tiles

**Game Loopers Should:**
1. **Wait until 100+ products per category** before adding to nav
2. **Use tag-based filtering** initially (more flexible than categories)
3. **Promote search** over categories (better for small inventory)
4. **Test category demand** via analytics (which tags are searched most?)

---

## 6. User Personas and Navigation

### Persona Journey Analysis

#### Persona 1: First-Time Visitor (No Account)

**Goals:**
- Understand what Game Loopers is
- Browse products to gauge quality
- Decide if worth creating account

**Current Nav Experience:**
- Sees: Sign in, Sign up buttons (good)
- Doesn't see: Create, Discover dropdowns (hidden when not authenticated - GOOD)
- **Issue:** No clear entry point to "See what's available"

**Ideal Nav for Guest:**
```
[Logo] [Search: "Search games, assets, creators"] [Browse] [Sign In] [Sign Up]

Click "Browse" → Lands on /products marketplace
OR
Homepage shows featured products (browse CTA)
```

**Recommendation:**
- Add "Browse" or "Shop" link visible to guests
- Make search bar prominent (always visible, even for guests)
- Homepage should be discovery-focused (not auth wall)

---

#### Persona 2: New Creator (Just Signed Up)

**Goals:**
- Upload first product or asset
- Understand how royalties work
- Find collaborators

**Current Nav Experience:**
- Sees: Create, Discover dropdowns, @username menu, Cart
- Clicks "Create → Products"
- **Issue:** Lands on public marketplace, not product creation form
- Confused about where to actually create

**Ideal Nav for New Creator:**
```
[Logo] [Search] [Dashboard] [@username] [Cart]

Post-signup flow:
1. Sign up → Redirect to /dashboard (not /products)
2. See FirstTimeUserOnboarding modal: "Create your first product"
3. Dashboard shows empty state: "You haven't created anything yet [Create Product button]"
4. Click button → /dashboard/products/new (creation form)
```

**Recommendation:**
- Remove "Create" dropdown (confusing)
- Make Dashboard the post-signup landing page
- Use onboarding wizard to teach "Dashboard = your content"

---

#### Persona 3: Returning Creator (Has 5+ Products)

**Goals:**
- Check sales/earnings
- Upload new asset
- Respond to jam invitation

**Current Nav Experience:**
- Sees: Create, Discover dropdowns, @username, Cart
- Clicks "@username → Dashboard" to check earnings
- Clicks "Create → Assets" to upload (but lands on marketplace)
- **Issue:** Inconsistent mental model (sometimes menu, sometimes dropdown)

**Ideal Nav for Returning Creator:**
```
[Logo] [Browse] [Search] [Dashboard] [@username] [Cart]

Workflow:
1. Clicks "Dashboard" → Lands on /dashboard (stats, recent content)
2. Clicks "@username" → Sees: My Products, My Assets, Purchases, Settings
3. Or uses Dashboard nav: "Products | Assets | Documents | Jams"
```

**Recommendation:**
- Dashboard is primary for creators (fast access)
- User menu is secondary for account settings
- No dropdowns (direct links or dashboard sections)

---

#### Persona 4: Customer (Buyer, Non-Creator)

**Goals:**
- Find products to purchase
- Discover new creators
- Download purchased assets

**Current Nav Experience:**
- Sees: Create, Discover dropdowns
- Confused: "Should I click Create or Discover?"
- Clicks "Discover → Products" (correct)
- **Issue:** "Create" dropdown is visual noise (not relevant to buyer)

**Ideal Nav for Customer:**
```
[Logo] [Browse] [Jams] [Creators] [Search] [Cart] [@username]

Workflow:
1. Browse → See all products (marketplace)
2. Jams → Discover game jams (events)
3. Creators → Find favorite creators
4. @username → My Purchases (download links)
```

**Recommendation:**
- Remove "Create" dropdown (not relevant to 75% of users)
- Emphasize marketplace links (Browse, Jams, Creators)
- Cart should be prominent (primary CTA for buyers)

---

### One Nav for All Personas?

**Question:** Can one navigation structure serve all personas well?

**Answer:** Yes, but only if designed for the PRIMARY persona.

**Primary Persona at MVP Launch:**
According to ROADMAP.md Phase 1 goals:
- 20+ creators (small)
- 100+ registered users (larger)
- **Ratio: 5 users per 1 creator**

**Therefore:** Navigation should be optimized for CUSTOMERS, with creator tools accessible but not dominant.

**This Means:**
1. **Marketplace-first nav** (Browse, Shop, Products visible to all)
2. **Creator tools secondary** (Dashboard, user menu)
3. **Progressive disclosure** (show creator CTAs after onboarding)

**Example: YouTube's Approach**
- **Most users:** Watch videos (consumer nav: Home, Trending, Subscriptions)
- **Some users:** Upload videos (creator tools: YouTube Studio, hidden in user menu)
- **Both personas:** Same nav, but optimized for majority (viewers)

**Game Loopers Should:**
- **Show to all:** Browse, Products, Assets, Jams, Creators, Search, Cart
- **Show to authenticated:** Dashboard (creator tools), @username (account)
- **Hide from guests:** Create dropdowns, Dashboard (avoid overwhelming new visitors)

---

## 7. Recommended Navigation Structure

### Recommended Approach: Dashboard-Centric Marketplace

**Hierarchy:**
1. **Public marketplace** = primary (optimized for discovery)
2. **Creator dashboard** = secondary (optimized for content management)
3. **User menu** = tertiary (settings, purchases, account)

**Visual Structure:**

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo: Game Loopers]  [Browse ▼]  [Search...]  [Dashboard]  [Cart]  [@username ▼]  │
└────────────────────────────────────────────────────────────────┘

For GUESTS (not authenticated):
┌────────────────────────────────────────────────────────────────┐
│  [Logo]  [Browse ▼]  [Search Products, Assets, Creators...]  [Sign In]  [Sign Up]  │
└────────────────────────────────────────────────────────────────┘

For AUTHENTICATED USERS:
┌────────────────────────────────────────────────────────────────┐
│  [Logo]  [Browse ▼]  [Search...]  [Dashboard]  [Cart]  [@username ▼]  │
└────────────────────────────────────────────────────────────────┘

Browse Dropdown (Mega Menu):
  Products      → /products (marketplace)
  Assets        → /assets (marketplace)
  Jams          → /jams (directory)
  Creators      → /users (directory)

@username Dropdown:
  Dashboard     → /dashboard (overview)
  My Purchases  → /purchases (downloads)
  Payouts       → /connect/onboarding (Stripe)
  Settings      → /settings (account)
  ─────────────
  Sign Out

Dashboard Page Sections (tabs or left nav):
  Overview      → /dashboard (stats, recent activity)
  Products      → /dashboard/products (manage, create new)
  Assets        → /dashboard/assets (manage, upload new)
  Documents     → /dashboard/documents (write, collaborate)
  Jams          → /dashboard/jams (entries, submissions)
```

---

### Key Changes from Current Nav

**Before (Current):**
```
Authenticated:
  [Logo] [Create ▼] [Discover ▼] [Cart] [@username ▼]

  Create Dropdown:
    - Assets, Products, Documents, Jams

  Discover Dropdown:
    - Products, Assets, Jams, Creators

  @username Dropdown:
    - Dashboard, Purchases, Payouts, Settings, Sign Out
```

**After (Recommended):**
```
Authenticated:
  [Logo] [Browse ▼] [Search...] [Dashboard] [Cart] [@username ▼]

  Browse Dropdown:
    - Products, Assets, Jams, Creators

  @username Dropdown:
    - Dashboard, Purchases, Payouts, Settings, Sign Out
```

**Changes:**
1. **Removed "Create" dropdown** (confusing, duplicate links)
2. **Renamed "Discover" to "Browse"** (clearer intent)
3. **Added "Dashboard" as top-level link** (fast creator access)
4. **Made Search prominent** (primary discovery method for MVP)
5. **Kept user menu structure** (working well)

---

### Rationale for Each Element

#### 1. "Browse" Dropdown (Not "Discover")

**Why "Browse":**
- Clearer action verb ("I'm going to browse products")
- Matches user intent (shopping/exploring)
- Common pattern (Amazon, Etsy use "Shop/Browse")

**Why NOT "Discover":**
- Sounds like algorithmic curation (implies "for you" recommendations)
- Platform doesn't have recommendation engine yet
- Overpromises if catalog is small (<100 products at launch)

#### 2. Dashboard as Top-Level Link

**Why Prominent:**
- Fast access for returning creators (most common action)
- Signals "this is where you manage your content"
- Reduces clicks (current: @username → Dashboard = 2 clicks, new: Dashboard = 1 click)

**Why NOT Hidden in User Menu:**
- Hidden = discovery problem (new creators don't know where to go)
- Inconsistent with "creator-friendly platform" positioning
- Requires additional onboarding (more friction)

**Alternative:** If dashboard link feels too prominent, use icon instead of text:
```
[Logo] [Browse ▼] [Search...] [📊 Dashboard Icon] [Cart] [@username ▼]
```

#### 3. Search Bar Always Visible

**Why Critical for MVP:**
- Small catalog (20 products) = categories don't make sense yet
- Tags are more flexible than categories (products have multiple tags)
- Search is fastest way to find specific content ("dragon miniatures")
- Guests need to search before signing up (reduce signup friction)

**Implementation:**
```
┌──────────────────────────────────────────────┐
│  [🔍 Search products, assets, creators...]  │
└──────────────────────────────────────────────┘

Behavior:
- Searches across: Products, Assets, Jams, Users (unified)
- Shows type filters: [Products] [Assets] [Jams] [Creators]
- Instant results (typeahead if possible)
```

#### 4. Cart Remains Visible

**Current State:**
- Cart is visible (good)
- Icon is small (could be more prominent)

**Recommendation:**
- Add badge count: Cart (3) if items in cart
- Make button slightly larger (primary action for buyers)
- Ensure contrast (should stand out more than Dashboard)

---

### Mobile Navigation Structure

**Current Mobile:**
```
[Hamburger] [Logo] [Hidden Actions]

Hamburger Menu:
  - Documents, Assets, Products, Jams, Purchases, Payouts, Users, Tags, About, Cart, Terms, Privacy

Actions Drawer:
  - Dashboard
  - Sign Out
```

**Recommended Mobile:**
```
┌────────────────────────────────────────────┐
│  [☰]  [Logo: Game Loopers]  [🛒] [👤]     │
└────────────────────────────────────────────┘

Hamburger Menu (for AUTHENTICATED):
  Browse
    - Products
    - Assets
    - Jams
    - Creators
  ─────────────
  Dashboard
    - Overview
    - Products
    - Assets
    - Documents
  ─────────────
  My Account
    - Purchases
    - Payouts
    - Settings
  ─────────────
  About, Terms, Privacy

Hamburger Menu (for GUESTS):
  Browse
    - Products
    - Assets
    - Jams
    - Creators
  ─────────────
  Sign In
  Sign Up
  ─────────────
  About, Terms, Privacy

Cart Icon (🛒):
  - Tap → Go to /cart (no dropdown on mobile)

User Icon (👤):
  - Tap → Open user menu modal (Dashboard, Purchases, Settings, Sign Out)
```

**Mobile Best Practices:**
1. **Persistent bottom nav** (optional - adds native app feel):
   ```
   [Browse] [Jams] [Dashboard] [Cart] [Account]
   ```

2. **Collapsible sections** (reduce scroll in hamburger menu)

3. **Search should open full-screen** (better mobile UX than inline search)

---

## 8. Migration Plan

### Phase 1: URL Structure (No Visual Changes Yet)

**Goal:** Separate public (browse) from private (dashboard) pages

**Changes:**
1. Keep existing routes:
   - `/products` = Public marketplace (no changes)
   - `/assets` = Public marketplace (no changes)
   - `/jams` = Public directory (no changes)
   - `/users` = Public directory (no changes)

2. Create new dashboard routes:
   - `/dashboard` = Overview (already exists - line 1-50 shows dashboard.astro)
   - `/dashboard/products` = NEW - Manage your products
   - `/dashboard/assets` = NEW - Manage your assets
   - `/dashboard/documents` = NEW - Manage your documents
   - `/dashboard/jams` = NEW - Your jam entries

3. Migration: Move creator-specific pages to dashboard:
   ```
   OLD: /products/new
   NEW: /dashboard/products/new

   OLD: /assets/upload
   NEW: /dashboard/assets/new
   ```

**Technical Tasks:**
- [ ] Create `/src/pages/dashboard/products/index.astro` (manage products)
- [ ] Create `/src/pages/dashboard/products/new.astro` (create product)
- [ ] Create `/src/pages/dashboard/products/[id]/edit.astro` (edit product)
- [ ] Create `/src/pages/dashboard/assets/index.astro` (manage assets)
- [ ] Create `/src/pages/dashboard/assets/new.astro` (upload asset)
- [ ] Create `/src/pages/dashboard/assets/[id]/edit.astro` (edit asset)
- [ ] Update all internal links to use new routes
- [ ] Add redirects for old routes (if any existed)

**Estimated Effort:** 2-3 days

---

### Phase 2: Navigation Component Updates

**Goal:** Update navigation to use new structure

**Changes:**

**File: `/src/components/Navigation.astro`**

Before (lines 39-82):
```typescript
const createLinks = [
  { href: "/assets", label: "Assets" },
  { href: "/products", label: "Products" },
  { href: "/documents", label: "Documents" },
  { href: "/jams", label: "Jams" },
];

const discoverLinks = [
  { href: "/products", label: "Products" },
  { href: "/assets", label: "Assets" },
  { href: "/jams", label: "Jams" },
  { href: "/users", label: "Creators" },
];
```

After:
```typescript
const browseLinks = [
  { href: "/products", label: "Products" },
  { href: "/assets", label: "Assets" },
  { href: "/jams", label: "Jams" },
  { href: "/users", label: "Creators" },
];

// Remove createLinks entirely
```

**File: `/src/components/Navigation.astro` (lines 96-101)**

Before:
```astro
<div class="navigation__menu">
  <NavigationDropdown client:load label="Create" links={createLinks} />
  <NavigationDropdown client:load label="Discover" links={discoverLinks} />
</div>
```

After:
```astro
<div class="navigation__menu">
  <NavigationDropdown client:load label="Browse" links={browseLinks} />
  <a href="/dashboard" class="navigation__link">Dashboard</a>
  <div class="navigation__search">
    {/* Add search component */}
  </div>
</div>
```

**Technical Tasks:**
- [ ] Remove `createLinks` from Navigation.astro
- [ ] Rename `discoverLinks` to `browseLinks`
- [ ] Update NavigationDropdown label: "Discover" → "Browse"
- [ ] Add Dashboard link (top-level, visible when authenticated)
- [ ] Add Search component (create `SearchBar.tsx`)
- [ ] Update mobile navigation (remove duplicate links)
- [ ] Update `authedLinks` in mobile nav (lines 62-75)

**Estimated Effort:** 1 day

---

### Phase 3: Dashboard Page Structure

**Goal:** Create cohesive dashboard experience

**New Layout: `/src/layouts/DashboardLayout.astro`**

```astro
---
// Dashboard-specific layout with left sidebar nav
interface Props {
  title: string;
  activeSection?: 'overview' | 'products' | 'assets' | 'documents' | 'jams';
}
---

<Layout title={props.title}>
  <div class="dashboard">
    <aside class="dashboard__sidebar">
      <nav class="dashboard__nav">
        <a href="/dashboard" class:list={{active: activeSection === 'overview'}}>
          Overview
        </a>
        <a href="/dashboard/products" class:list={{active: activeSection === 'products'}}>
          Products
        </a>
        <a href="/dashboard/assets" class:list={{active: activeSection === 'assets'}}>
          Assets
        </a>
        <a href="/dashboard/documents" class:list={{active: activeSection === 'documents'}}>
          Documents
        </a>
        <a href="/dashboard/jams" class:list={{active: activeSection === 'jams'}}>
          Jams
        </a>
      </nav>
    </aside>

    <main class="dashboard__content">
      <slot />
    </main>
  </div>
</Layout>
```

**Technical Tasks:**
- [ ] Create `DashboardLayout.astro`
- [ ] Add dashboard-specific CSS (sidebar, active states)
- [ ] Update existing `/dashboard.astro` to use new layout
- [ ] Create dashboard sections (products, assets, documents, jams)
- [ ] Add empty states to each section ("No products yet - Create one")
- [ ] Add "Create New" buttons in each section

**Estimated Effort:** 2 days

---

### Phase 4: Onboarding Flow Updates

**Goal:** Guide new creators to dashboard

**Changes:**

1. **Post-Signup Redirect:**
   ```typescript
   // File: /src/pages/api/auth/sign-up.ts

   // OLD: return Astro.redirect('/products')
   // NEW: return Astro.redirect('/dashboard')
   ```

2. **Onboarding Modal:**
   ```typescript
   // File: /src/components/dashboard/FirstTimeUserOnboarding.tsx

   // Update copy:
   "Welcome to Game Loopers! Access your dashboard to create products and assets."

   // Update flow:
   [Button: Browse Marketplace] → /products
   [Button: Start Creating] → /dashboard/products/new
   ```

3. **Empty States:**
   ```typescript
   // File: /src/components/dashboard/EmptyState.astro

   <EmptyState
     title="No products yet"
     description="Create your first product to start earning from your game designs"
     ctaText="Create Product"
     ctaHref="/dashboard/products/new"
   />
   ```

**Technical Tasks:**
- [ ] Update sign-up redirect to `/dashboard`
- [ ] Update sign-in redirect to `/dashboard` (for creators) or `/products` (for customers)
- [ ] Update `FirstTimeUserOnboarding.tsx` copy and links
- [ ] Create `EmptyState.astro` component (reusable)
- [ ] Add empty states to all dashboard sections
- [ ] Update user menu to highlight Dashboard for first-time users

**Estimated Effort:** 1 day

---

### Phase 5: Search Implementation

**Goal:** Make search primary discovery method

**Search Component: `/src/components/SearchBar.tsx`**

```typescript
import { createSignal } from 'solid-js';

export default function SearchBar() {
  const [query, setQuery] = createSignal('');

  const handleSearch = (e: Event) => {
    e.preventDefault();
    const searchUrl = `/search?q=${encodeURIComponent(query())}`;
    window.location.href = searchUrl;
  };

  return (
    <form onSubmit={handleSearch} class="search-bar">
      <input
        type="search"
        placeholder="Search products, assets, creators..."
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
        class="search-bar__input"
      />
      <button type="submit" class="search-bar__button">
        <svg>...</svg>
      </button>
    </form>
  );
}
```

**Search Results Page: `/src/pages/search.astro`**

```astro
---
// Unified search across products, assets, jams, users
const query = Astro.url.searchParams.get('q') || '';
const products = await searchProducts(query);
const assets = await searchAssets(query);
const users = await searchUsers(query);
const jams = await searchJams(query);
---

<Layout title={`Search: ${query}`}>
  <PageHeader title={`Results for "${query}"`} />

  <section>
    <h2>Products ({products.length})</h2>
    {/* Product cards */}
  </section>

  <section>
    <h2>Assets ({assets.length})</h2>
    {/* Asset cards */}
  </section>

  <section>
    <h2>Creators ({users.length})</h2>
    {/* User cards */}
  </section>

  <section>
    <h2>Jams ({jams.length})</h2>
    {/* Jam cards */}
  </section>
</Layout>
```

**Technical Tasks:**
- [ ] Create `SearchBar.tsx` component
- [ ] Add to Navigation.astro (desktop)
- [ ] Create `/src/pages/search.astro` (unified results)
- [ ] Create search functions in data-access layer:
  - [ ] `searchProducts(query)`
  - [ ] `searchAssets(query)`
  - [ ] `searchUsers(query)` (handle search)
  - [ ] `searchJams(query)` (name)
- [ ] Add full-text search indexes to Supabase (if not exists)
- [ ] Style search results (cards, filters, pagination)

**Estimated Effort:** 2 days

---

### Phase 6: Testing & Rollout

**Goal:** Validate new navigation with users

**Tasks:**

1. **Manual Testing:**
   - [ ] Guest journey: Can find products without signing up?
   - [ ] New creator journey: Can find dashboard after signup?
   - [ ] Returning creator journey: Can access content management?
   - [ ] Customer journey: Can browse and purchase?
   - [ ] Mobile navigation: All links work on small screens?
   - [ ] Search: Returns relevant results?

2. **Analytics Setup:**
   ```typescript
   // Track navigation usage
   - Top nav clicks (Browse, Dashboard, Cart, User menu)
   - Search usage (query volume, click-through rate)
   - Dashboard section visits (which sections most used?)
   - Empty state CTA clicks (how many create first product?)
   ```

3. **A/B Testing (Optional - Post-Launch):**
   - Test "Browse" vs "Shop" vs "Discover" label
   - Test Dashboard prominence (top-level link vs hidden in menu)
   - Test search bar placement (header vs below hero)

4. **Beta User Feedback:**
   - [ ] Survey 10 creators: "Was it easy to find where to create products?"
   - [ ] Survey 10 customers: "Was it easy to find products to buy?"
   - [ ] Monitor support tickets: Are users confused about navigation?

**Estimated Effort:** 1 day testing, ongoing analytics review

---

### Total Migration Estimate

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| 1. URL Structure | 2-3 days | None |
| 2. Navigation Updates | 1 day | Phase 1 complete |
| 3. Dashboard Pages | 2 days | Phase 1 complete |
| 4. Onboarding Flow | 1 day | Phase 3 complete |
| 5. Search Implementation | 2 days | None (parallel) |
| 6. Testing & Rollout | 1 day | All phases complete |

**Total: 9-10 days** (can run some phases in parallel)

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 6

**Can Run in Parallel:**
- Phase 5 (Search) can start anytime
- Phase 6 (Testing) can start as soon as Phase 2 is done

---

## 9. Wireframe/Structure Diagram

### Desktop Navigation (Recommended)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header                                                                  │
│  ┌────┬─────────┬──────────────────────────┬──────────┬──────┬────────┐ │
│  │Logo│Browse ▼ │ [🔍 Search...          ]│Dashboard │ Cart │@user ▼ │ │
│  └────┴─────────┴──────────────────────────┴──────────┴──────┴────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
       │                                              │              │
       ▼                                              ▼              ▼
   Browse Menu                                  Dashboard      User Menu
   ┌──────────┐                                  Page         ┌────────────┐
   │Products  │                                  /dashboard   │Dashboard   │
   │Assets    │                                               │Purchases   │
   │Jams      │                                               │Payouts     │
   │Creators  │                                               │Settings    │
   └──────────┘                                               │────────────│
                                                              │Sign Out    │
                                                              └────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard Page (Tabbed Sections)                                       │
│  ┌────────────┬───────────────────────────────────────────────────────┐ │
│  │Overview    │ Your Content Stats                                    │ │
│  │Products    │ ┌──────────────────────────────────────────────────┐  │ │
│  │Assets      │ │Total Earnings: $1,234                            │  │ │
│  │Documents   │ │Products: 5 public, 2 draft                       │  │ │
│  │Jams        │ │Assets: 12 public, 1 private                      │  │ │
│  └────────────┘ └──────────────────────────────────────────────────┘  │ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile Navigation (Recommended)

```
┌──────────────────────────────────┐
│  Header                          │
│  ┌───┬────────────────┬───┬───┐  │
│  │ ☰ │  Game Loopers  │ 🛒│ 👤│  │
│  └───┴────────────────┴───┴───┘  │
└──────────────────────────────────┘
    │                       │    │
    ▼                       ▼    ▼
  Menu                    Cart  User
  ┌──────────────────┐
  │ Browse           │
  │  • Products      │
  │  • Assets        │
  │  • Jams          │
  │  • Creators      │
  │ ─────────────────│
  │ Dashboard        │
  │  • Overview      │
  │  • Products      │
  │  • Assets        │
  │  • Documents     │
  │ ─────────────────│
  │ My Account       │
  │  • Purchases     │
  │  • Payouts       │
  │  • Settings      │
  │ ─────────────────│
  │ About            │
  │ Terms            │
  │ Privacy          │
  └──────────────────┘
```

### Page Flow Diagram

```
Guest User Journey:
  Landing Page
       │
       ├─→ [Browse] → /products (marketplace)
       ├─→ [Search] → /search?q=... (unified search)
       └─→ [Sign Up] → /sign-up → [Onboarding] → /dashboard

Returning Creator Journey:
  Any Page
       │
       └─→ [Dashboard] → /dashboard
              │
              ├─→ [Products Tab] → /dashboard/products
              │        │
              │        └─→ [Create New] → /dashboard/products/new
              │
              ├─→ [Assets Tab] → /dashboard/assets
              │        │
              │        └─→ [Upload New] → /dashboard/assets/new
              │
              └─→ [Documents Tab] → /dashboard/documents

Customer Journey:
  Landing Page
       │
       ├─→ [Browse → Products] → /products (marketplace)
       ├─→ [Product Card] → /products/[handle] (detail page)
       ├─→ [Add to Cart] → /cart
       └─→ [Checkout] → /checkout → [Success] → /purchases
```

---

## 10. Similar Platforms Comparison

### Gumroad (Creator Marketplace)

**Navigation:**
```
For Creators:
  [Logo] [Discover] [Pricing] [Sign In] [Start Selling]

After Sign In:
  [Logo] [Dashboard] [Discover] [Analytics] [@username ▼]
```

**Insights:**
- **Dashboard is prominent** (top-level link for creators)
- **"Discover" remains visible** (creators are also buyers)
- **"Start Selling" CTA** (always visible, even after signup)
- **Simple structure** (3-4 top-level links, no dropdowns)

**What Game Loopers Can Learn:**
- Keep nav minimal (5-6 links max)
- Dashboard should be top-level for creators
- Maintain browse/discover even for authenticated creators

---

### Itch.io (Indie Game Marketplace)

**Navigation:**
```
For Everyone:
  [Logo] [Browse Games ▼] [Game Jams] [Community] [🔍 Search] [Log In] [Register]

After Log In:
  [Logo] [Browse Games ▼] [Game Jams] [Dashboard] [🔍 Search] [@username ▼]

Browse Games Dropdown:
  - By Genre (Action, Adventure, RPG, etc.)
  - By Platform (Windows, Mac, Linux, Android, etc.)
  - By Tags (Popular tags)
  - Top Sellers, New & Popular, etc.
```

**Insights:**
- **Genre categories in dropdown** (not top-level nav)
- **Dashboard added after login** (but not too prominent)
- **Search is always visible** (critical for discovery)
- **Game Jams at top level** (community feature, not hidden)

**What Game Loopers Can Learn:**
- Categories can live in dropdown (not primary nav)
- Jams should be visible (important community driver)
- Search bar should be persistent and prominent

---

### Kickstarter (Crowdfunding Platform)

**Navigation:**
```
For Everyone:
  [Logo] [Discover ▼] [Start a Project] [🔍 Search] [Log In]

Discover Dropdown:
  - Arts
  - Comics & Illustration
  - Design & Tech
  - Film
  - Food & Craft
  - Games (with subcategories)
  - Music
  - Publishing

After Log In (Backer):
  [Logo] [Discover ▼] [Backed Projects] [🔍 Search] [@username ▼]

After Log In (Creator):
  [Logo] [Discover ▼] [My Projects] [🔍 Search] [@username ▼]
```

**Insights:**
- **"Discover" is primary** (marketplace-first)
- **"Start a Project" is secondary** (less prominent, but always visible)
- **Categories in mega-menu** (organized, not cluttering nav)
- **User role determines nav** (Backer sees "Backed", Creator sees "My Projects")

**What Game Loopers Can Learn:**
- Optimize for discovery first (marketplace focus)
- Creator actions can be less prominent without hurting UX
- Differentiate nav based on user role (backer vs creator)
- Categories work when you have critical mass of content

---

### Etsy (Handmade Marketplace)

**Navigation:**
```
For Everyone:
  [Logo] [🔍 Search for anything] [Category ▼] [Cart] [Sign In]

Category Dropdown (Mega Menu with Images):
  - Jewelry & Accessories
  - Clothing & Shoes
  - Home & Living
  - Wedding & Party
  - Toys & Entertainment
  - Art & Collectibles
  - Craft Supplies
  (Each with subcategories and image previews)

After Log In (Buyer):
  [Logo] [🔍 Search] [Category ▼] [Cart] [@username ▼]

@username Dropdown (Buyer):
  - Purchases
  - Messages
  - Favorites
  - Account Settings

After Log In (Seller):
  [Logo] [🔍 Search] [Category ▼] [Shop Manager] [Cart] [@username ▼]

Shop Manager (Seller Dashboard):
  - Listings (manage products)
  - Orders (fulfill purchases)
  - Marketing (promotions, ads)
  - Finances (earnings, payouts)
  - Stats (analytics)
```

**Insights:**
- **Search is HUGE** (takes up most of header)
- **Categories are visual** (mega-menu with images)
- **Seller tools are separate** ("Shop Manager" = creator dashboard)
- **Cart is always visible** (no matter if buyer or seller)

**What Game Loopers Can Learn:**
- Search should be prominent (primary discovery tool)
- Categories need visual hierarchy (can't just be text links)
- Sellers access dashboard separately (doesn't interfere with shopping)
- Both sellers and buyers can shop (don't hide browse links)

---

### GitHub (Developer Platform)

**Navigation:**
```
For Authenticated Users:
  [Logo] [Pull Requests] [Issues] [Codespaces] [Marketplace] [Explore] [🔍 Search] [@username ▼]

@username Dropdown:
  - Your Profile
  - Your Repositories
  - Your Projects
  - Your Stars
  - Your Gists
  - Your Sponsors
  ─────────────
  - Settings
  - Sign Out
```

**Insights:**
- **No explicit "Create" button** (creation happens within sections)
- **Your content in user menu** (not primary nav)
- **Marketplace is separate** (browse others' tools)
- **Search is global** (repos, issues, code, people)

**What Game Loopers Can Learn:**
- User menu can house "Your [Content]" links
- Creation doesn't need to be in main nav
- Separation of "Explore" vs "Your Stuff" is clear

---

### Comparison Matrix

| Platform | Nav Focus | Creator Access | Category Nav | Search Prominence | User Role Awareness |
|----------|-----------|----------------|--------------|-------------------|-------------------|
| **Gumroad** | Creator-first | Dashboard (top-level) | None (tags only) | Secondary | Yes (creator vs buyer) |
| **Itch.io** | Discovery-first | Dashboard (top-level) | Dropdown (genres) | Primary | Minimal |
| **Kickstarter** | Discovery-first | Secondary link | Mega-menu | Primary | Yes (backer vs creator) |
| **Etsy** | Discovery-first | Separate app | Mega-menu (visual) | PRIMARY | Yes (buyer vs seller) |
| **GitHub** | User-first | User menu | None | Primary | Minimal |

---

### Recommendation for Game Loopers

Based on platform analysis and MVP goals:

**Follow Kickstarter's Pattern:**
- Discovery-first (marketplace is primary)
- Creator tools accessible but not dominant
- Categories when catalog grows (Month 4+)
- Search is prominent (always visible)
- User role influences nav (show Dashboard to creators, hide from buyers)

**Key Differentiators:**
- Kickstarter: Projects have time limits (urgency) → Game Loopers: Always-on marketplace
- Etsy: Visual categories (physical goods) → Game Loopers: Tag-based (digital goods)
- Gumroad: Simple/minimal → Game Loopers: Community features (jams, follows)

**Best Practices to Adopt:**
1. **Etsy:** Massive search bar (primary discovery)
2. **Kickstarter:** "Start a Project" always visible but secondary
3. **Gumroad:** Dashboard as top-level for creators (fast access)
4. **Itch.io:** Game Jams at top level (community driver)
5. **GitHub:** User menu houses "Your Content" (clean separation)

---

## 11. Next Steps

### Immediate Actions (This Week)

1. **Decision Required:** Which approach to implement?
   - **Option A:** Full dashboard-centric migration (Recommended, 9-10 days)
   - **Option B:** Quick fix (rename "Discover" to "Browse", remove "Create", 1 day)
   - **Option C:** Defer navigation changes, focus on MVP launch features

2. **If Option A (Full Migration):**
   - [ ] Review this analysis with team
   - [ ] Approve URL structure and page hierarchy
   - [ ] Create implementation task list in project board
   - [ ] Assign tasks to developers
   - [ ] Set deadline (before or after beta launch?)

3. **If Option B (Quick Fix):**
   - [ ] Update Navigation.astro:
     - Remove `createLinks` and "Create" dropdown
     - Rename `discoverLinks` to `browseLinks`
     - Update label: "Discover" → "Browse"
   - [ ] Test navigation on desktop and mobile
   - [ ] Deploy to production

4. **If Option C (Defer):**
   - [ ] Document navigation as "known issue" in beta feedback
   - [ ] Focus on payment processing and asset downloads (ROADMAP.md Priority 0)
   - [ ] Revisit navigation post-launch (Month 2)

### Post-Launch Improvements (Month 2+)

Once MVP launches and you have user data:

1. **Analytics Review:**
   - Which nav links are clicked most? (validate assumptions)
   - Do users find dashboard? (if <30% of creators visit dashboard, it's hidden)
   - Do guests convert to signup? (if browse → signup rate is low, improve CTAs)

2. **User Interviews:**
   - Survey 10 creators: "How did you learn to create your first product?"
   - Survey 10 customers: "Was it easy to find products to buy?"

3. **A/B Tests:**
   - Test "Browse" vs "Shop" vs "Discover" (which converts better?)
   - Test Dashboard prominence (top-level vs user menu)
   - Test search bar placement (header vs below)

4. **Category Implementation:**
   - Once 100+ products exist, add category navigation
   - Use tag data to determine which categories (most popular tags)
   - Implement mega-menu with images (like Etsy)

---

## 12. Conclusion

**Summary:**

The current navigation has a critical UX flaw: duplicate links between "Create" and "Discover" dropdowns create confusion about page purpose. This stems from trying to serve two user journeys (creator and consumer) through a single navigation structure.

**Core Recommendation:**

Implement **Kickstarter-style navigation** optimized for marketplace discovery, with creator tools accessed through a dedicated Dashboard. This aligns with:
- MVP goals (need customers first)
- User personas (75% of users are browsing/buying)
- Industry best practices (Etsy, Gumroad, Kickstarter separate browse and create)

**Estimated Implementation:**
- Quick fix (rename labels, remove duplicate dropdown): 1 day
- Full migration (dashboard-centric pages): 9-10 days

**Decision Point:**

Given ROADMAP.md shows **1 week until beta launch**, recommend:
1. **This week:** Implement **Option B (Quick Fix)** to remove confusion
2. **Post-launch:** Implement **Option A (Full Migration)** in Month 2 after validating with real users

**Files to Update (Quick Fix):**
- `/src/components/Navigation.astro` (lines 39-82, 96-101)
- `/src/components/interactive/NavigationMobile.tsx` (lines 62-75)

**Files to Create (Full Migration):**
- `/src/pages/dashboard/products/index.astro`
- `/src/pages/dashboard/assets/index.astro`
- `/src/layouts/DashboardLayout.astro`
- `/src/components/SearchBar.tsx`

---

**Questions for User:**
1. Do you want quick fix (1 day) or full migration (9-10 days)?
2. Should navigation changes happen before or after beta launch?
3. Are there specific concerns about creator discoverability?
4. Should search be implemented now or deferred to Phase 2?

