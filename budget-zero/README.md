# Budget Zero - Development Setup

Ultra-minimal collaborative game design platform built with Vite + TypeScript + PostgreSQL.

## 🚀 Quick Start

```bash
# First time setup (installs deps, starts postgres, creates database)
npm run setup

# Daily development (starts postgres + dev server)
npm start

# Or run separately:
npm run postgres:start  # Start PostgreSQL
npm run dev             # Start Vite dev server
```

## 📊 Database Commands

```bash
# Database operations
npm run db:setup        # Create tables from schema.sql
npm run db:seed         # Add development data
npm run db:reset        # Drop, recreate, and seed database
npm run db:console      # Open psql console
npm run db:migrate      # Run latest migration (when available)

# PostgreSQL service
npm run postgres:start    # Start PostgreSQL service
npm run postgres:stop     # Stop PostgreSQL service  
npm run postgres:restart  # Restart PostgreSQL service
```

## 🧪 Development Data

The database comes pre-seeded with test data:

**Test Invite Codes:**
- `CREATOR2024` - Creator invites (10 uses)
- `CONTRIB2024` - Contributor invites (20 uses) 
- `VIP2024` - VIP invites (5 uses)
- `GENERAL2024` - General invites (50 uses)

**Test User:**
- Email: `admin@budgetzero.dev`
- ID: `00000000-0000-0000-0000-000000000001`

## 🛠️ Development Scripts

```bash
# Development
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Code quality
npm run lint            # TypeScript type checking
npm run format          # Format code with Prettier
npm run clean           # Clean build artifacts

# Utilities
npm run setup           # Complete first-time setup
npm run reset           # Reset database with fresh data
```

## 🏗️ Project Structure

```
budget-zero/
├── src/                # Frontend TypeScript code
├── database/           # Database schema and migrations
│   ├── schema.sql      # Main database schema
│   ├── seed.sql        # Development data
│   └── migrations/     # Database migrations (future)
├── public/             # Static assets
└── package.json        # All development scripts
```

## 🔧 Architecture

- **Frontend**: Vite + TypeScript + Vanilla Web Components
- **Database**: PostgreSQL (local development)
- **Styling**: CSS Custom Properties + WebGPU animations
- **Editor**: Custom ProseMirror + Yjs collaboration (coming soon)

## 🎯 Development Philosophy

- **Local-first**: Full offline development
- **Zero vendor lock-in**: Standard web technologies
- **Minimal dependencies**: Add only when absolutely needed
- **Performance first**: Lighthouse 100 scores
- **Migration-ready**: Deploy anywhere (Supabase, Railway, self-hosted)

## 📝 Next Steps

1. Build design system with WebGPU animations (Week 4)
2. Create custom rich text editor with ProseMirror (Week 5)
3. Add real-time collaboration with Yjs (Week 6)
4. Implement invite-only authentication (Week 7)

---

*Never forget a command again! All development tasks are in `package.json` scripts.*
