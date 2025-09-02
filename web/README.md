# Budget Zero

A minimal, fast collaborative game design platform with zero upfront investment.

## 🎯 Philosophy

- **Minimal**: Only what you actually need, nothing more
- **Fast**: Lightweight, no bloat, instant loading
- **Simple**: Easy to understand, modify, and extend
- **Flexible**: No vendor lock-in, easy to pivot

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Setup database (PostgreSQL required)
npm run setup

# Start development server
npm run dev

# Build for production
npm run build
```

## 🗄️ Database Setup

**Prerequisites:**
- PostgreSQL 14+ installed
- `psql` command available in PATH

**Quick Setup:**
```bash
# Start PostgreSQL
npm run postgres:start

# Setup database with Prisma
npm run setup

# Or step by step:
npm run prisma:push    # Create tables from schema
npm run prisma:seed    # Load demo data
```

**Demo Data:**
The database comes pre-seeded with:
- **Demo Users**: admin@budgetzero.dev, creator@budgetzero.dev, artist@budgetzero.dev, writer@budgetzero.dev
- **Demo Projects**: Cosmic Explorers, Dragon Keepers, Steampunk Adventures
- **Demo Milestones**: Core mechanics, artwork, rulebook, production
- **Demo Invite Codes**: CREATOR2024, CONTRIB2024, VIP2024, GENERAL2024

## 🏗️ Architecture

**What we have:**
- JSX components with jsx-dom (no virtual DOM)
- Simple HTML templates
- Basic navigation between views
- Clean, minimal CSS
- TypeScript for type safety
- Vite for fast development
- PostgreSQL database with Prisma ORM
- Invite system with authentication service

**What we DON'T have (yet):**
- Complex component systems
- WebGPU animations
- Shadow DOM components
- Real-time collaboration

## 📁 Structure

```
src/
├── main.tsx          # Main app with JSX components
├── styles/
│   └── app.css      # Minimal styling
└── utils/
    ├── database.ts  # Prisma database utility
    └── auth.ts      # Authentication service

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Demo data
```

## 🔄 Development Flow

1. **Start simple** - Add features only when needed
2. **Keep it minimal** - Avoid over-engineering
3. **Focus on speed** - Performance over complexity
4. **Easy to change** - Simple code is easier to modify

## 🎨 Adding Features

When you need something new:
1. Add it directly to `main.tsx` first
2. If it gets complex, extract to a separate file
3. Keep it simple - avoid abstractions until necessary

## 🚫 What We Avoid

- Premature optimization
- Complex state management
- Over-abstracted components
- External dependencies unless absolutely necessary
- Shadow DOM for simple UI elements

## 🧪 Testing the App

1. **Start the app**: `npm run dev`
2. **Use demo invite codes**:
   - `CREATOR2024` - For creators
   - `CONTRIB2024` - For contributors
   - `VIP2024` - For VIP users
   - `GENERAL2024` - For general users
3. **Navigate**: Click buttons to move between views
4. **Authenticate**: Use any email + valid invite code

## 🔧 Database Commands

```bash
# View database in Prisma Studio
npm run prisma:studio

# Reset database with fresh data
npm run db:reset

# Just load schema
npm run prisma:push

# Just load seed data
npm run prisma:seed

# Generate Prisma client
npm run prisma:generate
```

## 🆕 What Changed

- **Removed**: Old SQL schema files and scripts
- **Added**: Prisma ORM with type-safe database operations
- **Improved**: Database setup is now simpler and more reliable
- **Enhanced**: Full TypeScript support for database operations
