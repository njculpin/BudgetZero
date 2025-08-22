# Budget Zero CSS Architecture

This directory contains the organized CSS structure for the Budget Zero design system, following modern best practices and separation of concerns.

## File Structure

### 1. `design-tokens.css`
- **Purpose**: CSS custom properties (variables) for the design system
- **Contains**: Colors, typography, spacing, shadows, transitions, breakpoints
- **Usage**: Imported first to establish design tokens for all other files

### 2. `base.css`
- **Purpose**: Global reset and base styles
- **Contains**: CSS reset, base typography, form elements, container queries
- **Usage**: Applied globally to establish consistent base styling

### 3. `components.css`
- **Purpose**: Component-specific styles
- **Contains**: Button component styles, app layout components, status cards
- **Usage**: Styles for reusable UI components

### 4. `utilities.css`
- **Purpose**: Utility classes for common styling needs
- **Contains**: Layout utilities, spacing, typography, colors, borders, shadows
- **Usage**: Helper classes for rapid prototyping and consistent spacing

### 5. `animations.css`
- **Purpose**: Animation keyframes and animation utilities
- **Contains**: Keyframes, animation classes, performance optimizations
- **Usage**: Reusable animations and motion utilities

### 6. `app.css`
- **Purpose**: App-specific layout styles
- **Contains**: App containers, page layouts, responsive breakpoints
- **Usage**: Styles specific to the application structure

## Import Order

CSS files must be imported in this specific order to ensure proper cascade:

```typescript
// 1. Design tokens (variables)
import './styles/design-tokens.css'

// 2. Base styles (reset, typography)
import './styles/base.css'

// 3. Component styles
import './styles/components.css'

// 4. Utility classes
import './styles/utilities.css'

// 5. Animations
import './styles/animations.css'

// 6. App-specific styles (highest specificity)
import './styles/app.css'
```

## Best Practices

### ✅ Do's
- Use design tokens (CSS custom properties) for consistent values
- Keep components focused on their specific styling needs
- Use utility classes for common patterns
- Follow the cascade order for imports
- Use semantic class names
- Support reduced motion preferences
- Use container queries for responsive design

### ❌ Don'ts
- Don't use inline styles in components
- Don't duplicate styles across files
- Don't override design tokens without good reason
- Don't create overly specific selectors
- Don't ignore accessibility considerations

## Component Styling

Components now use external CSS instead of inline styles:

```typescript
// Before (inline styles - removed)
protected getStyles(): string {
  return `...styles...`;
}

// After (external CSS)
protected getTemplate(): string {
  return `<button class="button button--primary">...</button>`;
}
```

## Utility Classes

The utility system provides consistent spacing, colors, and layout:

```html
<!-- Spacing -->
<div class="p-4 m-2">Content</div>

<!-- Layout -->
<div class="flex items-center justify-between">Content</div>

<!-- Colors -->
<div class="bg-primary text-white">Content</div>

<!-- Animations -->
<div class="animate-fade-in">Content</div>
```

## Responsive Design

- **Container Queries**: Modern approach for component-based responsive design
- **Media Queries**: Traditional approach for viewport-based responsive design
- **Utility Classes**: Responsive variants with breakpoint prefixes

## Performance

- **CSS-in-JS**: Removed for better performance
- **External CSS**: Better caching and parsing
- **Design Tokens**: Efficient variable system
- **Reduced Motion**: Respects user preferences

## Accessibility

- **Focus Management**: Consistent focus indicators
- **Color Contrast**: Design tokens ensure accessibility
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Screen Readers**: Proper semantic markup support

## Future Considerations

- **CSS Modules**: For component scoping if needed
- **PostCSS**: For advanced transformations
- **CSS-in-JS**: Only if performance requirements change
- **Container Queries**: Full browser support monitoring
