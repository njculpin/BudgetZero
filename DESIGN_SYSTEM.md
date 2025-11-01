# Game Loopers Design System

**Version**: 1.0.0
**Last Updated**: 2025-01-01
**Status**: Living Document

## Table of Contents
1. [Introduction](#introduction)
2. [Design Principles](#design-principles)
3. [Design Tokens](#design-tokens)
4. [Typography System](#typography-system)
5. [Color System](#color-system)
6. [Spacing System](#spacing-system)
7. [Component Architecture](#component-architecture)
8. [BEM Methodology](#bem-methodology)
9. [Component Patterns](#component-patterns)
10. [Accessibility Guidelines](#accessibility-guidelines)
11. [Dark Mode](#dark-mode)

---

## Introduction

Game Loopers uses a **token-based design system** with BEM (Block Element Modifier) CSS methodology. All design tokens are defined in `src/styles/global.css` as CSS custom properties (variables) and should be used consistently across all components.

### Key Technologies
- **CSS Architecture**: BEM (Block Element Modifier)
- **Design Tokens**: CSS Custom Properties
- **Styling**: Scoped CSS in Astro components, BEM for SolidJS islands
- **Font**: Inter (sans-serif)
- **Color Model**: OKLCH for better perceptual uniformity

---

## Design Principles

### 1. Consistency
- Use design tokens exclusively—never hardcode values
- Follow BEM naming conventions strictly
- Maintain consistent spacing, sizing, and visual hierarchy

### 2. Scalability
- Components should be composable and reusable
- Design tokens enable easy theming and global changes
- BEM prevents CSS specificity conflicts

### 3. Accessibility First
- WCAG 2.1 AA compliance minimum
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly

### 4. Performance
- Minimize CSS specificity
- Avoid inline styles (except dynamic values)
- Use CSS custom properties for runtime theming

---

## Design Tokens

All design tokens are defined in `src/styles/global.css`. **NEVER hardcode these values**—always reference the token.

### Usage Example
```css
/* ❌ Bad - Hardcoded */
.button {
  padding: 16px;
  border-radius: 8px;
  color: #000;
}

/* ✅ Good - Using tokens */
.button {
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  color: var(--foreground);
}
```

---

## Typography System

### Font Stack
```css
--font-family-sans: "Inter", Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
```

### Font Sizes
| Token | Size | Line Height | Use Case |
|-------|------|-------------|----------|
| `--text-xs` | 0.75rem (12px) | 1.33 | Labels, captions |
| `--text-sm` | 0.875rem (14px) | 1.43 | Body small, helper text |
| `--text-base` | 1rem (16px) | 1.5 | Body text |
| `--text-lg` | 1.125rem (18px) | 1.56 | Subheadings |
| `--text-xl` | 1.25rem (20px) | 1.4 | Card titles |
| `--text-2xl` | 1.5rem (24px) | 1.33 | Page titles |
| `--text-3xl` | 1.875rem (30px) | 1.2 | Hero titles |
| `--text-4xl` | 2.25rem (36px) | 1.11 | Large headers |
| `--text-5xl` | 3rem (48px) | 1 | Display text |

### Font Weights
| Token | Value | Use Case |
|-------|-------|----------|
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Emphasis, labels |
| `--font-weight-semibold` | 600 | Subheadings, buttons |
| `--font-weight-bold` | 700 | Headings, important UI |

### Line Heights
```css
--leading-tight: 1.25
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2
```

### Letter Spacing
```css
--tracking-tight: -0.025em
--tracking-normal: 0em
--tracking-wide: 0.025em
```

### Typography Rules
1. **Body text**: `--text-base` with `--font-weight-normal`
2. **Headings**: Use semantic HTML (h1-h6) with appropriate font sizes
3. **Labels**: `--text-sm` with `--font-weight-medium`
4. **Helper text**: `--text-sm` with `--muted-foreground` color
5. **Buttons**: `--text-sm` or `--text-base` with `--font-weight-semibold`

---

## Color System

### Semantic Colors (Light Mode)
```css
--background: oklch(1 0 0)              /* Pure white */
--foreground: oklch(0.145 0 0)          /* Near black for text */
--card: oklch(1 0 0)                    /* Card background */
--muted: oklch(0.97 0 0)                /* Subtle backgrounds */
--muted-foreground: oklch(0.556 0 0)    /* Muted text */
--border: oklch(0.922 0 0)              /* Subtle borders */
--primary: oklch(0.205 0 0)             /* Primary action color */
--accent: oklch(0.696 0.17 162.48)      /* Accent/highlight */
--destructive: oklch(0.577 0.245 27.325) /* Error/danger */
```

### Color Usage Guidelines

#### Primary Actions
```css
/* Primary buttons, links, active states */
background-color: var(--primary);
color: var(--primary-foreground);
```

#### Secondary Actions
```css
/* Secondary buttons, less prominent actions */
background-color: var(--secondary);
color: var(--secondary-foreground);
```

#### Muted/Subtle Elements
```css
/* Disabled states, subtle backgrounds */
background-color: var(--muted);
color: var(--muted-foreground);
```

#### Destructive Actions
```css
/* Delete buttons, error messages */
background-color: var(--destructive);
color: white;
```

#### Borders
```css
/* Standard borders */
border: 1px solid var(--border);
```

### Color Accessibility
- **Contrast ratio**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Primary text**: Always use `var(--foreground)` on `var(--background)`
- **Interactive elements**: Must have clear focus states

---

## Spacing System

### Gap (for flex/grid layouts)
```css
--gap-xxs: 0.25rem  /* 4px */
--gap-xs: 0.5rem    /* 8px */
--gap-sm: 0.625rem  /* 10px */
--gap-md: 0.75rem   /* 12px */
--gap-lg: 1rem      /* 16px */
--gap-xl: 1.5rem    /* 24px */
--gap-2xl: 2rem     /* 32px */
```

### Spacing (for padding/margin)
```css
--spacing-xxs: 0.25rem  /* 4px */
--spacing-xs: 0.375rem  /* 6px */
--spacing-sm: 0.5rem    /* 8px */
--spacing-md: 0.625rem  /* 10px */
--spacing-lg: 0.75rem   /* 12px */
--spacing-xl: 0.875rem  /* 14px */
--spacing-2xl: 1rem     /* 16px */
--spacing-3xl: 1.5rem   /* 24px */
--spacing-4xl: 2rem     /* 32px */
--spacing-5xl: 3rem     /* 48px */
--spacing-6xl: 4rem     /* 64px */
```

### Spacing Scale Usage
- **Tight spacing**: Use `--spacing-xs` to `--spacing-sm` for dense UI
- **Standard spacing**: Use `--spacing-lg` to `--spacing-2xl` for most UI elements
- **Generous spacing**: Use `--spacing-3xl` to `--spacing-5xl` for section separation
- **Large spacing**: Use `--spacing-6xl` for major page sections

### Border Radius
```css
--radius-xs: 0.125rem   /* 2px */
--radius-sm: 0.25rem    /* 4px */
--radius-md: 0.375rem   /* 6px */
--radius-lg: 0.5rem     /* 8px */
--radius-xl: 0.75rem    /* 12px */
--radius-2xl: 1rem      /* 16px */
--radius-full: 9999px   /* Pill shape */
```

### Shadow System
```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

---

## Component Architecture

### File Structure
```
src/
├── components/
│   ├── islands/           # SolidJS interactive components
│   │   ├── base/         # Base form components
│   │   └── *.tsx         # Feature components
│   └── *.astro           # Static Astro components
├── styles/
│   └── global.css        # Design tokens and global styles
└── pages/                # Astro pages with scoped styles
```

### Component CSS Organization
1. **Astro Components**: Scoped `<style>` blocks using BEM
2. **SolidJS Islands**: Import `base/base.css` + component-specific CSS
3. **Global Styles**: Design tokens only in `global.css`

---

## BEM Methodology

### BEM Structure
```
block__element--modifier
```

### Block
The standalone entity that is meaningful on its own.

```css
.button { }
.card { }
.form-field { }
```

### Element
A part of a block that has no standalone meaning.

```css
.button__icon { }
.button__text { }
.card__header { }
.card__content { }
.form-field__label { }
.form-field__input { }
```

### Modifier
A flag on a block or element for appearance, behavior, or state.

```css
.button--primary { }
.button--secondary { }
.button--disabled { }
.card--elevated { }
.form-field__input--error { }
```

### BEM Examples

#### Good BEM Structure
```html
<div class="card">
  <div class="card__header">
    <h2 class="card__title">Title</h2>
    <p class="card__description">Description</p>
  </div>
  <div class="card__content">
    <button class="button button--primary">
      <span class="button__icon">🔥</span>
      <span class="button__text">Click Me</span>
    </button>
  </div>
</div>
```

```css
.card {
  background-color: var(--card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl);
}

.card__header {
  margin-bottom: var(--spacing-2xl);
}

.card__title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--foreground);
  margin: 0;
}

.card__description {
  font-size: var(--text-sm);
  color: var(--muted-foreground);
  margin: var(--spacing-xs) 0 0 0;
}
```

#### Bad Examples (Avoid These)
```css
/* ❌ Too deep nesting */
.card__header__title__text { }

/* ❌ Not following BEM */
.card .header .title { }

/* ❌ Mixing BEM with nested selectors */
.card__header > h2 { }

/* ❌ Using IDs or inline styles */
#card { }
style="padding: 16px"
```

### BEM Best Practices
1. **Flat structure**: Max 2 levels (block__element--modifier)
2. **No nesting**: Avoid `.block .block__element`
3. **Meaningful names**: Be descriptive but concise
4. **Consistent modifiers**: Use same modifier names across blocks
5. **Single responsibility**: One block per component concern

---

## Component Patterns

### Form Fields

#### Standard Input Field
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
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--input);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--foreground);
  background-color: transparent;
}

.form-field__input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 3px oklch(from var(--ring) l c h / 0.2);
}

.form-field__help {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--muted-foreground);
}
```

### Buttons

#### Primary Button
```html
<button class="button button--primary">
  <span class="button__text">Submit</span>
</button>
```

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-sm);
  padding: var(--spacing-md) var(--spacing-3xl);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  border: none;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-in-out);
}

.button--primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.button--primary:hover {
  background-color: oklch(from var(--primary) calc(l * 0.9) c h);
}

.button__text {
  /* Spans need explicit styling */
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}
```

### Cards

```html
<div class="card">
  <div class="card__header">
    <h2 class="card__title">Card Title</h2>
    <p class="card__description">Card description</p>
  </div>
  <div class="card__content">
    Content here
  </div>
</div>
```

```css
.card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.card__header {
  padding: var(--spacing-3xl);
  border-bottom: 1px solid var(--border);
}

.card__title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--foreground);
}

.card__description {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--text-sm);
  color: var(--muted-foreground);
}

.card__content {
  padding: var(--spacing-3xl);
}
```

---

## Accessibility Guidelines

### Semantic HTML
Always use proper semantic elements:
- `<button>` for actions
- `<a>` for navigation
- `<input>`, `<select>`, `<textarea>` for form controls
- `<h1>` - `<h6>` for headings (maintain hierarchy)
- `<main>`, `<nav>`, `<aside>`, `<section>` for layout

### Form Accessibility
```html
<!-- ✅ Good: Associated label -->
<label for="username">Username</label>
<input id="username" type="text" />

<!-- ✅ Good: Helper text with aria-describedby -->
<input
  id="email"
  type="email"
  aria-describedby="email-help"
/>
<p id="email-help">We'll never share your email</p>

<!-- ✅ Good: Error message -->
<input
  id="password"
  type="password"
  aria-invalid="true"
  aria-describedby="password-error"
/>
<p id="password-error" role="alert">
  Password must be at least 8 characters
</p>
```

### Focus States
**All interactive elements MUST have visible focus states.**

```css
.button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.form-field__input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px oklch(from var(--ring) l c h / 0.2);
}
```

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Keyboard Navigation
- Tab order must be logical
- Skip links for main content
- Modal traps focus
- Escape key closes modals/dropdowns

---

## Dark Mode

Dark mode tokens are defined in `.dark` class in `global.css`.

### Usage
```html
<html class="dark">
  <!-- Dark mode active -->
</html>
```

### Dark Mode Colors
All color tokens automatically switch in dark mode:
- `--background` becomes near-black
- `--foreground` becomes near-white
- `--muted` adjusts for dark backgrounds
- Borders use alpha transparency for better blending

### Dark Mode Best Practices
1. **Use semantic tokens**: Never hardcode colors—tokens handle both modes
2. **Test in both modes**: Ensure contrast is maintained
3. **Avoid pure black**: Use `--background` (slightly off-black)
4. **Border transparency**: `oklch(1 0 0 / 10%)` for subtle borders

---

## Common Styling Issues & Solutions

### Issue: Span Elements Have No Styles

**Problem**: Spans are inline elements with no default styling.

**Solution**: Always explicitly style spans or inherit from parent.

```css
/* ❌ Bad: Unstyled span */
<span>Text</span>

/* ✅ Good: Explicitly styled */
.button__text {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: inherit; /* Inherits from .button */
}

/* ✅ Good: Using inherit for color */
.card__badge {
  display: inline-block;
  padding: var(--spacing-xxs) var(--spacing-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: inherit; /* Takes parent's color */
  background-color: var(--muted);
  border-radius: var(--radius-full);
}
```

### Issue: Inconsistent Spacing

**Problem**: Hardcoded pixel values create inconsistency.

**Solution**: Always use spacing tokens.

```css
/* ❌ Bad */
margin-bottom: 15px;
padding: 20px 25px;

/* ✅ Good */
margin-bottom: var(--spacing-xl);
padding: var(--spacing-3xl) var(--spacing-4xl);
```

### Issue: Color Inconsistency

**Problem**: Hardcoded hex colors don't support dark mode.

**Solution**: Always use semantic color tokens.

```css
/* ❌ Bad */
color: #666;
background-color: #f5f5f5;

/* ✅ Good */
color: var(--muted-foreground);
background-color: var(--muted);
```

---

## Checklist for New Components

- [ ] Uses BEM naming convention
- [ ] All values use design tokens (no hardcoded values)
- [ ] Span elements have explicit styling
- [ ] Interactive elements have focus states
- [ ] Color contrast meets WCAG AA standards
- [ ] Works in both light and dark mode
- [ ] Keyboard accessible
- [ ] Semantic HTML used
- [ ] No deep nesting (max 2 levels)
- [ ] Responsive design considered

---

## Resources

- **BEM Methodology**: http://getbem.com/
- **OKLCH Color**: https://oklch.com/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

**Last Updated**: January 2025
**Maintained by**: Game Loopers Team
