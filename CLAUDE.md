# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game Loopers is a social commerce platform for tabletop game creators (designers, 3D modelers, illustrators) to collaborate, publish digital downloads, manage licensing, and distribute royalties. Think of it as a marketplace where contributors can assemble game products, attach assets with royalty splits, and customers purchase complete game packages.

**Key Documentation:**
- `/ROADMAP.md` - Product roadmap, phasing strategy, and success metrics
- `/PERSONAS.md` - Detailed user personas (current + future)
- `/DESIGN_SYSTEM.md` - UI/UX patterns and BEM conventions
- `/CLAUDE.md` - This file (development guidelines)

**Current Status:** ~60% complete toward MVP launch (see ROADMAP.md for details)

## Development Commands

```bash
npm run dev       # Start dev server (localhost:4321)
npm run build     # Production build
npm run preview   # Preview production build locally
```

## Tech Stack

- **Framework**: Astro 5.15.1 (server mode with Vercel adapter)
- **Interactivity**: SolidJS islands with Signals
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Hosting**: Vercel
- **Styling**: BEM CSS (Block Element Modifier) - NO Tailwind
- **Validation**: Zod
- **Type Safety**: TypeScript (strict mode)

## Critical Architecture Rules

### 🚨 SDK Isolation Layer Pattern

**ALL third-party service SDKs MUST be isolated in dedicated abstraction layers.** This is the most important architectural rule. Direct imports of SDKs outside these layers are strictly prohibited.

**Auth Layer** (`/src/lib/auth/`)
- `client.ts` - Supabase auth client configuration
- `index.ts` - Exported functions: `signInWithPassword()`, `signInWithOAuth()`, `signUp()`, `exchangeCodeForSession()`, `setSession()`, `getSession()`, `getUser()`, `signOut()`
- Used by: API routes, Astro pages (server-side)
- ❌ Never import `@supabase/supabase-js` outside this directory

**Data Access Layer** (`/src/lib/data-access/`)
- `client.ts` - Supabase database client
- Future: `users.ts`, `products.ts`, `assets.ts` with CRUD functions
- Export service functions like `getUserById()`, `createProduct()`, `updateAsset()`
- ❌ Never import `@supabase/supabase-js` outside this directory

**Storage Layer** (`/src/lib/storage/`)
- `client.ts` - Supabase storage client
- Future: `uploads.ts` with functions like `uploadAssetFile()`, `getDownloadUrl()`
- ❌ Never import `@supabase/supabase-js` outside this directory

**Payments Layer** (`/src/lib/payments/`) - Not yet created
- Future Stripe SDK isolation
- Export functions like `createCharge()`, `processRefund()`
- ❌ Never import Stripe SDK outside this directory

### Why SDK Isolation?

This enables switching providers without refactoring the entire app. If we migrate from Supabase to Firebase, only the layer files change—all consuming code remains unchanged.

## Environment Variables

Required environment variables (must have `PUBLIC_` prefix for client access in Astro):

```env
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

TypeScript definitions in `src/env.d.ts` must match.

## TypeScript Types

All data model types are defined in `/src/types/`:

```
src/types/
├── common.types.ts      # BaseEntity, BaseEntityWithoutDelete
├── users.types.ts       # User, UserTag, UserReview, UserFollows
├── documents.types.ts   # Document, DocumentBlock, DocumentCollaborator
├── assets.types.ts      # Asset, AssetFile, AssetRoyalty, AssetLicense
├── products.types.ts    # Product, ProductVariant, ProductVariantPrice
├── commerce.types.ts    # Cart, Sale, SaleItem, Wishlist
├── jams.types.ts        # Jam, JamPrize, JamProduct
├── system.types.ts      # Notification, ActivityFeed, Session
└── index.ts             # Barrel exports
```

Import types: `import type { User, Product } from '@/types'`

**Never use `any` types.** All functions and components must be fully typed.

## BEM CSS Pattern

Components use BEM (Block Element Modifier) naming convention. Reference examples in `/src/components/`:

```astro
<!-- Button.astro example -->
<button class="button button--primary button--md">
  <span class="button__icon">...</span>
  <span class="button__text">Click</span>
</button>

<style>
.button { /* Block */ }
.button__icon { /* Element */ }
.button__text { /* Element */ }
.button--primary { /* Modifier */ }
.button--secondary { /* Modifier */ }
.button--md { /* Modifier */ }
</style>
```

- Block: `.button`, `.card`, `.breadcrumb`
- Element: `.button__icon`, `.card__header`, `.breadcrumb__item`
- Modifier: `.button--primary`, `.card--elevated`, `.breadcrumb--compact`

Use CSS custom properties for theming: `var(--color-primary, #0070f3)`

## Routing & Pages

Astro file-based routing in `/src/pages/`:

**Public Routes:**
- `/` - Landing page
- `/feed` - Global activity feed
- `/users` - User directory
- `/users/[handle]` - User profile (owner sees edit view, others see public)
- `/products` - Product marketplace
- `/products/[handle]` - Product detail
- `/assets/[handle]` - Asset detail
- `/documents/[handle]` - Document editor (private, collaborators only)
- `/jams` - Game jam directory
- `/jams/[handle]` - Jam detail
- `/tags/[tag]` - Products by tag
- `/cart` - Shopping cart

**Auth Routes:**
- `/sign-in` - Login page
- `/sign-up` - Registration page
- `/dashboard` - User dashboard (protected)

**API Routes** (`/src/pages/api/`):
- `/api/auth/sign-in` - POST for email/password and OAuth
- `/api/auth/sign-up` - POST for registration
- `/api/auth/callback` - GET for OAuth callback
- `/api/auth/sign-out` - Sign out

## Data Model Overview

**Core Entities:**
- **Users**: Creators and customers with handles, bios, Stripe IDs for payouts
- **Products**: Sellable items with variants, prices, price breaks
- **Assets**: Digital downloads (3D models, PDFs, images) with royalty splits
- **Documents**: Private collaborative docs (Notion-like blocks) that publish as PDF assets
- **Jams**: Game jams with products, prizes, reviews
- **Cart/Sales**: E-commerce with line items, asset downloads, royalty transactions

**Key Relationships:**
- Products have ProductVariants (SKUs with options/pricing)
- ProductAssets link variants to downloadable Assets
- AssetRoyalties define splits (fixed $ or %) paid to contributors
- SaleRoyaltyTransactions track payments to contributors per sale

**Soft Deletes:**
Most entities have `deleted` boolean and `deleted_at` timestamp. Never hard-delete records.

## SolidJS Island Pattern

Interactive components go in `/src/components/islands/` (not yet created). Use Signals for reactive state:

```tsx
// Example: SignInForm.tsx
import { createSignal } from 'solid-js';

export default function SignInForm() {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      body: new FormData(e.target as HTMLFormElement)
    });
    // handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
      />
      {/* ... */}
    </form>
  );
}
```

**Form State:**
- Simple forms (login, signup): SolidJS Signals only
- Complex forms (asset upload, checkout): Signals + Zod validation
- Keep state local to islands (use Nanostores only if cross-island state needed)

## Code Quality Rules

1. **No unused imports, variables, or functions** - Clean up on every commit
2. **No `any` types** - Always provide explicit types
3. **DRY components** - Extract shared logic into utilities
4. **TypeScript strict mode** - No implicit any, strict null checks
5. **BEM CSS only** - No utility-first CSS, no inline styles (except for dynamic values)

## User Personas

**See `/PERSONAS.md` for comprehensive persona documentation.**

**Current Personas (MVP - Digital Marketplace):**
- **Game Designers:** Create products, hire collaborators, earn from sales
- **Illustrators:** Sell art assets, license work, earn royalties when used in products
- **3D Modelers:** Sell STL files, license models, earn royalties when used in products
- **Consumers:** Purchase complete game packages, download assets, support creators

**Future Personas (Phase 3 - Physical Services):**
- **Printers:** Provide 3D printing services to turn STL files into physical miniatures (DEFERRED until Month 7+)
- **Painters:** Provide miniature painting services for printed models (DEFERRED until Month 7+)

**Note:** Physical service personas are documented but implementation is deferred until after digital marketplace achieves product-market fit. See `/ROADMAP.md` for phasing strategy.

## Session Management

Auth uses Supabase PKCE flow with cookies:
- `sb-access-token` - JWT access token (cookie)
- `sb-refresh-token` - Refresh token (cookie)
- Protected pages check cookies via `setSession()` from `/src/lib/auth`

See `/src/pages/dashboard.astro` for reference implementation.

## Migration Notes

This codebase recently migrated from another framework to Astro. The migration included:
- Converting to Astro server mode (Vercel adapter)
- Establishing SDK isolation layers
- Creating comprehensive TypeScript types
- Documenting BEM CSS pattern

Reference component examples in `/src/components/` for BEM patterns before creating new components.
