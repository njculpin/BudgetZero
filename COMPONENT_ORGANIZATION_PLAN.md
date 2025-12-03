# Component Organization Plan (Mirrors Pages Directory)

## Strategy

Components are organized to **mirror the pages directory structure**, making it immediately clear where each component is used. Generic/shared components that are used across multiple pages live in the root of `components/`.

## Proposed Structure

```
src/components/
├── Button.astro              # Generic UI - used everywhere
├── Card.astro
├── CardHeader.astro
├── CardTitle.astro
├── CardDescription.astro
├── CardContent.astro
├── CardFooter.astro
├── CardAction.astro
├── Breadcrumb.astro
├── BreadcrumbItem.astro
├── BreadcrumbLink.astro
├── BreadcrumbPage.astro
├── BreadcrumbSeparator.astro
├── BreadcrumbEllipsis.astro
├── Badge.astro
├── Tag.astro
├── TagList.astro
├── Label.astro
├── AlertMessage.astro
├── RatingStars.astro
├── Pagination.astro
├── GalleryGrid.astro
├── Avatar.astro
├── Navigation.astro
├── Footer.astro
├── PageHeader.astro
├── base/                     # Generic base form components (Astro)
│   ├── FormField.astro
│   ├── Input.astro
│   ├── TextArea.astro
│   ├── Select.astro
│   ├── FormActions.astro
│   └── index.ts
├── interactive/              # Generic interactive components (SolidJS)
│   ├── FormField.tsx
│   ├── TextAreaField.tsx
│   ├── SelectField.tsx
│   ├── FileUploadField.tsx
│   ├── LoadingButton.tsx
│   ├── FileUpload.tsx
│   ├── TagInput.tsx
│   ├── ConfirmDialog.tsx
│   ├── ErrorMessage.tsx
│   ├── SuccessMessage.tsx
│   ├── LoadingSpinner.tsx
│   ├── NavigationMobile.tsx
│   ├── EditableBreadcrumb.tsx
│   ├── loading-button.css
│   ├── file-upload.css
│   └── index.ts
│
├── home/                     # /index.astro (landing page)
│   ├── HomeHeroSection.astro
│   ├── HomeFeaturesSection.astro
│   ├── HomeJamsSection.astro
│   ├── HomeSubscribeSection.astro
│   ├── SubscribeForm.tsx
│   ├── BrowseCTA.astro
│   └── index.ts
│
├── auth/                     # /sign-in.astro, /sign-up.astro
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── index.ts
│
├── products/                 # /products/*.astro
│   ├── ProductEditForm.tsx
│   ├── ProductCreateForm.tsx
│   ├── product-create-form.css
│   ├── ProductBasicInfoForm.tsx
│   ├── ProductTagsForm.tsx
│   ├── product-tags-form.css
│   ├── ProductImagesForm.tsx
│   ├── product-images-form.css
│   ├── ProductStatusEditor.tsx
│   ├── ProductDeleteButton.tsx
│   ├── ProductChat.tsx
│   ├── ProductConflictBanner.tsx
│   ├── product-conflict-banner.css
│   ├── ProductReview.astro
│   ├── ProductReviewList.astro
│   ├── ProductVariantManager.tsx
│   ├── product-variant-manager.css
│   ├── ProductVariantEditor.tsx
│   ├── product-variant-editor.css
│   ├── VariantCard.tsx
│   ├── VariantCreateForm.tsx
│   ├── VariantDeleteButton.tsx
│   ├── variant-delete-button.css
│   ├── VariantAssetPicker.tsx
│   ├── variant-asset-picker.css
│   ├── ProductPriceManager.tsx
│   ├── product-price-manager.css
│   ├── ProductValueBreakdown.tsx
│   ├── product-value-breakdown.css
│   ├── ProductCostBreakdown.tsx
│   ├── product-cost-breakdown.css
│   └── index.ts
│
├── assets/                   # /assets/*.astro
│   ├── AssetEditForm.tsx
│   ├── AssetBasicInfoForm.tsx
│   ├── AssetStatusForm.tsx
│   ├── AssetStatusEditor.tsx
│   ├── AssetStatusRequirements.tsx
│   ├── AssetTagsForm.tsx
│   ├── asset-tags-form.css
│   ├── AssetImagesForm.tsx
│   ├── asset-images-form.css
│   ├── AssetFileForm.tsx
│   ├── AssetLicensingForm.tsx
│   ├── AssetDeleteButton.tsx
│   ├── AssetChat.tsx
│   ├── AssetAddToProductForm.tsx
│   ├── AssetProductPicker.tsx
│   ├── AssetRoyaltyManager.tsx
│   ├── asset-royalty-manager.css
│   ├── RoyaltyManagementForm.tsx
│   └── index.ts
│
├── documents/                # /documents/*.astro
│   ├── DocumentEditor.tsx
│   ├── DocumentBasicInfoForm.tsx
│   ├── DocumentDeleteButton.tsx
│   ├── DocumentCreateAssetButton.tsx
│   ├── DocumentChat.tsx
│   ├── PrivacyPolicy.md      # Legal docs (also used in /privacy.astro, /terms.astro)
│   ├── TermsOfService.md
│   ├── StandardLicense.md
│   └── index.ts
│
├── users/                    # /users/*.astro
│   ├── UserEditForm.tsx
│   ├── user-edit-form.css
│   ├── OnboardingWizard.tsx
│   ├── ProfileFooter.astro
│   └── index.ts
│
├── cart/                     # /cart.astro
│   ├── AddToCartButton.tsx
│   ├── CartItemRow.tsx
│   ├── cart-item-row.css
│   └── index.ts
│
├── checkout/                 # /checkout/*.astro
│   ├── CheckoutButton.tsx
│   ├── checkout-button.css
│   └── index.ts
│
├── jams/                     # /jams/*.astro
│   ├── JamHero.astro
│   ├── JamContentSection.astro
│   ├── JamResults.astro
│   ├── JamVoting.tsx
│   └── index.ts
│
├── dashboard/                # /dashboard.astro
│   ├── DashboardContentFilter.tsx
│   └── index.ts
│
├── settings/                 # /settings/*.astro
│   ├── NotificationSettingsForm.tsx
│   └── index.ts
│
├── purchases/                # /purchases/*.astro
│   └── index.ts              # (placeholder for future components)
│
├── payouts/                  # /payouts/*.astro
│   └── index.ts              # (placeholder for future components)
│
├── connect/                  # /connect/*.astro
│   └── index.ts              # (placeholder for future components)
│
├── tags/                     # /tags/*.astro
│   └── index.ts              # (placeholder for future components)
│
├── licenses/                 # /licenses/*.astro (or could reference documents/)
│   └── index.ts
│
├── shared/                   # Components used across multiple page types
│   ├── EntityHero.astro
│   ├── EntityChat.tsx
│   └── index.ts
│
└── notifications/            # Not a page, but used in layout/header
    ├── NotificationCenter.tsx
    ├── notification-center.css
    └── index.ts
```

## Key Principles

1. **Mirror pages/** - Component directories match page routes
2. **Generic components in root** - Button, Card, Breadcrumb, etc. used everywhere
3. **Flat structure where possible** - No deep nesting unless page has subdirectories
4. **Co-located CSS** - CSS files next to component files
5. **Barrel exports** - index.ts in each directory for clean imports

## Import Examples

### Generic Components (Root)
```tsx
import Button from '@/components/Button.astro';
import Card from '@/components/Card.astro';
import { FormField, Input } from '@/components/base';
import { LoadingButton, TagInput } from '@/components/interactive';
```

### Page-Specific Components
```tsx
// In /products/[product].astro
import { ProductEditForm, ProductVariantManager } from '@/components/products';

// In /assets/[asset].astro
import { AssetEditForm, AssetRoyaltyManager } from '@/components/assets';

// In /dashboard.astro
import { DashboardContentFilter } from '@/components/dashboard';
```

## Migration Plan

### Phase 1: Create Directory Structure
1. Create all new directories matching pages structure
2. Add barrel exports (index.ts) to each directory

### Phase 2: Move Components (Domain by Domain)
Start with one page domain at a time:

1. **products/** - Move all Product* and Variant* components
2. **assets/** - Move all Asset* and Royalty* components
3. **documents/** - Move Document* components and legal .md files
4. **users/** - Move User* components
5. **cart/** - Move cart components
6. **checkout/** - Move checkout components
7. **jams/** - Move Jam* components
8. **dashboard/** - Move dashboard components
9. **home/** - Move Home* and landing page components
10. **auth/** - Move LoginForm, RegisterForm
11. **settings/** - Move settings components
12. **notifications/** - Move NotificationCenter
13. **shared/** - Move Entity* and shared components
14. **Generic root** - Organize Button, Card, Breadcrumb, etc. in root

### Phase 3: Update All Imports
1. Update page imports first (most critical)
2. Update component-to-component imports
3. Run build to catch any missing imports

### Phase 4: Cleanup
1. Delete old empty directories (islands/, base/ subdirs)
2. Verify no orphaned files remain
3. Update CLAUDE.md with new structure

## Testing After Each Phase

```bash
npm run build         # Ensure build succeeds
npm run dev          # Verify pages load correctly
```

Test each page route to ensure components load properly.

## Benefits

1. **Immediately obvious where components belong** - If it's used on /products, it goes in components/products/
2. **Easy navigation** - Mirrors mental model of application structure
3. **No guessing** - Clear home for every component based on usage
4. **Scalable** - New pages → new component directories automatically
5. **Clean imports** - Barrel exports keep imports organized
