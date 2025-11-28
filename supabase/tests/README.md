# Supabase RLS Policy Tests

This directory contains tests for Row Level Security (RLS) policies using pgTAP.

## Running RLS Tests

### Prerequisites

1. Start Supabase local development:
```bash
supabase start
```

2. Ensure pgTAP is installed (included with Supabase by default)

### Run All Tests

```bash
supabase test db
```

### Run Specific Test File

```bash
supabase test db asset_rls_policies.test.sql
```

## Test Files

### `asset_rls_policies.test.sql`
Tests RLS policies for the 4-state asset status system:

**What it tests:**
- ✅ Anonymous users can only see public assets
- ✅ Anonymous users cannot see draft/private/archived assets
- ✅ Owners can see all their own assets (all statuses)
- ✅ Owners can update/delete their own assets
- ✅ Other users can only see public assets
- ✅ Other users cannot update/delete assets they don't own
- ✅ Soft-deleted assets are not visible (even if public)

**Coverage:** 18 test cases

## Writing New Tests

Use pgTAP syntax:

```sql
BEGIN;
SELECT plan(5); -- Number of tests

-- Your test code here
SELECT ok(true, 'This test passes');

SELECT * FROM finish();
ROLLBACK;
```

## Common Test Functions

- `ok(boolean, description)` - Test passes if true
- `is(actual, expected, description)` - Test equality
- `results_eq(sql, expected_array, description)` - Compare query results
- `throws_ok(sql, description)` - Test that query throws error
- `lives_ok(sql, description)` - Test that query succeeds
- `is_empty(sql, description)` - Test that query returns no rows

## Resources

- [pgTAP Documentation](https://pgtap.org/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/cli/local-development#testing)
