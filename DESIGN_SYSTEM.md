# Game Loopers Design System

**Version**: 1.2
**Last Updated**: 2025-12-11
**Framework**: Astro 5.15 + SolidJS Islands

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Business Rules](#business-rules)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [BEM CSS Methodology](#bem-css-methodology)
8. [Accessibility Standards](#accessibility-standards)
9. [Responsive Design](#responsive-design)

---

## Design Principles

### 1. **Clarity Over Cleverness**
- Interfaces should be immediately understandable
- Minimize cognitive load for creators and buyers
- Use conventional patterns (don't reinvent UI)

### 2. **Content First**
- Design serves content, not the other way around
- Creator work (products, assets) is the star
- UI should stay out of the way

### 3. **Progressive Disclosure**
- Show essential information first
- Hide complexity until needed
- Use modals/popovers for secondary actions

### 4. **Accessible by Default**
- WCAG 2.1 Level AA compliance minimum
- Keyboard navigation for all interactive elements
- Screen reader support built into components

---

## Business Rules

### Product Status & Embeddability System

Game Loopers implements a unified **product-centric** system where products contain files and can be embedded in other products.

#### Product Status (4-State)

| Status | Description | Visibility | Use Case |
|--------|-------------|------------|----------|
| `draft` | Work in progress, not ready for any use | Owner only | Initial creation, active editing |
| `private` | Ready but restricted to owner's use only | Owner only | Testing, internal products, owner-exclusive content |
| `unlisted` | Ready for direct purchase but hidden from marketplace | Anyone with link | Pre-launch, exclusive access, beta testing |
| `public` | Ready for sale and visible in marketplace | Public listings + search | General release, maximum visibility |

**Status Transitions:**
- Products start as `draft` on creation
- Can move to `private` for owner-only use (still hidden from marketplace)
- Can move to `unlisted` for link-only access (purchasable but not discoverable)
- Move to `public` when ready for full marketplace visibility
- Any status can transition to any other status based on creator needs

#### Product Embeddability

Products have an `is_embeddable` boolean flag that determines if they can be used as components in other products:

**Embeddable Products** (`is_embeddable=true`):
- Can be embedded in other products as components
- Creator earns royalties when embedded (captured at link time in `product_components.royalty_amount_cents`)
- Can still be sold directly with `direct_sale_price_cents`
- Example: STL file product, illustration pack, map tiles

**Non-Embeddable Products** (`is_embeddable=false`):
- Complete products sold as standalone items only
- Cannot be used as components in other products
- Example: Full game package, complete adventure module

#### Product Files

Products can have multiple files attached (`product_files` table):
- **ProductFiles**: Downloadable content (PDFs, STLs, images, ZIP archives)
- Each file has title, description, file_url, storage_path, mime_type
- Files are ordered by `position` field
- All files are included when product is purchased

#### Product Components (Embedding)

Products can embed other products via the `product_components` table:
- Links a **parent variant** to a **child product**
- Captures royalty amount at link time (ensures price stability)
- Child product owner earns royalty on every sale of parent product
- Enables collaborative revenue sharing across creators

**Example:**
```
Parent Product: "Fantasy RPG Starter Kit" ($25)
├── Component: "Dragon STL Pack" (royalty: $5)
├── Component: "Character Art Bundle" (royalty: $3)
└── Component: "Battle Map Tiles" (royalty: $2)

Sale Revenue Split:
- Parent creator: $15
- Dragon STL creator: $5
- Character Art creator: $3
- Battle Map creator: $2
```

#### Publishing Validation

**Critical Rule**: Products can only be public if they have either:
1. At least one file (`product_files`), OR
2. At least one embedded component (`product_components`), OR
3. Both files and components

**Why this matters**:
- Prevents empty products from being published
- Ensures customers always receive something when they purchase
- Maintains marketplace quality and trust

**UI Implications**:
- Publish button should be disabled if product has no files and no components
- Clear messaging: "Add files or embed products before publishing"
- Product editor should show file count and component count
- Easy path to add first file or link first component

**Edge Cases Handled**:
- ✅ Products with only files (no components) can be public
- ✅ Products with only components (no direct files) can be public
- ✅ Products can be draft indefinitely while being built
- ✅ Embedded child products can be archived without affecting parent
- ✅ Removing all files/components returns product to draft automatically

**Testing Coverage**:
See `/src/lib/data-access/__tests__/products.test.ts` → Product publishing validation tests

---

## Color System

### Semantic Colors

Game Loopers uses a semantic color system that adapts to light/dark themes.

```css
/* Primary Brand Colors */
--primary: oklch(20% 0 0);          /* Black in light mode */
--primary-foreground: oklch(100% 0 0); /* White text on primary */

/* Secondary Colors */
--secondary: oklch(96% 0 0);        /* Light gray */
--secondary-foreground: oklch(20% 0 0);

/* Destructive (Errors, Delete Actions) */
--destructive: oklch(55% 0.22 25);  /* Red */
--destructive-foreground: oklch(100% 0 0);

/* Accent (Highlights, Hover States) */
--accent: oklch(96% 0 0);
--accent-foreground: oklch(20% 0 0);

/* Background Layers */
--background: oklch(100% 0 0);      /* Page background */
--foreground: oklch(20% 0 0);       /* Primary text */

--card: oklch(100% 0 0);            /* Card backgrounds */
--card-foreground: oklch(20% 0 0);

/* Muted (Low Emphasis) */
--muted: oklch(96% 0 0);            /* Secondary backgrounds */
--muted-foreground: oklch(45% 0 0); /* Secondary text */

/* Borders */
--border: oklch(90% 0 0);           /* Default borders */
--input: oklch(90% 0 0);            /* Input borders */

/* Interactive States */
--ring: oklch(20% 0 0);             /* Focus ring color */
```

### Status Colors

```css
/* Success (Confirmations, Completed States) */
--color-success: oklch(70% 0.15 145);       /* Green */
--color-success-foreground: oklch(100% 0 0);

/* Warning (Cautions, Pending States) */
--color-warning: oklch(75% 0.15 85);        /* Yellow */
--color-warning-foreground: oklch(20% 0 0);

/* Error (Failures, Validation Errors) */
--color-error: oklch(55% 0.22 25);          /* Red */
--color-error-foreground: oklch(100% 0 0);

/* Info (Notifications, Tips) */
--color-info: oklch(60% 0.15 250);          /* Blue */
--color-info-foreground: oklch(100% 0 0);
```

### Color Usage Guidelines

- **Primary**: CTAs, navigation active states, brand elements
- **Secondary**: Alternative buttons, less prominent actions
- **Destructive**: Delete buttons, error states
- **Muted**: Placeholder text, disabled states, secondary info
- **Success**: Confirmation messages, completed purchases
- **Warning**: Drafts, pending reviews, caution notices
- **Error**: Form validation errors, failed operations

---

## Typography

### Font Families

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### Font Sizes

Based on a modular scale (1.25 ratio):

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Typography Scale Usage

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page Title (H1) | 3xl–5xl | bold | tight |
| Section Heading (H2) | 2xl–3xl | semibold | tight |
| Card Heading (H3) | lg–xl | semibold | snug |
| Body Text | base | normal | normal |
| Small Text | sm | normal | normal |
| Caption | xs | normal | normal |

---

## Spacing & Layout

### Spacing Scale (8px Grid)

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
--spacing-4xl: 6rem;     /* 96px */
--spacing-5xl: 8rem;     /* 128px */
--spacing-6xl: 12rem;    /* 192px */
```

### Gap Utilities

```css
--gap-xs: 0.25rem;
--gap-sm: 0.5rem;
--gap-md: 1rem;
--gap-lg: 1.5rem;
--gap-xl: 2rem;
--gap-2xl: 3rem;
```

### Border Radius

```css
--radius-sm: 0.125rem;   /* 2px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-full: 9999px;   /* Fully rounded */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

---

## Components

### Button Component

**Location**: `/src/components/Button.astro`
**BEM Block**: `.button`

#### Variants

```css
.button--primary   /* Black background, white text (main CTAs) */
.button--secondary /* Gray background, dark text (alternative actions) */
.button--ghost     /* Transparent, border only (tertiary actions) */
.button--destructive /* Red background (delete, cancel) */
```

#### Sizes

```css
.button--sm  /* Small: 8px vertical, 16px horizontal */
.button--md  /* Medium (default): 12px vertical, 24px horizontal */
.button--lg  /* Large: 16px vertical, 32px horizontal */
```

#### States

```css
.button:hover            /* Darken background by 10% */
.button:focus-visible    /* 2px outline, --ring color, 2px offset */
.button:disabled         /* 50% opacity, no pointer events */
```

#### Usage

```astro
<Button variant="primary" size="lg">
  <span slot="text">Create Product</span>
</Button>
```

---

### Browse Components (Refactored 2024-11-24)

Shared components for browsing products and jams.

#### BrowseCTA Component

**Location**: `/src/components/BrowseCTA.astro`
**BEM Block**: `.browse-cta`
**Purpose**: Encourage guests to sign in/sign up

```astro
<BrowseCTA message="Sign in to create and sell your digital products" />
```

**Elements**:
- `.browse-cta__text` - Message text
- `.browse-cta__actions` - Button container

#### Browse Search Form

**BEM Block**: `.browse-search` (in `/src/styles/global.css`)

```html
<form class="browse-search">
  <div class="browse-search__wrapper">
    <input class="browse-search__input" name="search" />
    <button class="browse-search__btn">Search</button>
  </div>
  <a class="browse-search__clear">Clear filters</a>
</form>
```

**Elements**:
- `.browse-search__wrapper` - Flex container for input + button
- `.browse-search__input` - Search text input
- `.browse-search__btn` - Submit button
- `.browse-search__clear` - Clear filters link

#### Browse Tag Filters

**BEM Block**: `.browse-tags`

```html
<div class="browse-tags">
  <span class="browse-tags__label">Filter by tag:</span>
  <div class="browse-tags__list">
    <a class="browse-tags__tag browse-tags__tag--active">
      board-game
      <span class="browse-tags__count">(12)</span>
    </a>
  </div>
</div>
```

#### Browse Grid & Cards

**BEM Blocks**: `.browse-grid`, `.browse-card`

```html
<div class="browse-grid">
  <a href="/products/game" class="browse-card">
    <div class="browse-card__content">
      <img class="browse-card__image" />
      <h3 class="browse-card__title">Game Title</h3>
      <p class="browse-card__description">Description...</p>
      <div class="browse-card__meta">
        <span class="browse-card__author">by Creator</span>
      </div>
      <div class="browse-card__footer">
        <span class="browse-card__price">$20.00</span>
      </div>
    </div>
  </a>
</div>
```

---

### Chat Components

**Location**: `/src/components/islands/AssetChat.tsx`, `ProductChat.tsx`
**Framework**: SolidJS (client-side islands)
**BEM Blocks**: `.product-chat`, `.document-chat`

#### Key Features

- Real-time updates via Supabase Realtime
- User avatars with initials fallback
- Loading/empty/error states
- Accessibility: `aria-live="polite"` on message container

#### Elements

```css
.product-chat__messages       /* Message container (aria-live) */
.product-chat__message-row    /* Individual message wrapper */
.product-chat__avatar         /* User avatar circle */
.product-chat__avatar-initials /* Initials when no image */
.product-chat__message        /* Message bubble */
.product-chat__message--own   /* Modifier for user's own messages */
.product-chat__message-author /* Username display */
.product-chat__message-text   /* Message content */
.product-chat__input          /* Chat input field */
.product-chat__submit         /* Send button */
```

---

### Card Component

**Location**: `/src/components/Card.astro`, `CardContent.astro`
**BEM Block**: `.card`

```astro
<Card>
  <CardContent>
    <!-- Content here -->
  </CardContent>
</Card>
```

**Styles**:
```css
.card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl);
}
```

---

## BEM CSS Methodology

Game Loopers follows strict BEM (Block Element Modifier) naming conventions.

### Naming Rules

#### Blocks (Components)

```css
.button { }
.product-card { }
.browse-cta { }
```

- Lowercase
- Hyphens for word separation
- Describes component purpose

#### Elements (Parts of Components)

```css
.button__text { }
.product-card__title { }
.browse-cta__actions { }
```

- Double underscore (`__`) separates block from element
- Lowercase
- Hyphens for word separation

#### Modifiers (Variations)

```css
.button--primary { }
.button--lg { }
.product-card--featured { }
```

- Double hyphen (`--`) separates block/element from modifier
- Lowercase
- Hyphens for word separation

### BEM Best Practices

✅ **DO**:
```css
.browse-card { }
.browse-card__title { }
.browse-card__footer { }
.browse-card--featured { }
```

❌ **DON'T**:
```css
/* Avoid nested BEM */
.browse-card__footer__price { } /* Too deep */

/* Avoid element modifiers */
.browse-card__title--large { } /* Modify block instead */

/* Avoid camelCase or underscores */
.browseCard { }
.browse_card { }
```

### When to Break from BEM

- Global utility classes: `.page`, `.page__container`
- Third-party library classes: `.tiptap`, `.astro-*`
- State classes: `.is-active`, `.has-error` (prefix with `is-` or `has-`)

---

## Accessibility Standards

Game Loopers meets **WCAG 2.1 Level AA** standards minimum.

### Keyboard Navigation

#### Focus Indicators

All interactive elements must have visible focus states:

```css
.button:focus-visible,
.browse-tags__tag:focus-visible,
.browse-pagination__link:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

#### Tab Order

- Tab order must follow visual hierarchy
- Use semantic HTML (`<button>`, `<a>`, `<input>`)
- Avoid `tabindex` > 0 (breaks natural order)
- Hidden content must be `display: none` or `aria-hidden="true"`

#### Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Navigate forward | `Tab` |
| Navigate backward | `Shift + Tab` |
| Activate button/link | `Enter` or `Space` |
| Close modal | `Escape` |
| Submit form | `Enter` (in form fields) |

### Screen Readers

#### ARIA Live Regions

Dynamic content that updates must announce changes:

```tsx
<div class="chat__messages" aria-live="polite" aria-label="Chat messages">
  {/* Messages render here */}
</div>
```

**ARIA Live Politeness**:
- `polite`: Non-urgent updates (chat messages, notifications)
- `assertive`: Urgent updates (errors, warnings)
- `off`: Don't announce (default)

#### ARIA Labels

Provide text alternatives for visual content:

```html
<!-- Icon-only buttons -->
<button aria-label="Delete product">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Search inputs -->
<input
  type="text"
  name="search"
  aria-label="Search products"
  placeholder="Search..."
/>

<!-- Decorative icons -->
<svg aria-hidden="true">
  <circle cx="11" cy="11" r="8" />
</svg>
```

### Color Contrast

All text must meet minimum contrast ratios:

- **Body text** (< 18px): 4.5:1
- **Large text** (≥ 18px or ≥ 14px bold): 3:1
- **UI components**: 3:1 against adjacent colors

**Testing**: Use browser DevTools Lighthouse or axe DevTools.

### Focus Management

#### Modals & Dialogs

When opening a modal:
1. Move focus to first focusable element
2. Trap focus inside modal (Tab cycles through modal only)
3. Return focus to trigger element on close
4. Close on `Escape` key

```tsx
// Example: ConfirmDialog.tsx implements focus trapping
<dialog ref={dialogRef} role="dialog" aria-modal="true">
  <button onClick={onCancel}>Cancel</button>
  <button onClick={onConfirm}>Confirm</button>
</dialog>
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile-first approach */
@media (max-width: 480px)  { /* Small phones */ }
@media (max-width: 768px)  { /* Tablets */ }
@media (max-width: 1024px) { /* Small desktops */ }
@media (min-width: 1280px) { /* Large desktops */ }
```

### Layout Patterns

#### Browse Grid Responsiveness

```css
.browse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--gap-xl);
}

@media (max-width: 768px) {
  .browse-grid {
    grid-template-columns: 1fr; /* Single column on mobile */
  }
}
```

#### Navigation Responsiveness

```css
/* Desktop: Horizontal nav */
.navigation__links {
  display: flex;
  gap: var(--gap-lg);
}

/* Mobile: Hamburger menu */
@media (max-width: 768px) {
  .navigation__toggle {
    display: block; /* Show hamburger */
  }

  .navigation__links {
    display: none; /* Hide by default */
  }

  .navigation__links--open {
    display: flex;
    flex-direction: column;
  }
}
```

#### Browse CTA Buttons

```css
.browse-cta__actions {
  display: flex;
  gap: var(--gap-lg);
}

@media (max-width: 480px) {
  .browse-cta__actions {
    flex-direction: column; /* Stack buttons vertically */
  }

  .browse-cta__actions .button {
    width: 100%; /* Full-width buttons */
  }
}
```

---

## Component Inventory

| Component | Location | BEM Block | Description |
|-----------|----------|-----------|-------------|
| Button | `/src/components/Button.astro` | `.button` | Primary interactive element |
| Card | `/src/components/Card.astro` | `.card` | Container for grouped content |
| BrowseCTA | `/src/components/BrowseCTA.astro` | `.browse-cta` | Guest user call-to-action |
| PageHeader | `/src/components/PageHeader.astro` | `.page-header` | Page title + description |
| AssetChat | `/src/components/islands/AssetChat.tsx` | `.asset-chat` | Real-time asset chat |
| ProductChat | `/src/components/islands/ProductChat.tsx` | `.product-chat` | Real-time product chat |
| DocumentChat | `/src/components/islands/DocumentChat.tsx` | `.document-chat` | Real-time document chat |
| ConfirmDialog | `/src/components/islands/ConfirmDialog.tsx` | `.confirm-dialog` | Modal confirmation |
| Navigation | `/src/components/Navigation.astro` | `.navigation` | Main site navigation |

### Browse Page Shared Classes

Defined in `/src/styles/global.css` (as of 2024-11-24):

- `.browse-search` - Search form
- `.browse-tags` - Tag filter list
- `.browse-grid` - Product/asset grid
- `.browse-card` - Individual item card
- `.browse-empty` - Empty state message
- `.browse-pagination` - Page navigation

**Used by**: `/src/pages/products/index.astro`, `/src/pages/assets/index.astro`, `/src/pages/jams/index.astro`

---

## Migration Notes

### Recent Changes (2025-12-11)

1. **Product Status System (4-State)**:
   - Upgraded from 3-state (`draft`, `public`, `archived`) to 4-state system
   - **New statuses**: `private` (owner-only, hidden from marketplace) and `unlisted` (purchasable via direct link, hidden from listings)
   - **Use cases**:
     - `draft`: Initial creation, active development
     - `private`: Testing, internal-only products, owner-exclusive content
     - `unlisted`: Pre-launch access, beta testing, exclusive links
     - `public`: Full marketplace visibility
   - **UX Impact**: Creators now have granular control over product visibility without needing to delete or archive
   - Component updated: `ProductStatusEditor.tsx` implements 4-state selector
   - Database field: `products.status` enum type updated

### Previous Changes (2025-11-25)

1. **Asset Status System (4-State)**:
   - Implemented 4-state asset status system: `draft`, `private`, `public`, `archived`
   - **Private assets**: Exclusive to owner's products (default after publishing from draft)
   - **Public assets**: Visible in marketplace, usable by all users (with royalties)
   - Added database validation: Products can only be public if assets are `private` OR `public` (not draft/archived)
   - Database trigger: `validate_product_asset_status_trigger` enforces asset readiness before product publish
   - RLS policies updated: Only `public` assets viewable by everyone; `private` assets owner-only
   - Migration file: `20251125_add_asset_status_validation.sql` (includes data migration: `public` → `private`)
   - P0 security tests: 14 comprehensive tests covering all edge cases and both private/public scenarios
   - **Business Rule**: Creators must set assets to private or public before publishing products (prevents customers from purchasing products with unavailable downloads)

### Previous Changes (2024-11-24)

1. **DRY CSS Refactor**: Consolidated ~855 lines of duplicate CSS from browse pages into shared `.browse-*` classes in `global.css`

2. **Accessibility Improvements**:
   - Added `aria-live="polite"` to chat message containers
   - Added `aria-hidden="true"` to decorative SVG icons
   - Fixed invalid HTML (button inside anchor) in BrowseCTA

3. **Security Fixes**:
   - Product status filter: Only `status='public'` products visible publicly
   - Payout balance query: Correctly filters `status='ready_to_pay'` royalties

---

## Future Considerations

### Dark Mode

Color tokens are prepared for dark mode (using `oklch()` color space). To implement:

1. Add `data-theme="dark"` attribute to `<html>`
2. Update CSS variables in `@media (prefers-color-scheme: dark)`
3. Add theme toggle component

### Animation System

Consider adding motion tokens:

```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Icon System

Currently using inline SVGs. Consider:
- Icon component library (Heroicons, Lucide)
- SVG sprite sheet for performance
- Consistent sizing (`16px`, `20px`, `24px`)

---

## Resources

- **BEM Methodology**: [getbem.com](https://getbem.com)
- **WCAG 2.1 Guidelines**: [w3.org/WAI/WCAG21/quickref](https://www.w3.org/WAI/WCAG21/quickref/)
- **Color Contrast Checker**: [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/)
- **Astro Docs**: [docs.astro.build](https://docs.astro.build)
- **SolidJS Docs**: [solidjs.com/docs](https://www.solidjs.com/docs/latest)

---

**Questions?** Contact the design team or refer to existing components in `/src/components/` for reference implementations.
