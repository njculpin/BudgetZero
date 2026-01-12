# Game Loopers Design System

**Version**: 1.5
**Last Updated**: 2025-12-27
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
| `private` | Ready but restricted to owner's use only | Owner + contributors | Testing, internal products, owner-exclusive content |
| `public` | Ready for sale and visible in marketplace | Public listings + search | General release, maximum visibility |
| `archived` | No longer available for sale | Hidden | Removed from marketplace, historical record |

**Status Transitions:**
- Products start as `draft` on creation
- Can move to `private` for owner and contributor access (still hidden from marketplace)
- Move to `public` when ready for full marketplace visibility and sales
- Can move to `archived` to remove from sale while preserving data
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

### Animation System

**New in Version 1.5**: Comprehensive animation tokens for smooth, delightful micro-interactions.

#### Duration Tokens

```css
--duration-fast: 150ms;    /* Quick interactions (hover, focus) */
--duration-normal: 300ms;  /* Standard transitions (modals, dropdowns) */
--duration-slow: 500ms;    /* Emphasis animations (success states) */
```

#### Easing Functions

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Smooth start and end */
--ease-out: cubic-bezier(0, 0, 0.2, 1);          /* Fast start, slow end */
--ease-in: cubic-bezier(0.4, 0, 1, 1);           /* Slow start, fast end */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounce */
```

#### Animation Patterns

**Button Interactions:**
```css
.button {
  transition: all var(--duration-fast) var(--ease-in-out);
}

.button:hover {
  transform: translateY(-2px);
}

.button:active {
  transform: scale(0.98);
}
```

**Modal Entrance:**
```css
.dialog {
  animation: dialog-fade-in var(--duration-normal) var(--ease-out);
}

.dialog__content {
  animation: dialog-scale-in var(--duration-normal) var(--ease-spring);
}

@keyframes dialog-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialog-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Loading Skeletons:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 0%,
    oklch(from var(--muted) calc(l + 0.05) c h) 50%,
    var(--muted) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Success/Error Feedback:**
```css
@keyframes checkmark-draw {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes scale-pop {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

#### Animation Guidelines

1. **Prefer transforms over position** - Use `transform: translateY()` instead of `top/bottom` for better performance
2. **Use will-change sparingly** - Only on elements that will definitely animate
3. **Respect user preferences** - Honor `prefers-reduced-motion` media query
4. **Keep animations subtle** - 2-4px movements, not dramatic effects
5. **Consistent timing** - Use design tokens, not arbitrary durations

**Accessibility:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
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

Shared components for browsing products.

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

### PageHeader Component

**Location**: `/src/components/PageHeader.astro`
**BEM Block**: `.page-header`

**Purpose**: Provides compact, consistent page headers across the application. Replaces bloated hero sections that previously consumed ~250px of vertical space.

**Usage**:
```astro
<PageHeader
  title="Products"
  description="Browse digital products from tabletop creators"
/>
```

**Elements**:
```css
.page-header                    /* Root container */
.page-header__title             /* H1 heading (text-4xl, bold) */
.page-header__description       /* Subtitle (text-lg, muted) */
```

**Styles**:
```css
.page-header {
  text-align: left;
  margin-bottom: var(--spacing-2xl);
}

.page-header__title {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-bold);
}

.page-header__description {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--muted-foreground);
}
```

**Design Decision**: Compact headers improve content density and reduce scrolling. Used consistently on product, document, jam, and create pages.

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

### AddToCartButton Component

**Location**: `/src/components/products/AddToCartButton.tsx`
**Framework**: SolidJS (client-side island)
**BEM Block**: `.add-to-cart`

#### Features

- Adds products to shopping cart with quantity of 1
- Redirects unauthenticated users to sign-in page with return URL
- Success modal with focus management and keyboard navigation
- Loading states during cart operations
- Error handling with inline error messages

#### Elements

```css
.add-to-cart__button           /* Main CTA button */
.add-to-cart__icon             /* Shopping cart SVG icon */
.add-to-cart__text             /* Button label */
.add-to-cart__loading          /* Loading state indicator */
.add-to-cart__error            /* Error message container */

/* Success Modal */
.add-to-cart-modal__overlay    /* Modal background overlay */
.add-to-cart-modal__content    /* Modal card container */
.add-to-cart-modal__header     /* Modal header section */
.add-to-cart-modal__icon-wrapper /* Success checkmark circle */
.add-to-cart-modal__icon       /* Checkmark SVG */
.add-to-cart-modal__title      /* "Added to Cart!" heading */
.add-to-cart-modal__description /* Product name confirmation */
.add-to-cart-modal__actions    /* Button container */
.add-to-cart-modal__button     /* Modal action button */
.add-to-cart-modal__button--primary   /* "View Cart" button */
.add-to-cart-modal__button--secondary /* "Continue Shopping" button */
```

#### Accessibility

- Modal uses `role="dialog"` and `aria-modal="true"`
- Auto-focus on close button when modal opens
- Escape key closes modal
- Screen reader announces modal title via `aria-labelledby`

#### Usage

```tsx
<AddToCartButton
  productId={product.id}
  productTitle={product.title}
  isAuthenticated={!!user}
  client:load
/>
```

---

### ProductDocumentsForm Component

**Location**: `/src/components/products/ProductDocumentsForm.tsx`
**Framework**: SolidJS (client-side island)
**BEM Block**: `.product-documents-form`

#### Features

- Attach existing documents to products
- Create new documents directly from product editor
- Set individual prices for each document (in cents)
- Inline price editing with save/cancel actions
- Remove documents from product
- Modal for selecting documents from user's library
- Empty state with helpful instructions

#### Elements

```css
.product-documents-form                 /* Root container */
.product-documents-form__header         /* Header with add button */
.product-documents-form__add-button     /* "Add Document" button */
.product-documents-form__empty          /* Empty state message */
.product-documents-form__empty-hint     /* Empty state instructions */

/* Document List */
.document-list                          /* Documents container */
.document-list__item                    /* Individual document row */
.document-list__info                    /* Document title/description */
.document-list__title                   /* Document title with link */
.document-list__description             /* Document description */
.document-list__actions                 /* Actions container */
.document-list__price                   /* Price display */
.document-list__price-value             /* Price amount */
.document-list__edit-button             /* "Edit Price" button */
.document-list__price-edit              /* Inline price edit form */
.document-list__price-label             /* Price input label */
.document-list__price-input             /* Price number input */
.document-list__price-actions           /* Save/Cancel buttons */
.document-list__save-price              /* Save button */
.document-list__cancel-price            /* Cancel button */
.document-list__remove-button           /* Remove document button */

/* Modal (see global .modal-* classes) */
.modal-overlay                          /* Background overlay */
.modal-content                          /* Modal card */
.modal-header                           /* Modal header */
.modal-title                            /* Modal heading */
.modal-close                            /* Close button (×) */
.modal-body                             /* Modal content area */
.modal-empty                            /* Empty state in modal */
.modal-create-form                      /* Create document form */
.modal-create-link                      /* "Create new document" button */
```

#### Key Interactions

1. **Add Existing Document**: Opens modal → Select document → Set price → Confirm
2. **Create New Document**: Click "Create a new document" → Auto-creates and adds to product with $0.00 price
3. **Edit Price**: Click "Edit Price" → Inline input appears → Save or Cancel
4. **Remove Document**: Click remove icon → Confirm dialog → Removes from product

#### Usage

```tsx
<ProductDocumentsForm
  productId={product.id}
  userId={user.id}
  existingDocuments={productDocuments}
  client:load
/>
```

---

### ProductContributors Component

**Location**: `/src/components/products/ProductContributors.astro`
**Framework**: Astro (server-side rendered)
**BEM Block**: `.product-contributors`

#### Features

- Displays list of product contributors with avatars
- Links to contributor profile pages
- Hover animation (translates right 4px)
- Empty state when no contributors exist

#### Elements

```css
.product-contributors              /* Root container */
.product-contributors__item        /* Individual contributor link */
.product-contributors__info        /* Name and handle container */
.product-contributors__name        /* Display name */
.product-contributors__handle      /* @username */
.product-contributors__empty       /* Empty state message */
```

#### Usage

```astro
<ProductContributors contributors={collaborators} />
```

---

### ProductPriceBreakdown Component

**Location**: `/src/components/products/ProductPriceBreakdown.tsx`
**Framework**: SolidJS (client-side island)
**BEM Block**: `.price-breakdown`

#### Features

- Fetches and displays itemized pricing for product files, documents, and embedded products
- Shows subtotals for each category (when multiple items exist)
- Calculates and displays total price
- Loading state while fetching data
- Empty state for free products ($0.00 total)
- Creator attribution for embedded products
- Responsive layout (stacks on mobile)

#### Elements

```css
.price-breakdown                        /* Root container */
.price-breakdown__loading               /* Loading indicator */
.price-breakdown__content               /* Main content container */

/* Section (Files/Documents/Embedded) */
.price-breakdown__section               /* Category section */
.price-breakdown__section-title         /* Section heading (Files, Documents, etc.) */

/* Items List */
.price-breakdown__items                 /* Items container */
.price-breakdown__item                  /* Individual item row */
.price-breakdown__item-icon             /* Emoji icon (📄, 📝, 📦) */
.price-breakdown__item-info             /* Name and creator container */
.price-breakdown__item-name             /* Item title */
.price-breakdown__item-creator          /* "by Creator Name" (embedded products only) */
.price-breakdown__item-price            /* Item price */

/* Subtotals */
.price-breakdown__subtotal              /* Category subtotal row */
.price-breakdown__subtotal-label        /* "Files Subtotal" label */
.price-breakdown__subtotal-value        /* Subtotal amount */

/* Total */
.price-breakdown__total                 /* Total price row (bold, primary background) */
.price-breakdown__total-label           /* "TOTAL PRICE" label */
.price-breakdown__total-value           /* Total amount */

/* Empty State */
.price-breakdown__empty                 /* Free product state */
.price-breakdown__empty-icon            /* 💰 emoji */
.price-breakdown__empty-text            /* "Free" heading */
.price-breakdown__empty-hint            /* Explanation text */
```

#### Data Structure

Fetches data from three API endpoints:
- `/api/products/{id}/files` - Product files with individual prices
- `/api/products/{id}/documents` - Attached documents with prices
- `/api/products/{id}/embedded-products` - Embedded products with inherited prices

#### Usage

```tsx
<ProductPriceBreakdown
  productId={product.id}
  client:load
/>
```

---

### ProductStatusEditor Component

**Location**: `/src/components/products/ProductStatusEditor.tsx`
**Framework**: SolidJS (client-side island)
**BEM Block**: `.status-editor`

#### Features

- 4-state product status system: draft, private, public, archived
- Inline status descriptions explaining visibility and purchase availability
- Uses global `.status-badge` component for consistent status display
- Validation messaging for publishing requirements (linked assets must be private or public)
- Auto-reload after status change to update all UI elements
- Disabled state for current status button

#### Status Definitions

| Status | Visibility | Purchasable | Use Case |
|--------|-----------|-------------|----------|
| **Draft** | Owner only | No | Work in progress, not ready for any use |
| **Private** | Owner + contributors | No | Testing, internal-only products |
| **Public** | Everyone | Yes | Listed in marketplace, available for purchase |
| **Archived** | Hidden | No | Removed from marketplace |

#### Elements

```css
.status-editor                          /* Root container */
.status-editor__current                 /* Current status section */
.status-editor__label                   /* Section headings */
.status-editor__description             /* Status description text */
.status-editor__actions                 /* Status change buttons section */
.status-editor__info                    /* Info message box */
.status-editor__info-text               /* Info message content */
.status-editor__button                  /* Status option button */
.status-editor__button--active          /* Current status (disabled) */
.status-editor__button-content          /* Button inner container */
.status-editor__button-description      /* Button subtitle */

/* Uses global status-badge */
.status-badge                           /* Status pill (from global.css) */
.status-badge--draft                    /* Draft modifier */
.status-badge--private                  /* Private modifier */
.status-badge--public                   /* Public modifier */
.status-badge--archived                 /* Archived modifier */
.status-badge--large                    /* Large size modifier */
```

#### Business Rules

**Publishing Validation**: Products can only be set to `public` if:
1. All linked assets are `private` OR `public` status
2. Draft or archived assets will prevent publishing (enforced by database trigger)

#### Usage

```tsx
<ProductStatusEditor
  productId={product.id}
  currentStatus={product.status}
  client:load
/>
```

---

### ProductRevenuePreview Component

**Location**: `/src/components/products/ProductRevenuePreview.tsx`
**Framework**: SolidJS (client-side island)
**BEM Block**: `.revenue-preview`

#### Features

- Shows creators exactly how revenue will be distributed when someone purchases their product
- Displays owner share, contributor royalties, and platform fee (10%)
- Fetches real-time data from product configuration
- Empty state when product has no pricing ($0.00)
- Loading state while fetching data
- Percentage breakdown for each recipient

#### Elements

```css
.revenue-preview                       /* Root container */
.revenue-preview__loading              /* Loading indicator */
.revenue-preview__header               /* Header section */
.revenue-preview__title                /* "Revenue Preview" heading */
.revenue-preview__total                /* Total price display */
.revenue-preview__total-label          /* "Customer Pays:" label */
.revenue-preview__total-value          /* Total amount */
.revenue-preview__description          /* Explanatory text */
.revenue-preview__list                 /* Recipients container */
.revenue-preview__item                 /* Individual recipient row */
.revenue-preview__item--owner          /* Modifier for product owner */
.revenue-preview__item--contributor    /* Modifier for contributors */
.revenue-preview__item--platform       /* Modifier for platform fee */
.revenue-preview__item-info            /* Recipient info container */
.revenue-preview__item-name            /* Recipient name */
.revenue-preview__item-handle          /* @username (contributors only) */
.revenue-preview__item-role            /* Role description */
.revenue-preview__item-amount          /* Amount container */
.revenue-preview__item-price           /* Dollar amount */
.revenue-preview__item-percentage      /* Percentage of total */
.revenue-preview__note                 /* Disclaimer section */
.revenue-preview__note-icon            /* Info icon */
.revenue-preview__note-text            /* Disclaimer text */
.revenue-preview__empty                /* Empty state */
.revenue-preview__empty-icon           /* 💰 emoji */
.revenue-preview__empty-text           /* Instruction text */
```

#### Usage

```tsx
<ProductRevenuePreview
  productId={product.id}
  productOwnerId={product.user_id}
  productOwnerHandle={product.handle}
  productOwnerName={product.owner_name}
  client:load
/>
```

#### Platform Fee Implementation

- **10% Platform Fee**: Deducted from total price (subtotal = total - platform fee)
- **Owner Share**: Subtotal minus all contributor royalties
- **Transparency**: Shows exact dollar amounts and percentages for all recipients
- **Purpose**: Helps creators understand their take-home revenue before publishing

---

### ProductRoyaltyBreakdown Component

**Location**: `/src/components/products/ProductRoyaltyBreakdown.tsx`
**Framework**: SolidJS (client-side island)
**BEM Block**: `.royalty-breakdown`

#### Features

- Similar to ProductRevenuePreview but used in different contexts
- Shows royalty distribution for existing published products
- Used on product detail pages for transparency
- Displays contributor attribution with user profiles

#### Elements

```css
.royalty-breakdown                     /* Root container */
.royalty-breakdown__loading            /* Loading indicator */
.royalty-breakdown__header             /* Header section */
.royalty-breakdown__title              /* "Revenue Breakdown" heading */
.royalty-breakdown__total              /* Total price display */
.royalty-breakdown__list               /* Recipients container */
.royalty-breakdown__item               /* Individual recipient row */
.royalty-breakdown__item--owner        /* Modifier for product owner */
.royalty-breakdown__item--contributor  /* Modifier for contributors */
.royalty-breakdown__item--platform     /* Modifier for platform fee */
.royalty-breakdown__icon               /* User/group SVG icons */
.royalty-breakdown__item-details       /* Recipient details container */
.royalty-breakdown__item-name          /* Recipient name */
.royalty-breakdown__item-handle        /* @username */
.royalty-breakdown__item-role          /* Role description */
.royalty-breakdown__item-price         /* Dollar amount */
.royalty-breakdown__item-percentage    /* Percentage of total */
```

#### Usage

```tsx
<ProductRoyaltyBreakdown
  productId={product.id}
  productOwnerId={product.user_id}
  productOwnerHandle={product.handle}
  productOwnerName={product.owner_name}
  client:load
/>
```

#### Design Decision

These components are core to Game Loopers' value proposition of **revenue transparency**. By showing exactly who gets paid and how much, we differentiate from competitors and build trust with creators.

---

## Component Inventory

| Component | Location | BEM Block | Description |
|-----------|----------|-----------|-------------|
| Button | `/src/components/Button.astro` | `.button` | Primary interactive element |
| Card | `/src/components/Card.astro` | `.card` | Container for grouped content |
| BrowseCTA | `/src/components/BrowseCTA.astro` | `.browse-cta` | Guest user call-to-action |
| PageHeader | `/src/components/PageHeader.astro` | `.page-header` | Compact page title + description |
| ProductChat | `/src/components/products/ProductChat.tsx` | `.product-chat` | Real-time product chat |
| DocumentChat | `/src/components/islands/DocumentChat.tsx` | `.document-chat` | Real-time document chat |
| ConfirmDialog | `/src/components/islands/ConfirmDialog.tsx` | `.confirm-dialog` | Modal confirmation |
| Navigation | `/src/components/Navigation.astro` | `.navigation` | Main site navigation |
| AddToCartButton | `/src/components/products/AddToCartButton.tsx` | `.add-to-cart` | Add product to cart with modal |
| ProductDocumentsForm | `/src/components/products/ProductDocumentsForm.tsx` | `.product-documents-form` | Attach/manage documents on product |
| ProductContributors | `/src/components/products/ProductContributors.astro` | `.product-contributors` | Display product contributors |
| ProductPriceBreakdown | `/src/components/products/ProductPriceBreakdown.tsx` | `.price-breakdown` | Itemized price breakdown (buyer-facing) |
| ProductStatusEditor | `/src/components/products/ProductStatusEditor.tsx` | `.status-editor` | 4-state product status system |
| ProductRevenuePreview | `/src/components/products/ProductRevenuePreview.tsx` | `.revenue-preview` | Revenue calculator for creators |
| ProductRoyaltyBreakdown | `/src/components/products/ProductRoyaltyBreakdown.tsx` | `.royalty-breakdown` | Royalty distribution visualization |

### Browse Page Shared Classes

Defined in `/src/styles/global.css` (as of 2024-11-24):

- `.browse-search` - Search form
- `.browse-tags` - Tag filter list
- `.browse-grid` - Product/asset grid
- `.browse-card` - Individual item card
- `.browse-empty` - Empty state message
- `.browse-pagination` - Page navigation

**Used by**: `/src/pages/products/index.astro`, `/src/pages/assets/index.astro`

---

## Migration Notes

### Recent Changes (2025-12-21)

1. **Compact Page Headers**:
   - **Removed**: Large hero sections that consumed ~250px vertical space
   - **Added**: `PageHeader.astro` component with compact title + description
   - **Impact**: Improved content density, faster access to primary content
   - **Pages affected**: Products, documents, create, user directory
   - **UX Benefit**: Users see actual content faster, less scrolling required

2. **Revenue Transparency Components**:
   - **Added**: `ProductRevenuePreview.tsx` - Creator-facing revenue calculator
   - **Added**: `ProductRoyaltyBreakdown.tsx` - Public royalty distribution display
   - **Platform Fee**: 10% deducted from all sales, clearly shown in breakdown
   - **Purpose**: Core differentiator - show creators and buyers exactly who gets paid
   - **Business Impact**: Builds trust through transparency

### Previous Changes (2025-12-13)

1. **Product Status System (4-State)**:
   - Upgraded from 3-state (`draft`, `public`, `archived`) to 4-state system
   - **New status**: `private` (owner + contributors only, hidden from marketplace)
   - **Use cases**:
     - `draft`: Initial creation, active development, not ready for any use
     - `private`: Testing, internal-only products, owner and contributor access
     - `public`: Full marketplace visibility, available for purchase
     - `archived`: Removed from sale, historical record preserved
   - **UX Impact**: Creators have granular control over product visibility without needing to delete
   - Component updated: `ProductStatusEditor.tsx` implements 4-state selector
   - Database field: `products.status` enum type supports all 4 states

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
