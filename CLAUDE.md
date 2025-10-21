# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GameLoopers is a marketplace platform for digital assets built with Next.js 15, Supabase, Stripe, and TypeScript. The platform enables creators to:

- Upload and manage digital assets (3D models, PDFs, images, etc.)
- Bundle assets into products with variants
- Sell products through Stripe checkout
- Automatically distribute royalties to asset contributors
- Collaborate through teams with member management

## Development Commands

### Local Development

- `npm run dev` - Start Next.js dev server with Supabase (kills port 3000, starts Supabase, then runs Next.js on port 3000 with Turbopack)
- `npm run dev:simple` - Start Next.js without Supabase (kills port 3000, runs Next.js only)
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server

### Code Quality

- `npm run lint` - Run Biome linter (check only)
- `npm run format` - Format code with Biome (write mode)

### Supabase

- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:reset` - Reset local database (drops all data and re-runs migrations)
- `npm run supabase:status` - Check Supabase service status

### Testing

- `vitest` - Run tests (configured with vitest.config.ts)
- Test files are in `__tests__/` directory and follow pattern `*.test.ts`
- Vitest setup file: `vitest.setup.ts`

### Stripe Webhooks (Local Development)

Use Stripe CLI to forward webhook events to local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router (React 19, Turbopack)
- **Database**: PostgreSQL via Supabase with Row-Level Security (RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (Checkout, Connected Accounts for payouts)
- **Storage**: Supabase Storage (public bucket for assets)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Rich Text**: Tiptap editor
- **Type Safety**: TypeScript (strict mode), generated database types

### Database Architecture

The schema (`supabase/migrations/20250101000000_initial_workshop_schema.sql`) follows a marketplace model:

**Core Entities:**

- `users` - User profiles extending Supabase auth.users
- `teams` - Collaborative groups for product creation
- `assets` - Uploadable digital files (PDFs, 3D models, images, etc.)
- `products` - Marketplace offerings that bundle assets
- `product_variants` - Different versions of products (different asset bundles, pricing)
- `sales` - Purchase transactions
- `licenses` - Asset usage rights templates

**Key Relationships:**

- Assets belong to users and can have multiple royalty recipients
- Products contain multiple variants, each variant includes multiple assets
- Sales create royalty transactions that split revenue among asset contributors
- Teams manage permissions for collaborative product creation

**Important Patterns:**

- Soft deletes via `is_deleted` and `deleted_at` columns
- Namespaced tags on assets (e.g., `category:miniatures`, `game-system:dnd`)
- Royalty distribution: assets define percentage splits, calculated during checkout
- Public/private visibility: `is_public` controls asset marketplace visibility
- Product status enum: `draft`, `published`, `archived`

### Code Organization

**Backend SDK (`lib/sdk/`):**

- `lib/sdk/server/` - Server-side CRUD operations (assets, products, sales, teams, users, licenses, storage)
- `lib/sdk/shared/types.ts` - Shared TypeScript types (ApiResponse, PaginatedResponse, etc.)
- `lib/sdk/shared/utils.ts` - Shared utilities (success/failure helpers, pagination)
- All functions exported from `lib/sdk/server/index.ts`

**Supabase Clients:**

- `lib/supabase/server.ts` - SSR client for authenticated requests (respects RLS)
- `lib/supabase/service.ts` - Service role client (bypasses RLS - use with caution)
- `lib/supabase/middleware.ts` - Session management middleware

**Server Actions:**

- Pattern: `app/[route]/actions.ts` files using `"use server"` directive
- Handle mutations, Stripe operations, revalidation
- Examples: `app/products/[id]/actions.ts`, `app/assets/[id]/actions.ts`

**Components:**

- `components/ui/` - shadcn/ui primitives (button, card, dialog, etc.)
- `components/blocks/` - Feature-specific composite components organized by domain:
  - `blocks/auth/` - Login, signup, password forms
  - `blocks/assets/` - Asset creation, editing, file upload, royalty management
  - `blocks/products/` - Product creation, variant editing, buy buttons
  - `blocks/teams/` - Team management, invitations
  - `blocks/users/` - Profile settings, visibility controls
- `components/layouts/` - Layout wrappers (app-sidebar, main-layout)

**Routes (App Router):**

- `/` - Homepage with published products
- `/products` - Products listing page
- `/products/[id]` - Product detail page with Stripe checkout
- `/products/[id]/success` - Post-purchase success page
- `/assets` - User's asset management page
- `/assets/[id]` - Asset detail/edit page
- `/cart` - Shopping cart
- `/auth/*` - Authentication flows
- `/u/[handle]` - Public user profile pages
- `/[handle]` - Legacy handle routes
- `/api/webhooks/stripe` - Stripe webhook handler (checkout.session.completed, etc.)

**Type Generation:**

- `lib/types/database.ts` - Auto-generated from Supabase schema
- Provides `Database`, `Tables`, `TablesInsert`, `TablesUpdate` types
- Import pattern: `import type { Tables } from "@/lib/types/database"`

### Critical Patterns

**Authentication Flow:**

1. Middleware (`middleware.ts`) runs on all routes except static files
2. Updates Supabase session from cookies
3. Server components use `await createClient()` to get authenticated client
4. Check user: `const user = await getMe()` from `lib/sdk/server/users.ts`

**Data Fetching:**

- Server Components: Direct database queries via SDK functions
- Client Components: Server Actions or API routes
- Always use `createClient()` for RLS-protected queries
- Only use `createServiceClient()` when you've verified permissions manually

**Stripe Integration:**

- Checkout: Server Actions create Stripe Checkout Sessions
- Webhooks: `app/api/webhooks/stripe/route.ts` handles `checkout.session.completed`
- On successful payment: Creates sale, sale_items, sale_item_assets, royalty_transactions
- Royalties calculated from asset_royalties table (percentage-based splits)

**File Uploads:**

- Storage bucket: `assets` (public, 1GB limit)
- Supported types: Images, PDFs, archives (ZIP, RAR, 7z), audio, 3D models
- Upload pattern: `lib/sdk/server/storage.ts` functions
- Storage paths: `{user_id}/{filename}` for assets

**Soft Deletes:**

- Never hard delete records
- Set `is_deleted = true` and `deleted_at = NOW()`
- Filter queries with `.eq('is_deleted', false)`

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

**Supabase (Local Development):**

- `NEXT_PUBLIC_SUPABASE_URL` - http://127.0.0.1:54321
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Anon key from Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (never expose to client)
- `DATABASE_URL` - Direct PostgreSQL connection (if needed)

**Stripe:**

- `STRIPE_SECRET_KEY` - sk*test*... for test mode
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - pk*test*... for client-side
- `STRIPE_WEBHOOK_SECRET` - whsec\_... from Stripe CLI or dashboard

**Email (Resend):**

- `RESEND_API_KEY` - API key from resend.com
- `RESEND_FROM_EMAIL` - Sender email address

## Common Development Workflows

### Adding a New Feature to Assets or Products

1. Update database schema in `supabase/migrations/`
2. Regenerate types: `npx supabase gen types typescript --local > lib/supabase/database.types.ts`
3. Add SDK functions in `lib/sdk/server/[domain].ts`
4. Create Server Actions in `app/[route]/actions.ts` if needed
5. Build UI components in `components/blocks/[domain]/`
6. Add tests in `__tests__/lib/sdk/server/[domain].test.ts`

### Database Migrations

1. Create migration: `npx supabase migration new [description]`
2. Write SQL in generated file
3. Apply locally: `npm run supabase:reset` (or `npx supabase db reset`)
4. Test thoroughly before deploying to production

### Debugging RLS Issues

- Check RLS policies in migration files
- Use service client temporarily to verify data exists
- Inspect `auth.users()` in policies - ensure user is authenticated
- Test with different user accounts

### Path Aliases

- `@/*` maps to project root (configured in tsconfig.json)
- Example: `import { Button } from "@/components/ui/button"`
