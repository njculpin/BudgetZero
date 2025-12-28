# Phase 3: Product Component Buttons Audit

**Status:** In Progress
**Date:** 2025-12-28

---

## ProductDocumentsForm (`/src/components/products/ProductDocumentsForm.tsx`)

### Custom Buttons Found: 9

1. **`.product-documents-form__add-button`** (line 281)
   - **Purpose:** Open modal to add document
   - **Design System:** `Button variant="primary" size="sm"` with icon
   - **Complexity:** Simple onclick handler

2. **`.document-list__edit-button`** (line 337)
   - **Purpose:** Toggle price editing mode
   - **Design System:** `Button variant="ghost" size="sm"`
   - **Complexity:** Simple state toggle

3. **`.document-list__save-price`** (line 361)
   - **Purpose:** Save edited price
   - **Design System:** `LoadingButton variant="primary" size="sm"`
   - **Complexity:** Async API call

4. **`.document-list__cancel-price`** (line 368)
   - **Purpose:** Cancel price editing
   - **Design System:** `Button variant="outline" size="sm"`
   - **Complexity:** Simple state reset

5. **`.document-list__remove-button`** (line 378)
   - **Purpose:** Remove document from product
   - **Design System:** `Button variant="ghost" size="icon"` (destructive color)
   - **Complexity:** Async API call with confirmation

6. **`.modal-create-link`** (line 424)
   - **Purpose:** Create new document from modal
   - **Design System:** `LoadingButton variant="link" size="md"`
   - **Complexity:** Async API call

7. **`.available-docs-list__add-button`** (line 451)
   - **Purpose:** Select document to add
   - **Design System:** `Button variant="primary" size="sm"` (conditional text)
   - **Complexity:** Simple state toggle

8. **`.add-document-price__confirm`** (line 482)
   - **Purpose:** Confirm adding document with price
   - **Design System:** `LoadingButton variant="primary" size="md"`
   - **Complexity:** Async API call

9. **`.add-document-price__cancel`** (line 489)
   - **Purpose:** Cancel adding document
   - **Design System:** `Button variant="outline" size="md"`
   - **Complexity:** Simple state reset

### Refactoring Strategy:

**Step 1:** Import LoadingButton from design system
**Step 2:** Replace buttons that trigger async actions with LoadingButton
**Step 3:** Replace simple buttons with Button component
**Step 4:** Remove all custom CSS classes (373 lines → ~50 lines)
**Step 5:** Test functionality

**Estimated Lines Removed:** ~320 CSS lines
**Estimated Lines Changed:** ~50 TSX lines

---

## ProductFilesForm (`/src/components/products/ProductFilesForm.tsx`)

### Custom Buttons (from audit report):

1. `.pending-files__upload-button`
2. `.pending-files__cancel-button`
3. `.file-list-editor__save-button`

### Status: Pending audit

---

## ProductEmbeddedProducts (`/src/components/products/ProductEmbeddedProducts.tsx`)

### Custom Buttons (from audit report):

1. `.embedded-products__add-button`
2. `.embedded-products__create-button`
3. `.embedded-products__result-embed-button`

### Status: Pending audit

---

## ProductImagesForm (`/src/components/products/ProductImagesForm.tsx`)

### Custom Buttons (from audit report):

1. `.image-grid-editor__save-button`

### Status: Pending audit

---

## ProductStatusEditor

### Custom Buttons (from audit report):

1. `.status-editor__modal-button--confirm`
2. `.status-editor__modal-button--cancel`

### Status: Pending audit

---

## ProductConflictBanner

### Custom Buttons (from audit report):

1. `.product-conflict-banner__button--primary`
2. `.product-conflict-banner__button--secondary`

### Status: Pending audit

---

## ProductPriceManager

### Custom Buttons (from audit report):

1. `.product-price-manager__add-button`

### Status: Pending audit

---

## AddToCartButton

### Custom Buttons (from audit report):

1. `.add-to-cart__button`
2. `.add-to-cart__view-cart-button`

### Status: Pending audit

**Note:** This is a critical e-commerce flow - requires extra testing

---

## Total Phase 3 Scope

**Components to Refactor:** 8
**Custom Buttons:** ~40+
**Estimated CSS Lines to Remove:** ~800-1000
**Estimated TSX Lines to Change:** ~150-200
**Risk Level:** Medium (requires comprehensive testing of product editing flows)

---

## Progress

- [x] ProductDocumentsForm - Audited
- [ ] ProductDocumentsForm - Refactored
- [ ] ProductFilesForm - Audited
- [ ] ProductFilesForm - Refactored
- [ ] ProductEmbeddedProducts - Audited
- [ ] ProductEmbeddedProducts - Refactored
- [ ] ProductImagesForm - Audited
- [ ] ProductImagesForm - Refactored
- [ ] ProductStatusEditor - Audited
- [ ] ProductStatusEditor - Refactored
- [ ] ProductConflictBanner - Audited
- [ ] ProductConflictBanner - Refactored
- [ ] ProductPriceManager - Audited
- [ ] ProductPriceManager - Refactored
- [ ] AddToCartButton - Audited
- [ ] AddToCartButton - Refactored
