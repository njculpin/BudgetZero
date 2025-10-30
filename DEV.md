# Development Setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development environment:**
   ```bash
   npm run dev
   ```

   This command automatically:
   - ✅ Starts Supabase local instance (if not already running)
   - ✅ Opens local email client (Inbucket) at http://127.0.0.1:54324
   - ✅ Starts Astro dev server at http://localhost:4321

## Environment Variables

All environment variables are pre-configured in `.env.local` for local development using Supabase's default local keys.

- **Supabase API:** http://127.0.0.1:54321
- **Email Client (Inbucket):** http://127.0.0.1:54324
- **Astro Dev Server:** http://localhost:4321

## Available Scripts

### Development
- `npm run dev` - Start full development environment (Supabase + Email + Astro)
- `npm run dev:only` - Start only Astro dev server (skip Supabase/email)
- `npm run dev:astro` - Alias for dev:only

### Supabase Commands
- `npm run supabase:start` - Start Supabase local instance
- `npm run supabase:stop` - Stop Supabase local instance
- `npm run supabase:status` - Show Supabase status and keys
- `npm run supabase:reset` - Reset database to migrations

### Email Testing
- `npm run email` - Open email client in browser
- All emails sent in development are captured by Inbucket
- View emails at http://127.0.0.1:54324

### Testing
- `npm run test` - Run unit tests (watch mode)
- `npm run test:run` - Run unit tests (single run)
- `npm run test:ui` - Open Vitest UI
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Open Playwright UI
- `npm run test:e2e:debug` - Debug E2E tests

### Build
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## First Time Setup

If this is your first time running the project:

1. Make sure Docker Desktop is running
2. Run `npm run dev` - Supabase will initialize on first run
3. Wait for migrations to complete
4. Access the app at http://localhost:4321

## Testing Email Flows

All emails in development are captured by Inbucket:

1. Trigger an email action (sign up, password reset, etc.)
2. Open http://127.0.0.1:54324
3. View the email in the Inbucket inbox

## Database Migrations

To apply new migrations or reset the database:

```bash
npm run supabase:reset
```

This will:
- Drop all tables
- Re-run all migrations from `supabase/migrations/`
- Seed data if configured

## Troubleshooting

### Supabase won't start
- Ensure Docker Desktop is running
- Run `supabase stop` then `supabase start`
- Check Docker has enough resources allocated

### Port conflicts
- Supabase uses ports: 54321, 54322, 54323, 54324
- Make sure these ports are not in use by other applications

### Environment variables not loading
- Verify `.env.local` exists in project root
- Restart the dev server after changing env vars
