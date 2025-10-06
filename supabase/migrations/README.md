# Workshop Database Migrations

## Current State

This directory contains a **single consolidated migration** that represents the complete Workshop platform schema.

### File Structure

- `20250101000000_initial_workshop_schema.sql` - Complete database schema including:
  - User profiles with creator roles and settings
  - Unified projects system (games, models, illustrations)
  - Assets and documents with royalty tracking
  - Collaboration and revenue sharing
  - Marketplace (orders, payments, revenue splits)
  - Stripe Connect for payouts
  - Notifications and activity tracking
  - Victory Points system

## Why Consolidated?

The previous migration history consisted of 35+ incremental migrations created during development. Since the platform hasn't been deployed to production yet, these were consolidated into a single, clean migration for:

1. **Clarity** - Easier to understand the complete schema
2. **Maintainability** - Single source of truth
3. **Performance** - Faster initial setup
4. **Simplicity** - No migration ordering issues

## Backup

Original migrations are backed up in git history. To view them:

```bash
git log -- supabase/migrations/
```

## Local Development

To reset your local database with the consolidated schema:

```bash
npx supabase db reset
```

Or apply directly:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/20250101000000_initial_workshop_schema.sql
```

## Production Deployment

When ready to deploy to production, this single migration will be applied to create the complete schema.

## Future Migrations

Going forward, create incremental migrations using:

```bash
npx supabase migration new <migration_name>
```

These will be applied **after** the initial schema migration.
