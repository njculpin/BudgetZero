# BEM Methodology Guide

This project now follows BEM (Block Element Modifier) methodology for CSS organization. BEM provides a clear naming convention that makes CSS more maintainable and scalable.

## BEM Structure

### Block
A standalone entity that is meaningful on its own.
- `.app` - Main application container
- `.view` - Page view container
- `.card` - Card component
- `.button` - Button component
- `.form` - Form component
- `.input` - Input component
- `.nav` - Navigation component

### Element
Parts of a block that have no standalone meaning.
- `.card__header` - Header section of a card
- `.card__title` - Title within a card
- `.card__subtitle` - Subtitle within a card
- `.card__content` - Main content area of a card
- `.card__footer` - Footer section of a card
- `.form__group` - Form field group
- `.form__label` - Form field label
- `.form__input` - Form input field
- `.form__button` - Form submit button
- `.nav__item` - Navigation item

### Modifier
Different states or variations of a block or element.
- `.button--primary` - Primary button style
- `.button--secondary` - Secondary button style
- `.heading--primary` - Primary heading style
- `.heading--secondary` - Secondary heading style
- `.nav__item--active` - Active navigation item

## Class Naming Convention

1. **Block**: `.block-name`
2. **Element**: `.block-name__element-name`
3. **Modifier**: `.block-name--modifier-name` or `.block-name__element-name--modifier-name`

## Examples

```html
<!-- Card block with elements -->
<div class="card">
  <div class="card__header">
    <h2 class="card__title">Title</h2>
    <p class="card__subtitle">Subtitle</p>
  </div>
  <div class="card__content">
    <p class="text">Content here</p>
  </div>
  <div class="card__footer">
    <button class="button button--primary">Action</button>
  </div>
</div>

<!-- Form block with elements -->
<div class="form">
  <div class="form__group">
    <label class="form__label">Email</label>
    <input class="form__input" type="email" />
  </div>
  <button class="form__button">Submit</button>
</div>
```

## Benefits

1. **Maintainability**: Clear relationship between HTML and CSS
2. **Scalability**: Easy to add new components without conflicts
3. **Readability**: Self-documenting class names
4. **Reusability**: Components can be easily reused across pages
5. **Performance**: Specific selectors reduce CSS specificity issues

## Best Practices

1. Use semantic names that describe the purpose, not appearance
2. Keep nesting to a maximum of 2 levels (block__element)
3. Use modifiers for variations, not for different elements
4. Be consistent with naming conventions across the project
5. Document new components in this guide

## Migration Notes

- Old classes like `.btn`, `.btn-primary` are now `.button`, `.button--primary`
- Page-specific classes like `.landing`, `.auth` are now `.view`
- All components now use the card structure for consistent layout
- Form elements are properly grouped with labels and inputs
