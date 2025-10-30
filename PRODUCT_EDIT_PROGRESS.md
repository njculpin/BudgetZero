# Product Edit Page Conversion - Progress Report

## ✅ Completed: API Endpoints

All necessary API endpoints have been created and are ready to use:

### Product Operations
- ✅ **POST `/api/products/update-product`** - Update product with FormData (file upload support)
- ✅ **PUT `/api/products/update-product`** - Update product with JSON (existing)

### Variant Operations
- ✅ **POST `/api/products/variants/create`** - Create new variant
- ✅ **POST `/api/products/variants/update`** - Update variant details
- ✅ **POST `/api/products/variants/delete`** - Delete variant
- ✅ **POST `/api/products/variants/link-asset`** - Link asset to variant
- ✅ **POST `/api/products/variants/unlink-asset`** - Unlink asset from variant
- ✅ **POST `/api/products/variants/create-price`** - Create pricing tier for variant

## 📋 Next Steps: Island Components

### 1. ProductEditForm Island
**Purpose:** Handle basic product information editing with file upload

**Props:**
```typescript
interface ProductEditFormProps {
  productId: string;
  initialData: {
    title: string;
    description: string | null;
    status: "draft" | "published" | "archived";
    coverImageUrl: string | null;
    tags: string[];
  };
  productHandle: string; // For redirect after save
}
```

**Features:**
- Form fields for title, description, status
- TagInput integration for tags
- FileUpload integration for cover image
- Calls POST `/api/products/update-product`
- Success/error feedback
- Page reload on success

### 2. VariantCard Island
**Purpose:** Display and manage a single variant with all its operations

**Props:**
```typescript
interface VariantCardProps {
  variant: {
    id: string;
    title: string;
    description: string | null;
    sku: string;
    is_digital: boolean;
    linkedAssets: Asset[];
    prices: ProductVariantPrice[];
  };
  availableAssets: Asset[];
  onUpdate: () => void; // Callback to refresh parent
}
```

**Features:**
- Display variant info
- Edit variant form (collapsible)
- Delete variant button with confirmation
- Asset linking/unlinking
- Price creation form (collapsible)
- Price list display
- All using the new API endpoints

### 3. VariantCreateForm Island
**Purpose:** Form to create new variants

**Props:**
```typescript
interface VariantCreateFormProps {
  productId: string;
  onSuccess: () => void;
}
```

**Features:**
- Form fields for name, SKU, description, digital flag
- Calls POST `/api/products/variants/create`
- Success callback to refresh parent

## 📝 Implementation Pattern

All islands should follow this pattern:

```typescript
import { createSignal } from "solid-js";
import { FormField, LoadingButton, ErrorMessage, SuccessMessage } from "./base";

export default function MyIsland(props: MyIslandProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Operation failed");
        setIsLoading(false);
        return;
      }

      setSuccess("Operation successful!");
      setIsLoading(false);

      // Trigger callback or refresh
      if (props.onSuccess) {
        props.onSuccess();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error() && <ErrorMessage message={error()} onDismiss={() => setError("")} />}
      {success() && <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />}

      {/* Form fields */}

      <LoadingButton
        type="submit"
        isLoading={isLoading()}
        loadingText="Saving..."
      >
        Save
      </LoadingButton>
    </form>
  );
}
```

## 🎯 Page Update Strategy

Once islands are created, update `/src/pages/products/[product]/edit.astro`:

1. **Remove** all server-side form handling (lines 72-248)
2. **Import** the new island components
3. **Replace** the basic info form with `<ProductEditForm client:load />`
4. **Replace** the variant section with islands:
   - Map variants to `<VariantCard client:load />` components
   - Add `<VariantCreateForm client:load />` for new variants
5. **Remove** success/error query param handling (handled in islands)
6. **Simplify** page to just:
   - Auth check
   - Data fetching
   - Layout with islands

## 📊 Current File Structure

```
src/
├── pages/
│   ├── api/
│   │   └── products/
│   │       ├── update-product.ts ✅
│   │       └── variants/
│   │           ├── create.ts ✅
│   │           ├── update.ts ✅
│   │           ├── delete.ts ✅
│   │           ├── link-asset.ts ✅
│   │           ├── unlink-asset.ts ✅
│   │           └── create-price.ts ✅
│   └── products/
│       └── [product]/
│           └── edit.astro (needs update)
└── components/
    └── islands/
        ├── ProductEditForm.tsx (to create)
        ├── VariantCard.tsx (to create)
        └── VariantCreateForm.tsx (to create)
```

## ⏱️ Estimated Time to Complete

- **ProductEditForm**: 30-45 minutes
- **VariantCard**: 1-2 hours (most complex)
- **VariantCreateForm**: 20-30 minutes
- **Page Update**: 30 minutes
- **Testing & Bug Fixes**: 1 hour

**Total**: ~4-5 hours

## 🚀 Benefits After Completion

1. ✅ No full page reloads - better UX
2. ✅ Inline error handling
3. ✅ Loading states for all operations
4. ✅ File upload with progress
5. ✅ Consistent with other pages (cart, auth, etc.)
6. ✅ Type-safe with no `any` types
7. ✅ Follows API standards
8. ✅ Ready for further enhancements (image cropping, drag-drop reordering, etc.)
