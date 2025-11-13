# Game Loopers Design System

**Version**: 2.0.0
**Last Updated**: January 2025
**Status**: Production Ready

## Table of Contents
1. [Introduction](#introduction)
2. [Design Principles](#design-principles)
3. [Complete Token Reference](#complete-token-reference)
4. [Typography System](#typography-system)
5. [Color System](#color-system)
6. [Spacing System](#spacing-system)
7. [Component Tokens](#component-tokens)
8. [BEM Methodology](#bem-methodology)
9. [Component Patterns](#component-patterns)
10. [Accessibility Guidelines](#accessibility-guidelines)
11. [Dark Mode](#dark-mode)
12. [Migration Guide](#migration-guide)

---

## Introduction

Game Loopers uses a **comprehensive token-based design system** with BEM (Block Element Modifier) CSS methodology. All design tokens are defined in `/src/styles/global.css` as CSS custom properties and must be used exclusively—no hardcoded values.

### Key Technologies
- **CSS Architecture**: BEM (Block Element Modifier)
- **Design Tokens**: CSS Custom Properties (480+ tokens)
- **Styling**: Scoped CSS in Astro components, BEM for SolidJS islands
- **Font**: Inter (sans-serif)
- **Color Model**: OKLCH for better perceptual uniformity and dark mode

### Design System Philosophy

**1. Token-First Approach**: Every visual property must use a design token. Hardcoded values are forbidden.

**2. Semantic Naming**: Tokens use descriptive, semantic names that communicate intent:
- `--primary` (core semantic token for brand color)
- `--color-success` (status-specific semantic token)
- `--button-height-md` (component-specific semantic token)

**3. Composability**: Tokens build on each other:
```css
--button-padding-x-md: var(--spacing-2xl); /* Composed from spacing token */
--card-border: var(--border-default); /* Composed from border tokens */
```

**4. Accessibility First**: All tokens ensure WCAG 2.1 AA compliance minimum.

---

## Design Principles

### 1. Consistency
- **Always use design tokens**—never hardcode values
- Follow BEM naming conventions strictly
- Maintain consistent spacing, sizing, and visual hierarchy across all components

### 2. Scalability
- Components must be composable and reusable
- Design tokens enable easy theming and global changes
- BEM prevents CSS specificity conflicts

### 3. Accessibility
- WCAG 2.1 AA compliance minimum (4.5:1 contrast for text)
- Semantic HTML structure required
- Keyboard navigation support mandatory
- Screen reader friendly patterns
- Visible focus states on all interactive elements

### 4. Performance
- Minimize CSS specificity
- Avoid inline styles (except dynamic values passed as CSS custom properties)
- Use CSS custom properties for runtime theming

---

## Complete Token Reference

### Core Semantic Colors

```css
/* Primary Brand Colors */
--background: oklch(1 0 0)              /* Pure white background */
--foreground: oklch(0.145 0 0)          /* Near black text */
--primary: oklch(0.205 0 0)             /* Primary action color */
--primary-foreground: oklch(0.985 0 0)  /* Text on primary */

/* Secondary & Muted */
--secondary: oklch(0.97 0 0)
--secondary-foreground: oklch(0.205 0 0)
--muted: oklch(0.97 0 0)                /* Subtle backgrounds */
--muted-foreground: oklch(0.556 0 0)    /* De-emphasized text */

/* Accent & Destructive */
--accent: oklch(0.696 0.17 162.48)      /* Highlights, featured content */
--accent-foreground: oklch(0.985 0 0)
--destructive: oklch(0.577 0.245 27.325) /* Errors, delete actions */
--destructive-foreground: var(--color-white)

/* UI Element Colors */
--card: oklch(1 0 0)                    /* Card backgrounds */
--card-foreground: oklch(0.145 0 0)
--border: oklch(0.922 0 0)              /* Standard borders */
--input: oklch(0.922 0 0)               /* Input borders */
--ring: oklch(0.708 0 0)                /* Focus ring color */
```

### Status Colors

```css
/* Success */
--color-success: oklch(0.577 0.15 145)
--color-success-foreground: oklch(0.985 0 0)

/* Warning */
--color-warning: oklch(0.828 0.189 84.429)
--color-warning-foreground: oklch(0.145 0 0)

/* Info */
--color-info: oklch(0.6 0.118 184.704)
--color-info-foreground: oklch(0.985 0 0)

/* Error (alias) */
--color-error: var(--destructive)
```

**Usage**:
```css
/* ✅ Good */
.alert--success {
  background-color: oklch(from var(--color-success) l c h / 0.1);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

/* ❌ Bad */
.alert--success {
  background-color: rgba(34, 197, 94, 0.1); /* Hardcoded */
  color: #22c55e; /* Hardcoded */
}
```

### Interactive Colors

```css
--color-link: var(--primary)
--color-link-hover: oklch(from var(--primary) calc(l * 0.85) c h)
--color-link-visited: oklch(from var(--primary) calc(l * 0.75) c h)
```

### Overlay Colors

```css
--overlay-light: oklch(0 0 0 / 0.1)    /* 10% black overlay */
--overlay-medium: oklch(0 0 0 / 0.3)   /* 30% black overlay */
--overlay-dark: oklch(0 0 0 / 0.7)     /* 70% black overlay */
```

### Typography Tokens

```css
/* Font Sizes */
--text-xs: 0.75rem      /* 12px - Labels, captions */
--text-sm: 0.875rem     /* 14px - Body small, helper text */
--text-base: 1rem       /* 16px - Default body text */
--text-lg: 1.125rem     /* 18px - Subheadings */
--text-xl: 1.25rem      /* 20px - Card titles */
--text-2xl: 1.5rem      /* 24px - Section titles */
--text-3xl: 1.875rem    /* 30px - Page titles */
--text-4xl: 2.25rem     /* 36px - Hero titles */
--text-5xl: 3rem        /* 48px - Display text */
--text-6xl: 3.75rem     /* 60px - Large display */
--text-7xl: 4.5rem      /* 72px */
--text-8xl: 6rem        /* 96px */
--text-9xl: 8rem        /* 128px */

/* Font Weights */
--font-weight-thin: 100
--font-weight-extralight: 200
--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
--font-weight-extrabold: 800
--font-weight-black: 900

/* Line Heights */
--leading-tight: 1.25
--leading-snug: 1.375
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2

/* Letter Spacing */
--tracking-tighter: -0.05em
--tracking-tight: -0.025em
--tracking-normal: 0em
--tracking-wide: 0.025em
--tracking-wider: 0.05em
--tracking-widest: 0.1em
```

### Spacing Tokens

```css
/* Gap (for flex/grid layouts) */
--gap-xxs: 0.25rem     /* 4px */
--gap-xs: 0.5rem       /* 8px */
--gap-sm: 0.625rem     /* 10px */
--gap-md: 0.75rem      /* 12px */
--gap-lg: 1rem         /* 16px */
--gap-xl: 1.5rem       /* 24px */
--gap-2xl: 2rem        /* 32px */

/* Spacing (for padding/margin) */
--spacing-xxs: 0.25rem  /* 4px */
--spacing-xs: 0.375rem  /* 6px */
--spacing-sm: 0.5rem    /* 8px */
--spacing-md: 0.625rem  /* 10px */
--spacing-lg: 0.75rem   /* 12px */
--spacing-xl: 0.875rem  /* 14px */
--spacing-2xl: 1rem     /* 16px - Most common */
--spacing-3xl: 1.5rem   /* 24px - Section spacing */
--spacing-4xl: 2rem     /* 32px - Large sections */
--spacing-5xl: 3rem     /* 48px - Hero padding */
--spacing-6xl: 4rem     /* 64px - Page sections */
```

**When to use gap vs spacing**:
- Use `--gap-*` for `gap` property in flex/grid layouts
- Use `--spacing-*` for `padding` and `margin`

### Border Tokens

```css
/* Border Widths */
--border-width-none: 0
--border-width-thin: 1px      /* Standard borders */
--border-width-medium: 2px    /* Emphasized borders */
--border-width-thick: 3px     /* Strong emphasis */

/* Border Styles (Semantic - Use These!) */
--border-default: var(--border-width-thin) solid var(--border)
--border-emphasis: var(--border-width-medium) solid var(--border)
--border-strong: var(--border-width-thick) solid var(--primary)
--border-dashed: var(--border-width-thin) dashed var(--border)

/* Border Radius */
--radius-xs: 0.125rem    /* 2px - Tight corners */
--radius-sm: 0.25rem     /* 4px - Subtle */
--radius-md: 0.375rem    /* 6px - Standard */
--radius-lg: 0.5rem      /* 8px - Cards, buttons */
--radius-xl: 0.75rem     /* 12px - Large cards */
--radius-2xl: 1rem       /* 16px - Modals */
--radius-3xl: 1.5rem     /* 24px */
--radius-4xl: 2rem       /* 32px */
--radius-full: 9999px    /* Pills, badges */
```

**Usage**:
```css
/* ✅ Good - Use semantic border tokens */
.card {
  border: var(--border-default);
  border-radius: var(--radius-xl);
}

/* ❌ Bad - Hardcoded values */
.card {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}
```

### Opacity Scale

```css
--opacity-0: 0
--opacity-5: 0.05
--opacity-10: 0.1
--opacity-20: 0.2
--opacity-30: 0.3
--opacity-40: 0.4
--opacity-50: 0.5
--opacity-60: 0.6
--opacity-70: 0.7
--opacity-80: 0.8
--opacity-90: 0.9
--opacity-95: 0.95
--opacity-100: 1

/* Semantic Opacity */
--opacity-disabled: var(--opacity-50)
```

### Shadow System

```css
/* Box Shadows (Elevation) */
--shadow-2xs: 0 1px rgb(0 0 0 / 0.05)
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)

/* Inset Shadows */
--inset-shadow-2xs: inset 0 1px rgb(0 0 0 / 0.05)
--inset-shadow-xs: inset 0 1px 1px rgb(0 0 0 / 0.05)
--inset-shadow-sm: inset 0 2px 4px rgb(0 0 0 / 0.05)
```

### Transition Tokens

```css
/* Durations */
--duration-fastest: 75ms
--duration-fast: 150ms
--duration-normal: 200ms
--duration-slow: 300ms
--duration-slower: 500ms

/* Easing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Focus Tokens

```css
--focus-ring-width: 2px
--focus-ring-offset: 2px
--focus-ring-color: var(--ring)
--focus-ring-opacity: var(--opacity-20)
--focus-shadow: 0 0 0 3px oklch(from var(--ring) l c h / var(--focus-ring-opacity))
```

**Standard Focus State Pattern**:
```css
.interactive-element:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  box-shadow: var(--focus-shadow);
}
```

### Icon Sizes

```css
--icon-size-xs: 0.875rem   /* 14px */
--icon-size-sm: 1rem       /* 16px */
--icon-size-md: 1.25rem    /* 20px */
--icon-size-lg: 1.5rem     /* 24px */
--icon-size-xl: 2rem       /* 32px */
--icon-size-2xl: 2.5rem    /* 40px */
--icon-size-3xl: 3rem      /* 48px */
```

### Transform Tokens

```css
--transform-hover-lift: translateY(-1px)
--transform-hover-lift-strong: translateY(-2px)
--transform-active-press: translateY(0)
--transform-scale-hover: scale(1.02)
--transform-scale-hover-strong: scale(1.05)
--transform-scale-active: scale(0.98)
```

### Z-Index Scale

```css
--z-base: 0
--z-dropdown: 1000
--z-sticky: 1100
--z-fixed: 1200
--z-modal-backdrop: 1300
--z-modal: 1400
--z-popover: 1500
--z-tooltip: 1600
```

---

## Component Tokens

Component tokens provide semantic names for common component patterns.

### Button Tokens

```css
--button-height-sm: 2rem
--button-height-md: 2.25rem
--button-height-lg: 2.5rem
--button-height-xl: 3rem
--button-padding-x-sm: var(--spacing-lg)
--button-padding-x-md: var(--spacing-2xl)
--button-padding-x-lg: var(--spacing-3xl)
--button-gap: var(--gap-xs)
--button-radius: var(--radius-md)
--button-font-weight: var(--font-weight-semibold)
--button-transition: all var(--duration-fast) var(--ease-in-out)
```

**Button Implementation**:
```css
.button {
  height: var(--button-height-md);
  padding: 0 var(--button-padding-x-md);
  gap: var(--button-gap);
  border-radius: var(--button-radius);
  font-weight: var(--button-font-weight);
  transition: var(--button-transition);
}

.button--primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.button--primary:hover {
  background-color: oklch(from var(--primary) calc(l * 0.9) c h);
  transform: var(--transform-hover-lift);
  box-shadow: var(--shadow-md);
}

.button:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}
```

### Input Tokens

```css
--input-height-sm: var(--height-input-sm)
--input-height-md: var(--height-input-md)
--input-height-lg: var(--height-input-lg)
--input-padding-x: var(--spacing-lg)
--input-padding-y: var(--spacing-sm)
--input-border: var(--border-default)
--input-border-focus: var(--border-width-thin) solid var(--ring)
--input-radius: var(--radius-md)
--input-font-size: var(--text-sm)
--input-transition: all var(--duration-normal) var(--ease-in-out)
```

### Card Tokens

```css
--card-padding-sm: var(--spacing-2xl)
--card-padding-md: var(--spacing-3xl)
--card-padding-lg: var(--spacing-4xl)
--card-gap: var(--gap-xl)
--card-radius: var(--radius-xl)
--card-border: var(--border-default)
--card-shadow: var(--shadow-sm)
```

### Badge Tokens

```css
--badge-height: 1.5rem
--badge-padding: var(--spacing-xs) var(--spacing-md)
--badge-radius: var(--radius-full)
--badge-font-size: var(--text-xs)
--badge-font-weight: var(--font-weight-semibold)
```

### Modal/Overlay Tokens

```css
--modal-backdrop: var(--overlay-dark)
--modal-max-width: var(--container-2xl)
--modal-padding: var(--spacing-4xl)
--modal-radius: var(--radius-2xl)
--modal-shadow: var(--shadow-2xl)
```

### Layout Tokens

```css
/* Hero Sections */
--hero-min-height: 300px
--hero-min-height-lg: 400px
--hero-padding: var(--spacing-5xl) var(--spacing-4xl)
--hero-padding-sm: var(--spacing-3xl) var(--spacing-2xl)

/* Grid Columns */
--grid-cols-1: 1fr
--grid-cols-2: repeat(2, 1fr)
--grid-cols-3: repeat(3, 1fr)
--grid-cols-4: repeat(4, 1fr)
--grid-cols-5: repeat(5, 1fr)
--grid-cols-sidebar: 2fr 1fr
```

---

## BEM Methodology

### BEM Structure
```
.block__element--modifier
```

### Rules

1. **Block**: Standalone entity (`.button`, `.card`, `.form-field`)
2. **Element**: Part of block with no standalone meaning (`.button__icon`, `.card__header`)
3. **Modifier**: Flag for appearance/state (`.button--primary`, `.card--elevated`)

### Best Practices

✅ **Good BEM**:
```html
<div class="card card--elevated">
  <div class="card__header">
    <h3 class="card__title">Title</h3>
    <p class="card__description">Description</p>
  </div>
  <div class="card__content">
    <button class="button button--primary button--md">
      <span class="button__icon">+</span>
      <span class="button__text">Add Item</span>
    </button>
  </div>
</div>
```

```css
.card {
  background-color: var(--card);
  border: var(--card-border);
  border-radius: var(--card-radius);
}

.card--elevated {
  box-shadow: var(--shadow-lg);
}

.card__header {
  padding: var(--card-padding-md);
  border-bottom: var(--border-default);
}

.card__title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--foreground);
}
```

❌ **Bad BEM**:
```css
/* Don't nest selectors */
.card .card__header { }

/* Don't go more than 2 levels deep */
.card__header__title__text { }

/* Don't use IDs */
#card { }

/* Don't use descendant selectors */
.card > h3 { }
```

---

## Component Patterns

### Form Fields

```html
<div class="form-field">
  <label class="form-field__label" for="email">
    Email
    <span class="form-field__required">*</span>
  </label>
  <input
    type="email"
    id="email"
    class="form-field__input"
    placeholder="you@example.com"
  />
  <p class="form-field__help">
    We'll never share your email
  </p>
</div>
```

```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.form-field__label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--foreground);
}

.form-field__required {
  color: var(--destructive);
}

.form-field__input {
  height: var(--input-height-md);
  padding: var(--input-padding-y) var(--input-padding-x);
  border: var(--input-border);
  border-radius: var(--input-radius);
  font-size: var(--input-font-size);
  transition: var(--input-transition);
}

.form-field__input:focus-visible {
  border: var(--input-border-focus);
  box-shadow: var(--focus-shadow);
}

.form-field__help {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted-foreground);
}
```

### Status Badges

```html
<span class="badge badge--success">Published</span>
<span class="badge badge--warning">Draft</span>
<span class="badge badge--error">Archived</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  height: var(--badge-height);
  padding: var(--badge-padding);
  border-radius: var(--badge-radius);
  font-size: var(--badge-font-size);
  font-weight: var(--badge-font-weight);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--success {
  background-color: oklch(from var(--color-success) l c h / var(--opacity-20));
  color: var(--color-success);
}

.badge--warning {
  background-color: oklch(from var(--color-warning) l c h / var(--opacity-20));
  color: var(--color-warning);
}

.badge--error {
  background-color: oklch(from var(--destructive) l c h / var(--opacity-20));
  color: var(--destructive);
}
```

### Empty States

```html
<div class="empty-state">
  <div class="empty-state__icon">📦</div>
  <p class="empty-state__text">
    No items found. Create your first item to get started.
  </p>
  <button class="button button--primary">
    <span class="button__text">Create Item</span>
  </button>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap-xl);
  padding: var(--spacing-5xl) var(--spacing-2xl);
  text-align: center;
}

.empty-state__icon {
  font-size: var(--icon-size-2xl);
  color: var(--muted-foreground);
  opacity: var(--opacity-50);
}

.empty-state__text {
  margin: 0;
  font-size: var(--text-base);
  color: var(--muted-foreground);
  max-width: 40ch;
  line-height: var(--leading-relaxed);
}
```

---

## Accessibility Guidelines

### Focus States (MANDATORY)

All interactive elements MUST have visible focus states:

```css
.button:focus-visible,
.link:focus-visible,
.input:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  box-shadow: var(--focus-shadow);
}
```

### Color Contrast

- **Normal text**: 4.5:1 minimum
- **Large text (18px+)**: 3:1 minimum
- **UI components**: 3:1 minimum

Test all color combinations with contrast checkers.

### Semantic HTML

```html
<!-- ✅ Good -->
<button type="button">Click Me</button>
<a href="/page">Navigate</a>
<input type="email" id="email" />
<label for="email">Email</label>

<!-- ❌ Bad -->
<div onclick="...">Click Me</div> <!-- Not keyboard accessible -->
<span class="link">Navigate</span> <!-- Not a real link -->
<input /> <!-- Missing label -->
```

### ARIA Labels

```html
<!-- Form error -->
<input
  id="password"
  type="password"
  aria-invalid="true"
  aria-describedby="password-error"
/>
<p id="password-error" role="alert">
  Password must be at least 8 characters
</p>

<!-- Loading state -->
<button aria-busy="true" disabled>
  <span class="button__text">Loading...</span>
</button>

<!-- Descriptive button -->
<button aria-label="Delete product">
  <span class="button__icon">🗑️</span>
</button>
```

---

## Dark Mode

### Implementation

Dark mode uses the `.dark` class on `<html>`:

```html
<html class="dark">
  <!-- All colors automatically switch -->
</html>
```

### Dark Mode Color Adjustments

The `.dark` class in global.css automatically adjusts all semantic colors:

```css
.dark {
  --background: oklch(0.145 0 0);     /* Near black */
  --foreground: oklch(0.985 0 0);     /* Near white */
  --primary: oklch(0.922 0 0);        /* Lighter for contrast */
  --card-shadow: none;                /* Shadows less visible */
}
```

### Testing Dark Mode

Always test components in both light and dark modes:

```bash
# In browser console
document.documentElement.classList.toggle('dark');
```

---

## Migration Guide

### Replacing Hardcoded Values

**Colors**:
```css
/* ❌ Before */
.card {
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #e5e5e5;
}

/* ✅ After */
.card {
  background-color: var(--card);
  color: var(--card-foreground);
  border: var(--card-border);
}
```

**Spacing**:
```css
/* ❌ Before */
.button {
  padding: 8px 16px;
  margin-bottom: 24px;
}

/* ✅ After */
.button {
  padding: var(--spacing-sm) var(--spacing-2xl);
  margin-bottom: var(--spacing-3xl);
}
```

**Typography**:
```css
/* ❌ Before */
.title {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.5;
}

/* ✅ After */
.title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-normal);
}
```

**Borders**:
```css
/* ❌ Before */
.card {
  border: 2px solid #333;
  border-radius: 12px;
}

/* ✅ After */
.card {
  border: var(--border-emphasis);
  border-radius: var(--radius-xl);
}
```

**Hover States**:
```css
/* ❌ Before */
.button:hover {
  opacity: 0.8;
}

/* ✅ After */
.button--primary:hover {
  background-color: oklch(from var(--primary) calc(l * 0.9) c h);
  transform: var(--transform-hover-lift);
  box-shadow: var(--shadow-md);
}
```

---

## Component Checklist

Before committing new components, verify:

- [ ] Uses BEM naming convention
- [ ] All values use design tokens (no hardcoded px/colors/etc)
- [ ] Span elements have explicit styling or inherit
- [ ] All interactive elements have visible focus states
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Works in both light and dark mode
- [ ] Keyboard accessible (proper tab order)
- [ ] Semantic HTML used
- [ ] No nesting beyond 2 levels (block__element--modifier)
- [ ] Responsive design considered
- [ ] No unused CSS rules

---

## Resources

- **BEM Methodology**: http://getbem.com/
- **OKLCH Color**: https://oklch.com/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/

---

## Quick Reference

### Common Patterns

```css
/* Standard button hover */
.button:hover {
  background-color: oklch(from var(--primary) calc(l * 0.9) c h);
  transform: var(--transform-hover-lift);
  box-shadow: var(--shadow-md);
}

/* Focus state */
.interactive:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Disabled state */
.button:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
  pointer-events: none;
}

/* Card structure */
.card {
  background-color: var(--card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}
```

---

**Version**: 2.0.0
**Last Updated**: January 2025
**Maintained by**: Game Loopers Team
