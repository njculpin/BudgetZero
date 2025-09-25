# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter and formatter checks
- `npm run format` - Format code with Biome

## Tech Stack & Architecture

### Framework & Core
- **Next.js 15** with App Router (App Directory structure)
- **TypeScript 5** with strict mode enabled
- **Turbopack** for faster builds and development
- **React 19** with modern features

### Styling & UI
- **Tailwind CSS v4** with PostCSS
- **ShadCN/UI** components in `components/ui/`
- **Radix UI** primitives for accessibility
- **Lucide React** for icons
- **CVA (Class Variance Authority)** for component variants

### Database & Authentication
- **Supabase** for database and authentication
- Client/Server patterns with `@supabase/ssr`
- Separate client instances: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server)
- Authentication middleware in `middleware.ts` for session management

### Forms & Validation
- **React Hook Form** with **Zod** resolvers
- Form components: login, sign-up, forgot-password, update-password

### Project Structure
- `app/` - Next.js App Router pages and API routes
- `app/auth/` - Authentication pages (login, sign-up, forgot-password, etc.)
- `components/` - React components
- `components/ui/` - ShadCN UI components
- `lib/` - Utility functions and configurations
- `lib/supabase/` - Supabase client configurations
- `hooks/` - Custom React hooks
- Path aliases: `@/*` maps to root directory

### Code Quality & Formatting
- **Biome** for linting, formatting, and import organization
- Configuration in `biome.json` with Next.js and React rules
- 2-space indentation, space indent style
- Import organization enabled

### Platform Context
This is the codebase for **BudgetZero**, transitioning from a previous tabletop creator marketplace platform (detailed specs in README.md). The project appears to be in early stages, with basic Next.js structure and Supabase authentication setup.

## Game Editor
The main function of this application will be to allow designers, 3d modelers, illustrators, editors, graphic designers, photographers, etc.. collaborate together on game projects. Professionals can upload original works for others to use, or fork existing works to use in their work projects. Professionals can set the level of access others have. This means work can be free to use, limited, or invite only. Other professionals can connect each other, as a social proof connection network. If a professional does consistent and good work they will be upvoted by other professionals.

This project aims to address a key problem that I hear on a regular basis. A game designer might go to a website like myminifactory, find some minis that inspire them and they want to use them in their game. Then there is a huge hastle around getting permission, for how long, what are the terms, etc... This service starts with that intent. Modlers who contribute want game designers to user their work. Game designers want to find modlers to inspire and employ for their designs.

A game designer can start a rule book in a collaborative environment.
They can find models from a library of contributions to inject into their rule books.
The modler would be notified of the addition and a two way communication is opened (if permitted)
After completed, the project can go on sale in our marketplace as a digital asset.
The percentage of sale is evenly distributed.

Phase 0.
Supabase Local Development

Phase 1.
Create a Game Project
Game designers edit a rule book.
Create terms of use.
Create price points to use or just purchase.

Phase 2.
Create a Model Project
3D modelers can upload models
Create terms of use.
Create price points to use or just purchase.

Phase 3.
Create a Illustration Project
Illustrators can upload work
Create terms of use.
Create price points to use or just purchase.

Phase 4.
Each project owner can request other project owners
to join them in a fork of their own project. This fork is
a new project, it includes two or more other projects of different types.
Once merged, project owners become co-owners of the new project. Sales of
this project are split evenly. All parties must accept and agree to publish it.

Phase 5.
Marketplace. Once a project owner(s) agree to put a project on sale its listed
in our marketplace. Sales are split evenly between project owners.

## Key Patterns

### Supabase Usage
- Always use appropriate client for context (browser vs server)
- Server components: use `lib/supabase/server.ts`
- Client components: use `lib/supabase/client.ts`
- Middleware handles session updates automatically

### Component Organization
- UI components follow ShadCN conventions
- Form components are separate and use React Hook Form + Zod
- Authentication flows are well-structured in `app/auth/` directory

### TypeScript Configuration
- Strict mode enabled with path aliases
- ES2017 target with modern ES features
- Next.js plugin integration for enhanced type checking