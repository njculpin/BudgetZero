# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Game Loopers is a social commerce platform for tabletop game creators (designers, 3D modelers, illustrators) to collaborate, publish digital downloads, manage licensing, and distribute royalties. Think of it as a marketplace where contributors can assemble game products with embedded components, manage royalty splits, and customers purchase complete game packages.

**Key Documentation:**

- `/PLAN.md` - Outstanding work to reach launch. Tracks only what is _not_ done;
  completed items are deleted rather than checked off.
- `/.claude/skills/persona-journey/PERSONAS.md` - Detailed user personas (current + future)
- `/.claude/skills/audit-style/DESIGN_SYSTEM.md` - UI/UX patterns and BEM conventions
- `/CLAUDE.md` - This file (development guidelines)

**Current Status:** Feature-complete in surface area. The purchase → download →
royalty → payout path has been repaired but is **not yet verified against a live
database**, and the legal documents are still stubs. See `/PLAN.md` before
assuming anything is launch-ready.

## Development Commands

```bash
npm run dev            # Start dev server (localhost:4321)
npm run build          # Production build
npm run preview        # Preview production build locally

npm run supabase:start # Local Supabase (requires Docker)
npm run supabase:reset # Reapply all migrations from scratch

npm run check          # Typechecks every package. Must report 0 errors.
npm run check:boundaries # Enforces web -> api -> core
npm run lint           # ESLint. Must report 0 errors.
npm run format         # Prettier, write. `format:check` in CI.
npm run test:run       # Unit + integration tests (integration needs Supabase up)
npm run test:e2e       # Playwright
```

CI runs `npm ci`, then boundaries, formatting, lint, typecheck, tests and build on every push
and pull request (`.github/workflows/ci.yml`). Vercel auto-deploys `main`.

## Tech Stack

- **Framework**: Astro 7 (server mode with Vercel adapter)
- **Interactivity**: SolidJS islands with Signals
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Hosting**: Vercel
- **Styling**: BEM CSS (Block Element Modifier) - NO Tailwind
- **Validation**: Zod
- **Type Safety**: TypeScript (strict mode)
- **Testing**: Vitest (unit + integration), Playwright (e2e)
- **Runtime**: Node 22 (matches the Vercel serverless runtime; see `.nvmrc`)

## Workspace Layout

This is an npm workspace. Dependencies point one way — `web -> api -> core` — and
CI enforces it with `npm run check:boundaries`.

```
packages/
  core/   Domain logic, SDK isolation layers, types, shared test fixtures.
          Depends on nothing else in the workspace.
  api/    HTTP controllers. Depends on core. Contains no Astro.
  web/    The Astro application: pages, components, styles, and thin route
          adapters. Depends on api and core.
```

Import with `@gameloopers/core/<layer>` and `@gameloopers/api/<module>`. The `@/`
alias means `packages/web/src` and is only valid inside `web`.

### Controllers, not route handlers

An API route in `web` is an adapter and nothing else:

```ts
import { toAstroRoute } from '@/lib/to-astro-route';
import { addToCartController } from '@gameloopers/api/controllers/cart/add-to-cart';

export const POST = toAstroRoute(addToCartController);
```

The logic lives in `packages/api/src/controllers/`, written against a
`RequestContext` of Web platform types — `Request`, `Response`, a small
`CookieJar`. No controller imports Astro, which is what the boundary check
enforces and what makes them mountable under another runtime by writing one more
adapter rather than editing 68 files.

**Identity is resolved once, by the gateway, before any controller runs.**
`ctx.userId` is already settled; a controller never exchanges cookies for a
session. It previously happened twice per request — once in middleware, whose
result nothing read, and again in each route.

Authentication behaviour belongs to `resolveAuth` in
`packages/api/src/gateway.ts` and is tested once in `gateway.test.ts`, not
re-asserted in every controller's tests.

### Tokens are verified locally

`packages/core/src/auth/verify-token.ts` checks an access token's signature with
no network call, supporting both a shared HS256 secret (local development, older
projects) and a published JWKS (new hosted projects). The auth provider is
contacted only to renew an expired session — about once an hour per session
rather than twice per request.

`SUPABASE_JWT_SECRET` must be set wherever the provider signs with a shared
secret. A missing key reports `unconfigured` rather than "signed out", so a
deployment fault does not masquerade as an auth bug.

### Known constraint

`core` still reads configuration through `import.meta.env` in several files,
which ties it to a Vite consumer. New code uses `readEnv()` from
`@gameloopers/core/env`, which falls back to `process.env`; the remaining direct
uses need migrating before a non-Vite `packages/workers` can import core.

## Critical Architecture Rules

### 🚨 SDK Isolation Layer Pattern

**ALL third-party service SDKs MUST be isolated in dedicated abstraction layers.** This is the most important architectural rule. Direct imports of SDKs outside these layers are strictly prohibited.

**Auth Layer** (`packages/core/src/auth/`)

- `client.ts` - Supabase auth client configuration
- `index.ts` - Exported functions: `signInWithPassword()`, `signInWithOAuth()`, `signUp()`, `exchangeCodeForSession()`, `setSession()`, `getSession()`, `getUser()`, `signOut()`
- Used by: API routes, Astro pages (server-side)
- ❌ Never import `@supabase/supabase-js` outside this directory

**Data Access Layer** (`packages/core/src/data-access/`)

- `client.ts` - Supabase database client
- Includes: `users.ts`, `products.ts`, `documents.ts`, `royalties.ts` with CRUD functions
- Export service functions like `getUserById()`, `createProduct()`, `updateDocument()`
- ❌ Never import `@supabase/supabase-js` outside this directory

**Storage Layer** (`packages/core/src/storage/`)

- `client.ts` - Supabase storage client
- `uploads.ts` - Generic upload functions for product files and images
- `products.ts` - Product-specific storage functions
- ❌ Never import `@supabase/supabase-js` outside this directory

**Payments Layer** (`packages/core/src/payments/`)

- `client.ts` - Stripe client. `mock-mode.ts` - the single `USE_MOCK_STRIPE` flag
- `checkout.ts`, `connect.ts` - checkout sessions, Connect accounts, transfers
- ❌ Never import the Stripe SDK outside this directory

**Email Layer** (`packages/core/src/email/`)

- `client.ts` - Resend client. `index.ts` - `sendEmail()`
- ❌ Never import the Resend SDK outside this directory

**Monitoring Layer** (`packages/core/src/monitoring/`)

- `client.ts` - provider config. `index.ts` - `captureError()`, `captureMessage()`
- Sentry loads lazily and only when `PUBLIC_SENTRY_DSN` is set
- ❌ Never import a monitoring SDK outside this directory

**Rate Limiting** (`packages/core/src/rate-limit/`)

- Postgres-backed fixed-window counters; Vercel invocations share no memory
- `checkRateLimit()`, `rateLimitIdentity()`, `rateLimitedResponse()`

### Why SDK Isolation?

This enables switching providers without refactoring the entire app. If we migrate from Supabase to Firebase, only the layer files change—all consuming code remains unchanged.

## Environment Variables

Required environment variables (must have `PUBLIC_` prefix for client access in Astro):

See `.env.example` for the full list. The essentials:

```env
PUBLIC_SUPABASE_URL=          # Supabase project URL
PUBLIC_SUPABASE_ANON_KEY=     # Anon key (client-safe, RLS enforced)
SUPABASE_SERVICE_ROLE_KEY=    # Server-only. Bypasses RLS - never expose
PUBLIC_SITE_URL=              # Public origin; used for links in outbound email
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
PUBLIC_SENTRY_DSN=            # Optional; falls back to console logging
MOCK_STRIPE=                  # 'true' for local/test ONLY - see below
```

TypeScript definitions in `src/env.d.ts` must match.

⚠️ **`MOCK_STRIPE=true` bypasses Stripe webhook signature verification**, which
turns `/api/webhooks/stripe` into an unauthenticated way to mint sales and royalty
obligations. It is an explicit opt-in and hard-fails at boot in a production
build. Never set it in a deployed environment.

## TypeScript Types

All data model types live in `packages/core/src/types/` and are imported as
`@gameloopers/core/types`:

```
packages/core/src/types/
├── common.types.ts      # BaseEntity, BaseEntityWithoutDelete
├── users.types.ts       # User, UserTag, UserReview, UserFollows
├── documents.types.ts   # Document, DocumentBlock, DocumentCollaborator
├── products.types.ts    # Product, ProductFile, ProductComponent, ProductRoyalty
├── commerce.types.ts    # Cart, Sale, SaleItem, Wishlist
├── system.types.ts      # Notification, ActivityFeed, Session
└── index.ts             # Barrel exports
```

Import types: `import type { User, Product } from '@gameloopers/core/types'`

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
  .button {
    /* Block */
  }
  .button__icon {
    /* Element */
  }
  .button__text {
    /* Element */
  }
  .button--primary {
    /* Modifier */
  }
  .button--secondary {
    /* Modifier */
  }
  .button--md {
    /* Modifier */
  }
</style>
```

- Block: `.button`, `.card`, `.breadcrumb`
- Element: `.button__icon`, `.card__header`, `.breadcrumb__item`
- Modifier: `.button--primary`, `.card--elevated`, `.breadcrumb--compact`

Use CSS custom properties for theming: `var(--color-primary, #0070f3)`

## Component Organization

Components are organized to **mirror the pages directory structure**, making it immediately clear where each component is used. Generic/shared components that are used across multiple pages live in the root of `components/`.

**Structure:**

Every component gets its own folder, named in kebab-case, and every file inside
is prefixed with that folder name. There are no exceptions — a pattern with
exceptions is not a pattern, and this one exists so that both people and tooling
can locate a component's files without searching.

```
<component-name>/
  <component-name>.astro | .tsx    the component
  <component-name>.css             its styles, if it has any
  <component-name>.test.tsx        its tests, if it has any
```

So an editor tab reads `add-to-cart-button.css`, not a `.css` that could be any
of thirty-eight. Folders group by page, mirroring `pages/`:

```
packages/web/src/components/
├── button/button.astro              # generic UI, one folder each
├── badge/, breadcrumb/, card/, empty-state/, footer/,
│   gallery-grid/, modal/, navigation/, page-header/,
│   pagination/, tag/
├── base/                            # generic base form components (Astro)
├── interactive/                     # generic interactive components (SolidJS)
├── products/                        # /products/*.astro
│   ├── add-to-cart-button/
│   │   ├── add-to-cart-button.tsx
│   │   └── add-to-cart-button.css
│   └── product-content-manager/     # a component with sub-components nests
│       ├── product-content-manager.tsx
│       └── content-list/content-list.tsx
├── documents/, users/, cart/, checkout/, admin/,
│   settings/, home/, auth/, notifications/, purchases/
```

The exported identifier stays PascalCase (`export default function AddToCartButton`);
only filenames are kebab-case.

**Import Examples:**

```tsx
// Generic components (root)
import Button from '@/components/Button.astro';
import { FormField, Input } from '@/components/base';
import { LoadingButton, TagInput } from '@/components/interactive';

// Page-specific components
import { ProductEditForm, ProductContentViewer } from '@/components/products';
import { NotificationCenter } from '@/components/notifications';
```

**Key Principles:**

- **Mirror pages/** - Component directories match page routes
- **Generic components in root** - Button, Card, Breadcrumb, etc. used everywhere
- **Co-located CSS** - CSS files next to component files
- **Barrel exports** - index.ts in each directory for clean imports

## Routing & Pages

Astro file-based routing in `/src/pages/`:

Note the dynamic segments are `[user]` / `[product]` / `[document]` / `[tag]`,
not `[handle]`.

**Public:**

- `/` - Landing page
- `/about`, `/privacy`, `/terms`, `/licenses/standard` - static pages
- `/users`, `/users/[user]` - directory and profile (owner sees the edit view)
- `/products`, `/products/[product]` - marketplace and product detail
- `/tags`, `/tags/[tag]` - tag directory and products by tag
- `/sign-in`, `/sign-up`

**Authenticated:**

- `/cart`, `/checkout/success`, `/checkout/failed`
- `/create` - product creation
- `/products/[product]/edit`
- `/documents`, `/documents/[document]` - collaborative editor, collaborators only
- `/purchases`, `/purchases/[purchase]` - order history and downloads
- `/payouts` - creator earnings and payout requests
- `/notifications`, `/settings`

**Admin** (`users.role = 'admin'`):

- `/admin/payouts` - payout queue; executes Stripe transfers

There is no `/dashboard` or `/feed` route.

**API Routes** (`/src/pages/api/`)

`src/middleware.ts` protects `/api` by default — a new route is authenticated
unless it is explicitly added to `PUBLIC_API_ROUTES`. Routes still perform their
own ownership checks; the middleware only establishes that someone is signed in.

## Data Model Overview

**Core Entities:**

- **Users**: Creators and customers with handles, bios, Stripe IDs for payouts
- **Products**: Sellable items with files, documents, and embeddable components (product-in-product)
- **Documents**: Private collaborative docs (Notion-like blocks) that can be attached to products
- **Cart/Sales**: E-commerce with line items, file downloads, royalty transactions

**Key Relationships:**

- Products have ProductFiles (downloadable content with individual pricing)
- Products have ProductDocuments (attached documents with individual pricing)
- ProductComponents link parent products to child products (product-in-product embedding pattern)
- ProductRoyalties are calculated from embedded components (child product owners earn royalties)
- SaleRoyaltyTransactions track payments to contributors per sale

**Architectural Changes (December 2024):**

- **Removed:** Variant abstraction (SKUs/options) - added complexity without clear value
- **Removed:** Asset abstraction - migrated to product-centric model
- **Simplified:** Products are now the atomic unit; variants were over-engineering for MVP

**Soft Deletes:**
Most entities have `deleted` boolean and `deleted_at` timestamp. Never hard-delete records.

## SolidJS Island Pattern

Interactive components are organized by domain (e.g., `/src/components/products/`, `/src/components/documents/`) or in `/src/components/interactive/` for generic reusable components. Use Signals for reactive state:

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
      body: new FormData(e.target as HTMLFormElement),
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
- Complex forms (product file upload, checkout): Signals + Zod validation
- Keep state local to islands (use Nanostores only if cross-island state needed)

## Code Quality Rules

1. **No unused imports, variables, or functions** - Clean up on every commit
2. **No `any` types** - Always provide explicit types
3. **DRY components** - Extract shared logic into utilities
4. **TypeScript strict mode** - No implicit any, strict null checks
5. **BEM CSS only** - No utility-first CSS, no inline styles (except for dynamic values)

## User Personas

**See `/.claude/skills/persona-journey/PERSONAS.md` for comprehensive persona documentation.**

**Current Personas (MVP - Digital Marketplace):**

- **Game Designers:** Create products, hire collaborators, earn from sales
- **Illustrators:** Sell art products, license work, earn royalties when embedded in other products
- **3D Modelers:** Sell STL file products, license models, earn royalties when embedded in other products
- **Consumers:** Purchase complete game packages, download digital files, support creators

**Future Personas (Phase 3 - Physical Services):**

- **Printers:** Provide 3D printing services to turn STL files into physical miniatures (DEFERRED until Month 7+)
- **Painters:** Provide miniature painting services for printed models (DEFERRED until Month 7+)

**Note:** Physical service personas are documented but implementation is deferred until after digital marketplace achieves product-market fit.

## Session Management

Auth uses Supabase PKCE flow with cookies:

- `sb-access-token` - JWT access token (cookie)
- `sb-refresh-token` - Refresh token (cookie)
- Protected pages check cookies via `setSession()` from `@gameloopers/core/auth`

**API controllers receive `ctx.userId` already resolved** — do not exchange
cookies for a session inside a controller. Every hand-rolled copy was a chance to
get it wrong: the notifications routes called `getSession(accessToken,
refreshToken)`, but `getSession` takes no arguments, so every one of those
endpoints answered 401 to every caller until it was fixed.

```ts
export const myController: Controller = async ({ userId }) => {
  if (!userId) return unauthorized();
  // ...
};
```

Inside an `.astro` page, use `resolvePageAuth(Astro.cookies)` from
`@/lib/page-auth`, which goes through the same gateway.

For admin-only routes use `verifyAdmin(userId)` from
`@gameloopers/core/auth/admin`, and record the action with `logAdminAction()`.

See `/src/pages/api/notifications/index.ts` (API) or `/src/pages/payouts/index.astro`
(page) for reference implementations.

## Recent Architectural Changes

### December 2024 Simplification

- **Asset Removal**: Migrated from asset-centric to product-centric model. Products are now the atomic sellable unit.
- **Variant Removal**: Eliminated SKU/variant abstraction. Products have files and documents directly.
- **Hero Section Removal**: Replaced large hero sections with compact page headers (~250px vertical space saved per page)

### Platform Fees (December 2024)

- **10% Platform Fee**: Implemented across all sales
- **Revenue Preview**: Added creator-facing calculator showing exact revenue splits before publishing
- **Royalty Transparency**: Built components to show who gets paid and how much

### Earlier Migrations

This codebase migrated from another framework to Astro in 2024. The migration included:

- Converting to Astro server mode (Vercel adapter)
- Establishing SDK isolation layers
- Creating comprehensive TypeScript types
- Documenting BEM CSS pattern

### September 2026 — money path repair and Astro 7

The December consolidation dropped the `sale_item_assets` table and the asset
storage buckets, but the webhook, royalties layer and download route were never
migrated with it. A real purchase created a sale and then bailed out before
creating any royalties, and downloads pointed at a bucket no migration creates.
Fixing that meant:

- **Entitlement is derived, not stored.** Download access comes from `sale_items`
  plus `product_components` (`getPurchasedProductIds`), so buying a bundle grants
  access to the components embedded within it. There is no join table.
- **Webhooks are idempotent.** `stripe_webhook_events.stripe_event_id` carries a
  UNIQUE constraint, and the insert _is_ the claim. Stripe retries on any non-2xx,
  so without this a retry duplicated the sale and its royalties.
- **Payouts reserve before paying.** `request_payout()` selects whole royalty
  transactions and marks them `reserved` in one atomic function; `settle_payout()`
  and `release_payout()` finish or undo it. Royalties previously stayed
  `ready_to_pay` forever, so the same earnings could be withdrawn repeatedly.
- **Credits checkout was cut from v1.** Credits could only be earned, never
  bought, and carried a second divergent implementation of the revenue split. The
  `users.credits_balance` column remains for a possible future.

Anything touching money should stay atomic in SQL. Read-modify-write from JS is
how most of the above went wrong in the first place.

Reference component examples in `/src/components/` for BEM patterns before creating new components.

## GIT

**IMPORTANT** NEVER EVER COMMIT YOURSELF - JUST PROVIDE A SHORT CONCISE COMMIT MESSAGE IN TERMINAL
**IMPORTANT** NEVER ADD CLAUDE AS A CO-AUTHOR
