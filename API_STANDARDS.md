# API Standards & Contract Documentation

## Overview
This document defines the API contract standards for all endpoints in the Game Loopers application.

## Architecture Note: Action-Based Routing

**Current Structure**: This API uses action-based routing (e.g., `/api/products/create-product`, `/api/products/update-product`) rather than RESTful conventions (e.g., `POST /api/products`, `PUT /api/products/:id`).

**Decision Rationale**:
- ✅ SDK isolation is the critical architectural pattern (fully enforced)
- ✅ Consistent structure across all endpoints
- ✅ Clear, explicit action names
- ⚠️ Non-standard REST structure (documented as technical debt)

**Future Consideration**: REST migration deferred to maintain velocity. All endpoints work correctly through proper SDK isolation layers.

## SDK Isolation Layer

**CRITICAL ARCHITECTURE RULE**: All API endpoints MUST use the SDK isolation layers. Direct imports of third-party SDKs are prohibited.

### Isolation Layers

| Layer | Location | Purpose | Exports |
|-------|----------|---------|---------|
| **Auth** | `src/lib/auth/` | Supabase Auth | `signInWithPassword()`, `signUp()`, `setSession()`, `getUser()`, `signOut()` |
| **Data Access** | `src/lib/data-access/` | Database operations | `getProductById()`, `createProduct()`, `updateUser()`, etc. |
| **Storage** | `src/lib/storage/` | File storage | `uploadFile()`, `deleteFile()`, `getPublicUrl()`, `createSignedUrl()` |
| **Payments** | `src/lib/payments/` | Stripe integration | `createCheckoutSession()`, `processRefund()` |

### Enforcement

**✅ Correct** - Use isolation layers:
```typescript
import { setSession } from "@/lib/auth";
import { getProductById } from "@/lib/data-access/products";
import { uploadFile } from "@/lib/storage";
```

**❌ Incorrect** - Direct SDK imports:
```typescript
import { createClient } from "@supabase/supabase-js"; // NEVER DO THIS
```

**Audit Status**: All API routes audited (2025-01-30) - Zero direct Supabase imports found ✅

---

## General Principles

### 1. All Responses Must Be JSON
- **Content-Type**: `application/json`
- **Status codes**: Use appropriate HTTP status codes
- **Consistency**: All endpoints follow the same error/success patterns

### 2. Authentication
All protected endpoints must:
1. Check for `sb-access-token` and `sb-refresh-token` cookies
2. Validate session using `setSession()`
3. Return `401` with JSON error if authentication fails

```typescript
// Standard auth check
const accessToken = cookies.get("sb-access-token");
const refreshToken = cookies.get("sb-refresh-token");

if (!accessToken || !refreshToken) {
  return new Response(
    JSON.stringify({ error: "Not authenticated" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### 3. Request Formats

| Content Type | When to Use | Example Endpoints |
|--------------|-------------|-------------------|
| **JSON** | Non-file operations | Auth, cart, products (without images) |
| **FormData** | File uploads | Assets, images, avatars, documents |

### 4. Validation
- Use Zod for request validation
- Return `400` with validation details on error

```typescript
try {
  const validatedData = schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: error.errors }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

## API Endpoints

### Complete Route Reference

| Category | Method | Endpoint | Content Type | Auth Required |
|----------|--------|----------|--------------|---------------|
| **Authentication** |
| | POST | `/api/auth/sign-in` | JSON | No |
| | POST | `/api/auth/sign-up` | JSON | No |
| | POST | `/api/auth/sign-out` | - | Yes |
| **Cart** |
| | POST | `/api/cart/add` | JSON | Yes |
| | POST | `/api/cart/update` | JSON | Yes |
| | POST | `/api/cart/remove` | JSON | Yes |
| | POST | `/api/cart/clear` | JSON | Yes |
| **Products** |
| | POST | `/api/products/create-product` | JSON | Yes |
| | PUT | `/api/products/update-product` | JSON | Yes |
| | POST | `/api/products/update-product` | FormData | Yes |
| | DELETE | `/api/products/delete-product` | JSON | Yes |
| **Product Variants** |
| | POST | `/api/products/variants/create` | JSON | Yes |
| | POST | `/api/products/variants/update` | JSON | Yes |
| | POST | `/api/products/variants/delete` | JSON | Yes |
| | POST | `/api/products/variants/link-asset` | JSON | Yes |
| | POST | `/api/products/variants/unlink-asset` | JSON | Yes |
| | POST | `/api/products/variants/create-price` | JSON | Yes |
| **Assets** |
| | POST | `/api/assets/create-asset` | FormData | Yes |
| | POST | `/api/assets/update-asset` | FormData | Yes |
| | POST | `/api/assets/delete-asset` | JSON | Yes |
| **Documents** |
| | POST | `/api/documents/create-document` | JSON | Yes |
| | POST | `/api/documents/update-document` | JSON | Yes |
| | POST | `/api/documents/delete-document` | JSON | Yes |
| **Jams** |
| | POST | `/api/jams/create-jam` | JSON | Yes |
| | POST | `/api/jams/update-jam` | JSON | Yes |
| | POST | `/api/jams/delete-jam` | JSON | Yes |
| **Tags** |
| | POST | `/api/tags/create-tag` | JSON | Yes |
| | POST | `/api/tags/update-tag` | JSON | Yes |
| | POST | `/api/tags/delete-tag` | JSON | Yes |
| **Users** |
| | POST | `/api/users/create-user` | JSON | Yes |
| | POST | `/api/users/update-user` | FormData | Yes |
| | POST | `/api/users/delete-user` | JSON | Yes |
| **File Upload** |
| | POST | `/api/upload` | FormData | Yes |
| **Checkout** |
| | POST | `/api/checkout` | JSON | Yes |
| | POST | `/api/download` | JSON | Yes |

---

### Authentication

#### POST /api/auth/sign-in
**Request**: FormData → JSON (converted by island)
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

**Error Response** (401):
```json
{
  "error": "Invalid credentials"
}
```

#### POST /api/auth/sign-up
**Request**: FormData → JSON (converted by island)
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

**Error Response** (400/500):
```json
{
  "error": "Email already exists"
}
```

---

### Cart Operations

#### POST /api/cart/add
**Request**: JSON
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 1
}
```

**Success Response** (201):
```json
{
  "cartItem": {
    "id": "uuid",
    "cart_id": "uuid",
    "product_id": "uuid",
    "variant_id": "uuid",
    "quantity": 1,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Error Response** (400/500):
```json
{
  "error": "Failed to add item to cart"
}
```

#### POST /api/cart/update
**Request**: JSON
```json
{
  "cartItemId": "uuid",
  "quantity": 2
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

**Note**: Setting `quantity` to 0 or less removes the item

#### POST /api/cart/remove
**Request**: JSON
```json
{
  "cartItemId": "uuid"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

#### POST /api/cart/clear
**Request**: Empty body
**Success Response** (200):
```json
{
  "success": true
}
```

---

### Product Operations

#### POST /api/products/create-product
**Request**: JSON
```json
{
  "title": "My Board Game",
  "description": "An awesome game",
  "status": "draft",
  "tags": ["strategy", "family"]
}
```

**Success Response** (201):
```json
{
  "product": {
    "id": "uuid",
    "handle": "my-board-game",
    "title": "My Board Game",
    "description": "An awesome game",
    "status": "draft",
    "user_id": "uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

#### PUT /api/products/update-product
**Request**: JSON
```json
{
  "productId": "uuid",
  "title": "Updated Title",
  "description": "Updated description",
  "status": "published",
  "tags": ["strategy"],
  "handle": "custom-handle"
}
```

**Success Response** (200):
```json
{
  "product": {
    "id": "uuid",
    "title": "Updated Title",
    ...
  }
}
```

#### POST /api/products/update-product
**Request**: FormData (for file uploads)
```
productId: "uuid"
title: "My Product"
description: "Description"
status: "published"
tags: JSON string ["tag1", "tag2"]
coverImage: File (optional)
```

**Success Response** (200):
```json
{
  "success": true,
  "product": {
    "id": "uuid"
  }
}
```

**Note**: POST handler accepts FormData for cover image uploads. PUT handler accepts JSON for data-only updates.

#### DELETE /api/products/delete-product
**Request**: JSON
```json
{
  "productId": "uuid"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

**Note**: Soft delete - sets `deleted: true` and `deleted_at` timestamp

---

### Product Variant Operations

#### POST /api/products/variants/create
**Request**: JSON
```json
{
  "productId": "uuid",
  "title": "PDF Only",
  "description": "Includes PDF rulebook",
  "sku": "GAME-001-PDF",
  "isDigital": true
}
```

**Success Response** (200):
```json
{
  "success": true,
  "variant": {
    "id": "uuid",
    "product_id": "uuid",
    "title": "PDF Only",
    "sku": "GAME-001-PDF",
    "description": "Includes PDF rulebook",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Note**: If `sku` is not provided, it will be auto-generated from product handle and variant title.

#### POST /api/products/variants/update
**Request**: JSON
```json
{
  "variantId": "uuid",
  "title": "Updated Name",
  "description": "Updated description"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "variant": {
    "id": "uuid",
    "title": "Updated Name",
    ...
  }
}
```

#### POST /api/products/variants/delete
**Request**: JSON
```json
{
  "variantId": "uuid"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

**Note**: Soft delete

#### POST /api/products/variants/link-asset
**Request**: JSON
```json
{
  "variantId": "uuid",
  "assetId": "uuid"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

#### POST /api/products/variants/unlink-asset
**Request**: JSON
```json
{
  "variantId": "uuid",
  "assetId": "uuid"
}
```

**Success Response** (200):
```json
{
  "success": true
}
```

#### POST /api/products/variants/create-price
**Request**: JSON
```json
{
  "variantId": "uuid",
  "currency": "usd",
  "unitAmount": 999,
  "minQuantity": 1,
  "maxQuantity": 10
}
```

**Success Response** (200):
```json
{
  "success": true,
  "price": {
    "id": "uuid",
    "variant_id": "uuid",
    "currency": "usd",
    "unit_amount": 999,
    "min_quantity": 1,
    "max_quantity": 10,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Note**: `unitAmount` is in cents (e.g., 999 = $9.99). `maxQuantity` is optional (null = unlimited).

---

### User Operations

#### POST /api/users/update-user
**Request**: FormData → JSON (converted by island)
```json
{
  "handle": "my-handle",
  "name": "My Name",
  "bio": "My bio",
  "avatar_url": "https://..."
}
```

**Success Response** (200):
```json
{
  "redirect": "/users/my-handle"
}
```

---

### Asset Operations

#### POST /api/assets/create-asset
**Request**: FormData (multipart)
```
title: "My Asset"
description: "Description"
status: "draft"
files: File[]
images: File[]
tags: JSON string
```

**Success Response** (200):
```json
{
  "redirect": "/assets/my-asset-handle"
}
```

---

### Checkout

#### POST /api/checkout
**Request**: Empty body (uses user's cart)

**Success Response** (200):
```json
{
  "sessionId": "stripe_session_id",
  "url": "https://checkout.stripe.com/..."
}
```

**Error Response** (400):
```json
{
  "error": "Cart is empty"
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

Optional fields for validation errors:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["field"],
      "message": "Field is required"
    }
  ]
}
```

## Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/POST/PATCH/DELETE |
| 201 | Created | Successfully created resource |
| 400 | Bad Request | Validation error, missing required fields |
| 401 | Unauthorized | Not authenticated or invalid session |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected server-side error |

## Response Headers

All JSON responses must include:
```typescript
{
  "Content-Type": "application/json"
}
```

## Island Component Integration

### For JSON APIs
```typescript
const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

if (!response.ok) {
  const error = await response.json();
  setError(error.error || "Operation failed");
  return;
}

const result = await response.json();
```

### For FormData APIs (File Uploads)
```typescript
const formData = new FormData();
formData.append("title", title());
formData.append("file", file);

const response = await fetch("/api/endpoint", {
  method: "POST",
  body: formData, // No Content-Type header - browser sets it
});

if (!response.ok) {
  const error = await response.json();
  setError(error.error || "Upload failed");
  return;
}

const result = await response.json();
```

### File Uploads

#### POST /api/upload
**Request**: FormData
- `file`: File (required)
- `bucket`: String - one of: `asset-files`, `asset-images`, `product-images`, `user-avatars`, `documents`
- `prefix`: String (optional) - subdirectory prefix (e.g., productId, assetId)

**Validation Rules by Bucket:**

| Bucket | Allowed Types | Max Size |
|--------|--------------|----------|
| `asset-files` | Images, PDFs, ZIPs, 3D models (STL, OBJ, GLTF) | 100MB |
| `asset-images` | Images (JPEG, PNG, GIF, WebP) | 10MB |
| `product-images` | Images (JPEG, PNG, GIF, WebP) | 10MB |
| `user-avatars` | Images (JPEG, PNG, GIF, WebP) | 5MB |
| `documents` | PDFs | 50MB |

**Success Response** (200):
```json
{
  "success": true,
  "file": {
    "path": "userId/prefix/filename-timestamp.ext",
    "url": "https://storage.url/bucket/path",
    "size": 1024,
    "type": "image/png"
  }
}
```

**Error Responses**:
- `400`: Invalid file type/size or missing file
- `401`: Not authenticated
- `500`: Upload failed

**Example Usage (FileUpload component)**:
```tsx
<FileUpload
  label="Product Cover Image"
  name="cover_image"
  bucket="product-images"
  prefix={productId}
  accept="image/*"
  maxSizeMB={10}
  showPreview
  onUploadComplete={(files) => {
    // files[0].url contains the uploaded file URL
    setCoverImageUrl(files[0].url);
  }}
/>
```

**Example Usage (Manual)**:
```tsx
const formData = new FormData();
formData.append("file", file);
formData.append("bucket", "user-avatars");

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

if (response.ok) {
  const data = await response.json();
  const fileUrl = data.file.url;
}
```

## Migration Checklist

When converting a page to use an island:

- [ ] Create API endpoint if it doesn't exist
- [ ] Ensure API returns JSON (not redirects)
- [ ] Add Zod validation
- [ ] Create island component
- [ ] Update page to use island with `client:load`
- [ ] Test error handling
- [ ] Test loading states
- [ ] Verify redirects work client-side

## Summary

**Key Principles:**
1. **All responses are JSON** (no redirects from API endpoints)
2. **JSON for data, FormData for files**
3. **Consistent error format**
4. **Zod validation for all inputs**
5. **Islands handle redirects client-side**
