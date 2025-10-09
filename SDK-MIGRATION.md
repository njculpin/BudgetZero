# Server SDK Migration Guide

## Overview

All server components should use the **server SDK** (`lib/sdk/server`) instead of direct Supabase calls. This provides:

- **Consistency**: Same data access patterns across the application
- **Type Safety**: Proper TypeScript interfaces
- **Maintainability**: Single source of truth for queries
- **Testability**: Easier to mock for testing

## SDK Structure

```
lib/sdk/
├── server/                    # Server-side SDK (for server components)
│   ├── index.ts              # Barrel export
│   ├── projects.ts           # Project-related queries
│   ├── assets.ts             # Asset-related queries
│   ├── references.ts         # Reference/lookup queries
│   └── products.ts           # Product/marketplace queries
└── use-*.ts                  # Client-side hooks (for client components)
```

## Server SDK Functions

### Projects (`lib/sdk/server/projects.ts`)

```typescript
// Get single project by slug
const { data, error } = await getProjectBySlug("my-project");

// Get all projects with filters
const { data, error, count } = await getAllProjects({
  creatorId: user.id,
  status: "active",
  limit: 10,
  offset: 0,
});

// Get project assets
const { data, error } = await getProjectAssets(projectId);

// Get project collaborators
const { data, error } = await getProjectCollaborators(projectId);

// Get approved asset references
const { data, error } = await getProjectAssetReferences(projectId);
```

### Assets (`lib/sdk/server/assets.ts`)

```typescript
// Get single asset by ID
const { data, error } = await getAssetById(assetId);

// Get all assets with filters
const { data, error, count } = await getAllAssets({
  assetType: "model",
  search: "dragon",
  publicOnly: true,
  limit: 24,
  offset: 0,
});

// Get user's assets
const { data, error } = await getUserAssets(userId);

// Get asset stats
const { data, error } = await getAssetStats(assetIds);

// Count user's projects/assets
const { count, error } = await countUserProjects(userId);
const { count, error } = await countUserAssets(userId);
```

### References (`lib/sdk/server/references.ts`)

```typescript
// Get asset references
const { data, error } = await getAssetReferences({
  assetIds: ["id1", "id2"],
  status: "pending", // optional
});

// Lookup helpers (for enriching data)
const { data, error } = await getAssets(assetIds);
const { data, error } = await getProjects(projectIds);
const { data, error } = await getUsers(userIds);
const { data, error } = await getAssetRoyalties(royaltyIds);
```

### Products (`lib/sdk/server/products.ts`)

```typescript
// Get all products
const { data, error, count } = await getAllProducts({
  search: "rpg",
  limit: 12,
  offset: 0,
});

// Get single product by handle
const { data, error } = await getProductByHandle("my-product");

// Get product collections
const { data, error } = await getProductCollections();
```

## Migration Examples

### Before (Direct Supabase)

```typescript
// ❌ BAD: Direct Supabase call in server component
export default async function DashboardPage() {
  const supabase = await createClient();

  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user.id);

  const { data: assets } = await supabase
    .from("assets")
    .select("id, title, asset_type")
    .eq("creator_id", user.id);

  // ... more queries
}
```

### After (Server SDK)

```typescript
// ✅ GOOD: Using server SDK
import { countUserProjects, getAllAssets } from "@/lib/sdk/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count } = await countUserProjects(user.id);

  const { data: assets } = await getAllAssets({
    creatorId: user.id,
    limit: 10,
  });

  // ... cleaner, more maintainable
}
```

## Completed Migrations

### ✅ Dashboard Page (`app/dashboard/page.tsx`)

**Before**: 7 direct Supabase queries
**After**: 9 SDK function calls

Changes:
- `countUserProjects()` - get project count
- `countUserAssets()` - get asset count
- `getUserAssets()` - get user's asset IDs
- `getAssetStats()` - get view/download stats
- `getAssetReferences()` - get pending references
- `getAssets()` - lookup asset details
- `getProjects()` - lookup project details
- `getUsers()` - lookup user details
- `getAssetRoyalties()` - get royalty percentages

### ✅ Project Detail Page (`app/projects/[slug]/page.tsx`)

**Status**: Fixed broken GameProjectService, removed pricing_tiers references

**Not yet using SDK** - needs migration to server SDK functions

### Pending Migrations

The following pages still use direct Supabase calls and should be migrated:

1. **Projects List** (`app/projects/page.tsx`)
   - Use: `getAllProjects()`

2. **Assets List** (`app/assets/page.tsx`)
   - Use: `getAllAssets()`

3. **Asset Detail** (`app/assets/[id]/page.tsx`)
   - Use: `getAssetById()`

4. **Requests Page** (`app/requests/page.tsx`)
   - Use: `getAssetReferences()`, `getAssets()`, `getProjects()`, `getUsers()`

5. **Shop Pages** (`app/shop/page.tsx`, `app/shop/[handle]/page.tsx`)
   - Use: `getAllProducts()`, `getProductByHandle()`, `getProductCollections()`

6. **Project Detail** (`app/projects/[slug]/page.tsx`)
   - Use: `getProjectBySlug()`, `getProjectAssets()`, `getProjectCollaborators()`, `getProjectAssetReferences()`

## Adding New SDK Functions

When adding new server SDK functions, follow these patterns:

### 1. Single Entity Query

```typescript
export async function getEntityById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("entities")
    .select(`
      *,
      related_table (*)
    `)
    .eq("id", id)
    .single();

  return { data, error };
}
```

### 2. Collection Query with Filters

```typescript
export async function getAllEntities(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("entities")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%`);
  }

  if (options?.limit && options?.offset !== undefined) {
    query = query.range(
      options.offset,
      options.offset + options.limit - 1,
    );
  }

  const { data, error, count } = await query;

  return { data, error, count };
}
```

### 3. Lookup/Helper Query

```typescript
export async function getEntitiesByIds(ids: string[]) {
  const supabase = await createClient();

  if (ids.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("entities")
    .select("id, name")
    .in("id", ids);

  return { data, error };
}
```

### 4. Count Query

```typescript
export async function countUserEntities(userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("entities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return { count, error };
}
```

## Benefits Demonstrated

### Dashboard Example

**Lines of Code**:
- Before: ~145 lines of Supabase query logic
- After: ~143 lines (similar, but more readable)

**Readability**:
- Before: Nested Supabase query chains
- After: Clear function names describing what data is fetched

**Maintainability**:
- Before: Query logic duplicated across pages
- After: Centralized in SDK, reusable

**Testing**:
- Before: Hard to mock Supabase client
- After: Easy to mock SDK functions

## Client vs Server SDK

### Client SDK (`lib/sdk/use-*.ts`)

- For client components (`'use client'`)
- Uses React hooks pattern
- Returns functions to call
- Uses `createClient()` from `@/lib/supabase/client`

Example:
```typescript
'use client'
import { useUserGetAllProjects } from '@/lib/sdk/use-user-get-all-projects'

export function ProjectList() {
  const { getProjects } = useUserGetAllProjects()

  useEffect(() => {
    async function fetch() {
      const { data } = await getProjects()
      // ... use data
    }
    fetch()
  }, [])
}
```

### Server SDK (`lib/sdk/server/*.ts`)

- For server components (default in App Router)
- Direct async functions
- No React hooks
- Uses `createClient()` from `@/lib/supabase/server`

Example:
```typescript
// Server component (no 'use client')
import { getAllProjects } from '@/lib/sdk/server'

export default async function ProjectsPage() {
  const { data } = await getAllProjects({ limit: 10 })

  return <div>{/* render data */}</div>
}
```

## Next Steps

1. Migrate remaining pages to use server SDK (see Pending Migrations above)
2. Add more SDK functions as needed for new features
3. Consider adding mutation functions (create, update, delete) to server SDK
4. Add JSDoc comments to SDK functions for better IDE autocomplete
5. Consider adding response type interfaces for better type safety

## Questions?

See examples in:
- `app/dashboard/page.tsx` - Full migration example
- `lib/sdk/server/projects.ts` - Project SDK functions
- `lib/sdk/server/assets.ts` - Asset SDK functions
