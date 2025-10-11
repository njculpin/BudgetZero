# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Workshop** is a tabletop game creator collaboration platform where designers, 3D modelers, illustrators, and editors collaborate on game projects with transparent attribution and automatic revenue sharing. Projects contain assets (models, illustrations, audio, textures, animations), all with cross-project referencing and royalty tracking.

## Development Commands

```bash
# Start development (kills port 3000, starts Supabase, runs Next.js)
npm run dev

# Start dev without Supabase (if already running)
npm run dev:simple

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Supabase commands
npm run supabase:start    # Start local Supabase
npm run supabase:stop     # Stop local Supabase
npm run supabase:reset    # Reset database to migrations
npm run supabase:status   # Check Supabase status
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, Turbopack)
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS v4 with ShadCN/UI components
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe (checkout + Connect for payouts)
- **Editor**: TipTap (JSONB storage for rich text documents)
- **Linting**: Biome (replaces ESLint/Prettier)

## Architecture

### Data Model

The core data model centers around **projects** as containers:

```
projects
├── assets (models, illustrations, audio, textures, animations) - owned by creator
├── project_asset_references - references to OTHER creators' assets
├── project_collaborators - team members with revenue splits
└── pricing_tiers - marketplace pricing with included assets
```

### Attribution & Revenue System

1. **Asset Creation**: Creator uploads asset with royalty % (0-50%)
2. **Cross-Reference Request**: Other creators request to use that asset in their projects
3. **Approval Flow**: Owner approves/rejects via `/requests` dashboard
4. **Revenue Split**: On sale, platform takes 2%, then royalties distributed automatically
5. **Stripe Connect**: Creators connect Stripe accounts for payouts

Example: A $30 project sale with 15% model royalty + 20% art royalty:
- Platform: $0.60 (2%)
- Modeler: $4.50 (15%)
- Illustrator: $6.00 (20%)
- Project creator: $23.40 (remainder)

### Key Service Patterns

**Service Layer** (`lib/services/`): Business logic for database operations
- `GameProjectService`: Project CRUD, access control, search
- `AssetIntegrationService`: Asset references, approval workflow
- `StorageService`: Supabase Storage for files
- Always return `ApiResponse<T>` with `{ data?, error? }` pattern

**Supabase Clients**:
- `lib/supabase/server.ts`: Server-side (never cache, recreate per request)
- `lib/supabase/client.ts`: Client-side browser usage
- `lib/supabase/middleware.ts`: Session refresh in middleware

**API Routes** (`app/api/`):
- Use `createClient()` from server.ts for auth
- Validate with Zod schemas from `lib/validations/schemas.ts`
- Return consistent JSON responses

### Component Organization

```
components/
├── ui/                    # ShadCN base components (Button, Card, etc.)
├── blocks/                # Business logic components
│   ├── projects/         # Project-specific (revenue splits, pricing, tags)
│   ├── assets/           # Asset upload, search, reference
│   └── auth/             # Login, signup forms
└── layouts/              # MainLayout with sidebar navigation
```

### Page Structure

All pages use the **MainLayout** wrapper with user + breadcrumbs:
```tsx
<MainLayout user={user} breadcrumbs={breadcrumbs}>
  {/* page content */}
</MainLayout>
```

Server components fetch data, client components (`"use client"`) handle interactivity.

## Database Schema Notes

### Critical Tables

- **users**: Extended Supabase auth.users with profiles
- **projects**: `status` enum (draft/active/archived/published), `is_public` visibility
- **assets**: `asset_type` for models/illustrations/audio/textures/animations, `seeking_collaborators` flag
- **project_asset_references**: `status` ('pending'/'approved'/'rejected'), links to asset royalties
- **asset_pricing** and **project_pricing**: Marketplace pricing tiers
- **orders**: Stripe checkout sessions with order metadata
- **order_revenue_splits**: Automatic calculation per order for royalty distribution

### RLS Policies

Row-Level Security enforces:
- Users can only see their own projects (unless `is_public=true`)
- Collaborators with `invitation_status='accepted'` have project access
- Asset references require approval from asset owner
- Revenue data only visible to recipients

### Schema Status

The migration file `20250101000000_initial_workshop_schema.sql` has been reviewed and validated. Always test migrations locally before pushing: `npx supabase db reset`

## Code Conventions

1. **No `any` types**: User enforces strict TypeScript (see global CLAUDE.md)
2. **Import alias**: Use `@/*` for absolute imports (configured in tsconfig.json)
3. **Database types**: Generate from Supabase schema (stored in `lib/types/database.ts`)
4. **Async components**: Prefer async Server Components, use `"use client"` only when needed
5. **Error handling**: Always handle service errors with `if (result.error)` checks
6. **Slug generation**: Projects use human-readable slugs from titles (see `createSlug` in validations)

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase (local development defaults provided)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # from Stripe CLI

# Email (Resend for notifications)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Workshop <noreply@yourdomain.com>"
```

Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Common Workflows

### Adding a New Asset Type

1. Add enum value to `asset_type` if needed (currently: model, illustration, audio, texture, animation, other)
2. Update `AssetUploadForm` component for type-specific fields
3. Add validation schema in `lib/validations/schemas.ts`
4. Update asset display components in project pages

### Creating API Endpoints

1. Create route in `app/api/[resource]/route.ts`
2. Validate input with Zod schemas
3. Use service layer for business logic
4. Return `NextResponse.json()` with consistent structure
5. Handle auth with `await createClient()` and `supabase.auth.getUser()`

### Modifying Database Schema

1. Create new migration: `npx supabase migration new <name>`
2. Write SQL in `supabase/migrations/`
3. Test locally: `npx supabase db reset` (applies all migrations)
4. Push to remote: `npx supabase db push`

## Navigation Structure

**Main sidebar** (`components/layouts/app-sidebar.tsx`):
- Projects → `/projects` (user's owned + collaborated projects)
- Assets → `/assets` (browse marketplace assets)
- Teams → `/teams` (collaboration hub)
- Requests → `/requests` (approval dashboard for references)

**Settings** (`/settings/[tab]`):
- Profile, Notifications, Billing, Payouts, Privacy

## Testing Notes

- No test framework currently configured
- Manual testing via local Supabase instance
- Use Supabase Studio at `http://127.0.0.1:54323` for database inspection
- Test payments with Stripe test cards (4242 4242 4242 4242)

## Known Issues & TODOs

1. Many backup migrations in `supabase/migrations_backup/` - cleanup needed
2. No email notifications implemented yet (Resend configured but not wired)
3. Victory points system tables exist but not fully implemented in UI
4. Asset comments system partially implemented (tables exist, UI needed)
5. Project chat/collaboration features partially implemented
- always use lib/sdk to make requests to supabase. do not write supabase logic or requests anywhere else. before writing a supabase call, check this directory for a solution before duplicating code.