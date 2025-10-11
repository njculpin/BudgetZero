# Workshop - Tabletop Creator Collaboration Platform

A collaborative platform where tabletop game creators (designers, 3D modelers, illustrators, editors) work together on game projects with transparent attribution and automatic revenue sharing.

## Current Status

- **Phase 0:** ✅ Complete - Supabase setup, unified project architecture
- **Phase 1:** ✅ Complete - Attribution system with approval dashboard, toast notifications
- **Phase 2:** 🔄 Planned - Notifications (email + in-app)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Architecture

### Core Concept
Game projects serve as containers for multiple types of assets:
- **3D Models** (miniatures, terrain, tokens)
- **Illustrations** (artwork, covers, icons)
- **Audio** (sound effects, music)
- **Textures** (materials, patterns)
- **Animations** (character movements, effects)

All assets can be **cross-referenced** between projects with automatic attribution and royalty tracking.

### Attribution System
1. Creator uploads content to their project with royalty percentage (0-50%)
2. Other creators can request to reference that content in their projects
3. Content owner approves/rejects via dashboard
4. Approved references appear with attribution chain on project pages
5. Revenue is automatically split: Platform fee (2%) + Content royalties + Project creator

### Example Flow
```
Designer creates "Fantasy Quest" project
├─ Creates assets: Character models (10% royalty)
├─ References Modeler's "Goblin Mini" (15% royalty)
└─ References Illustrator's "Cover Art" (20% royalty)

$30 Sale Revenue Split:
- Platform: $0.60 (2%)
- Modeler: $4.50 (15%)
- Illustrator: $6.00 (20%)
- Character creator: $3.00 (10%)
- Designer: $15.90 (remainder)
```

## Tech Stack

### Framework & Core
- **Next.js 15** with App Router (React 19)
- **TypeScript 5** (strict mode, no `any` types)
- **Turbopack** for fast builds
- **Supabase** for database, auth, and real-time features

### UI & Styling
- **Tailwind CSS v4** with PostCSS
- **ShadCN/UI** component library
- **Radix UI** primitives for accessibility
- **Lucide React** icons
- **CVA** for component variants

### Forms & Validation
- **React Hook Form** with **Zod** resolvers
- Type-safe form validation

## Project Structure

```
/app
  /projects/[slug]              # Project detail page
  /assets                       # Asset library and upload
    /[id]                       # Asset detail page
    /upload                     # Upload new asset
  /requests                     # Attribution approval dashboard
  /teams                        # Collaboration hub
  /shop                         # Marketplace
  /api                          # API routes

/components
  /ui                           # ShadCN components
  /blocks                       # Business logic components
    /projects                   # Project-specific components
    /assets                     # Asset upload/reference components
    /auth                       # Authentication forms
  /layouts                      # MainLayout wrapper

/lib
  /supabase                     # Supabase clients (browser/server)
  /sdk                          # Database SDK functions
  /types                        # TypeScript type definitions
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format code with Biome |

## Key Features

### ✅ Implemented
- User authentication (Supabase Auth)
- Project creation and management
- Asset upload (models, illustrations, audio, textures, animations) with royalty settings
- Asset reference system (request to use assets in projects)
- Attribution approval dashboard (`/requests`)
- Real-time revenue split calculator
- Referenced assets display on project pages
- Marketplace pages (`/shop`, `/products`)
- Asset library with search and filtering
- Teams and collaboration structure

### 🔄 In Progress
- Email notifications for reference requests (Resend configured)
- In-app notification center

### 📋 Planned
- Revenue analytics dashboard
- Collaboration invites workflow
- Victory points system (tables exist)
- Asset comments and reviews
- Print-on-demand integration

## Database Schema

### Core Tables
- **users** - User profiles (Supabase Auth extension)
- **projects** - Game projects (container for assets)
- **assets** - Models, illustrations, audio, textures, animations, etc.
- **asset_royalties** - Royalty percentages for asset usage (0-50%)
- **project_asset_references** - Cross-project asset attribution with approval workflow
- **products** - Marketplace product listings with variants and pricing
- **orders** - Stripe checkout sessions with revenue splits
- **order_revenue_splits** - Automatic royalty distribution calculations

### Attribution Workflow
1. User requests to reference another user's asset → `status: 'pending'`
2. Asset owner approves via `/requests` dashboard → `status: 'approved'`
3. Asset owner can reject → `status: 'rejected'`
4. Approved references appear on project pages with automatic revenue split tracking

## Code Quality

- **TypeScript Strict Mode**: Enabled
- **No `any` Types**: Enforced via user configuration
- **Linting**: Biome with Next.js and React rules
- **Import Organization**: Automatic via Biome
- **Formatting**: 2-space indentation, consistent style

## Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Follow TypeScript strict mode (no `any` types)
2. Use Biome for formatting and linting
3. Keep components focused and reusable
4. Write descriptive commit messages
5. Update documentation for new features

## Phase Roadmap

See `CLAUDE.md` for detailed phase descriptions and implementation plan.

## Platform Vision

Workshop enables tabletop creators to:
- Collaborate across disciplines (design, art, 3D modeling)
- Build attribution chains with transparent royalty splits
- Fork and remix content with proper credit
- Monetize collaborative work automatically
- Discover and connect with other creators

Built for designers, illustrators, 3D modelers, editors, and everyone in between.

---

**License:** MIT
**Documentation:** See `CLAUDE.md` for development instructions
**Status:** See `STATUS.md` for current project state
