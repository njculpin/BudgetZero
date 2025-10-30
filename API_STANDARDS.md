# API Standards & Contract Documentation

## Overview
This document defines the API contract standards for all endpoints in the Game Loopers application.

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
