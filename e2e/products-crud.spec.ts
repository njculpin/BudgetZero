import { test, expect } from '@playwright/test';

const TEST_EMAIL = `product-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_PRODUCT_TITLE = `Test Product ${Date.now()}`;
const TEST_PRODUCT_DESCRIPTION = 'This is a test product for E2E testing';
const TEST_PRODUCT_TAG = 'board-game';
const TEST_VARIANT_NAME = 'PDF Only';
const TEST_VARIANT_SKU = 'TEST-PDF-001';

test.describe('Product CRUD Operations', () => {
  test.describe.configure({ mode: 'serial' });

  let productHandle: string;
  let assetHandle: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user account
    const page = await browser.newPage();
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });
    await page.close();
  });

  test('should create a test asset for product linking', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Create an asset
    await page.goto('/assets/new');
    await page.fill('input[name="title"]', 'Test Asset for Product');
    await page.fill('textarea[name="description"]', 'This asset will be linked to a product');
    await page.selectOption('select[name="status"]', 'published');
    await page.click('form button[type="submit"]:has-text("Create Asset")');
    await page.waitForURL(/\/assets\/.*/, { timeout: 10000 });

    // Store the asset handle
    const url = page.url();
    assetHandle = url.split('/assets/')[1];
  });

  test('should create a new product successfully', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to create product page
    await page.goto('/products/new');
    await expect(page.locator('.product-form')).toBeVisible();
    await expect(page.locator('text=Create New Product')).toBeVisible();

    // Fill out the form
    await page.fill('input[name="title"]', TEST_PRODUCT_TITLE);
    await page.fill('textarea[name="description"]', TEST_PRODUCT_DESCRIPTION);

    // Add a tag
    const tagInput = page.locator('#tag-input-field');
    await tagInput.fill(TEST_PRODUCT_TAG);
    await tagInput.press('Enter');

    // Select status
    await page.selectOption('select[name="status"]', 'published');

    // Submit the form
    await page.click('form button[type="submit"]:has-text("Create Product")');

    // Should redirect to product detail page
    await page.waitForURL(/\/products\/.*/, { timeout: 10000 });

    // Verify we're on the product detail page
    await expect(page.locator('text=' + TEST_PRODUCT_TITLE)).toBeVisible();
    await expect(page.locator('text=' + TEST_PRODUCT_DESCRIPTION)).toBeVisible();
    await expect(page.locator('text=' + TEST_PRODUCT_TAG)).toBeVisible();

    // Store the product handle for later tests
    const url = page.url();
    productHandle = url.split('/products/')[1];
  });

  test('should display the created product correctly', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to the product
    await page.goto(`/products/${productHandle}`);

    // Verify product details
    await expect(page.locator('text=' + TEST_PRODUCT_TITLE)).toBeVisible();
    await expect(page.locator('text=' + TEST_PRODUCT_DESCRIPTION)).toBeVisible();
    await expect(page.locator('text=' + TEST_PRODUCT_TAG)).toBeVisible();
    await expect(page.locator('text=published')).toBeVisible();

    // Verify owner can see Edit and Delete buttons
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('should update a product successfully', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}`);
    await expect(page.locator('text=Edit Product')).toBeVisible();

    // Update the title
    const updatedTitle = `${TEST_PRODUCT_TITLE} (Updated)`;
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);

    // Update description
    const updatedDescription = `${TEST_PRODUCT_DESCRIPTION} - Updated via E2E test`;
    const descriptionTextarea = page.locator('textarea[name="description"]');
    await descriptionTextarea.clear();
    await descriptionTextarea.fill(updatedDescription);

    // Change status to draft
    await page.selectOption('select[name="status"]', 'draft');

    // Submit the form
    await page.click('form button[type="submit"]:has-text("Save Changes")');

    // Should redirect back to edit page with success message
    await page.waitForURL(`/products/${productHandle}?success=*`, { timeout: 10000 });

    // Verify success message
    await expect(page.locator('.product-edit-alert--success')).toBeVisible();

    // Navigate back to product detail to verify changes
    await page.goto(`/products/${productHandle}`);
    await expect(page.locator('text=' + updatedTitle)).toBeVisible();
    await expect(page.locator('text=' + updatedDescription)).toBeVisible();
    await expect(page.locator('text=draft')).toBeVisible();
  });

  test('should create a variant for the product', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}`);

    // Expand the "Add New Variant" section (it should be open by default)
    await expect(page.locator('text=Add New Variant')).toBeVisible();

    // Fill variant form
    await page.fill('input[name="variant_name"]', TEST_VARIANT_NAME);
    await page.fill('input[name="variant_sku"]', TEST_VARIANT_SKU);
    await page.fill('textarea[name="variant_description"]', 'PDF version of the game');

    // Check "Digital Product" checkbox (should be checked by default)
    const digitalCheckbox = page.locator('input[name="variant_is_digital"]');
    await expect(digitalCheckbox).toBeChecked();

    // Submit variant form
    await page.click('form button[type="submit"]:has-text("Create Variant")');

    // Should redirect back to edit page with success message
    await page.waitForURL(`/products/${productHandle}?success=*`, { timeout: 10000 });

    // Verify success message
    await expect(page.locator('.product-edit-alert--success')).toBeVisible();
    await expect(page.locator('text=Variant created successfully')).toBeVisible();

    // Verify variant appears in the list
    await expect(page.locator('text=' + TEST_VARIANT_NAME)).toBeVisible();
    await expect(page.locator('text=' + TEST_VARIANT_SKU)).toBeVisible();
    await expect(page.locator('text=Digital')).toBeVisible();
  });

  test('should link an asset to the variant', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}`);

    // Find the variant card and its asset linking form
    const variantCard = page.locator('.variant-edit-card').first();
    await expect(variantCard).toBeVisible();

    // Find the asset select dropdown within the variant card
    const assetSelect = variantCard.locator('select[name="asset_id"]');
    await assetSelect.selectOption({ label: /Test Asset for Product/ });

    // Click "Link Asset" button
    await variantCard.locator('button:has-text("Link Asset")').click();

    // Should redirect back with success message
    await page.waitForURL(`/products/${productHandle}?success=*`, { timeout: 10000 });

    // Verify success message
    await expect(page.locator('text=Asset linked successfully')).toBeVisible();

    // Verify asset appears in the linked assets list
    await expect(page.locator('text=Test Asset for Product')).toBeVisible();
    await expect(page.locator('text=Linked Assets (1)')).toBeVisible();
  });

  test('should update a variant', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}`);

    // Find the variant card and expand the edit details
    const variantCard = page.locator('.variant-edit-card').first();
    const editDetails = variantCard.locator('details.variant-edit-card__edit-details');
    await editDetails.locator('summary').click();

    // Update variant name
    const nameInput = variantCard.locator('input[name="variant_name"]');
    await nameInput.clear();
    await nameInput.fill(`${TEST_VARIANT_NAME} (Updated)`);

    // Update description
    const descriptionTextarea = variantCard.locator('textarea[name="variant_description"]');
    await descriptionTextarea.clear();
    await descriptionTextarea.fill('Updated PDF version with bonus content');

    // Submit update
    await variantCard.locator('button:has-text("Update Variant")').click();

    // Should redirect with success message
    await page.waitForURL(`/products/${productHandle}?success=*`, { timeout: 10000 });

    // Verify success message
    await expect(page.locator('text=Variant updated successfully')).toBeVisible();

    // Verify updated variant name
    await expect(page.locator(`text=${TEST_VARIANT_NAME} (Updated)`)).toBeVisible();
  });

  test('should unlink an asset from the variant', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}`);

    // Find the linked asset and click Remove
    const variantCard = page.locator('.variant-edit-card').first();
    const assetItem = variantCard.locator('.variant-edit-card__asset-item').first();
    await assetItem.locator('button:has-text("Remove")').click();

    // Should redirect with success message
    await page.waitForURL(`/products/${productHandle}?success=*`, { timeout: 10000 });

    // Verify success message
    await expect(page.locator('text=Asset unlinked successfully')).toBeVisible();

    // Verify asset is no longer in the list
    await expect(page.locator('text=Linked Assets (0)')).toBeVisible();
    await expect(page.locator('text=No assets linked yet')).toBeVisible();
  });

  test('should show validation error when product title is empty', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}`);

    // Clear the title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();

    // Try to submit
    await page.click('form button[type="submit"]:has-text("Save Changes")');

    // Should stay on the same page (browser validation prevents submission)
    await expect(page).toHaveURL(`/products/${productHandle}`);
  });

  test('should delete a variant', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}`);

    // Set up dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    // Find the variant card and click Delete
    const variantCard = page.locator('.variant-edit-card').first();
    await variantCard.locator('button:has-text("Delete Variant")').click();

    // Should redirect with success message
    await page.waitForURL(`/products/${productHandle}?success=*`, { timeout: 10000 });

    // Verify success message
    await expect(page.locator('text=Variant deleted successfully')).toBeVisible();

    // Verify variant is no longer shown
    await expect(page.locator('text=No variants yet')).toBeVisible();
  });

  test('should delete a product successfully', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to the product
    await page.goto(`/products/${productHandle}`);

    // Set up dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    // Click delete button
    await page.click('form button[type="submit"]:has-text("Delete")');

    // Should redirect to user's profile
    await page.waitForURL(/\/users\/.*/, { timeout: 10000 });

    // Try to access the deleted product
    await page.goto(`/products/${productHandle}`);

    // Should redirect to 404
    await expect(page).toHaveURL('/404');
  });

  test('should not allow non-owners to edit products', async ({ page }) => {
    // Create a second test user
    const secondEmail = `product-test-2-${Date.now()}@example.com`;
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', secondEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });

    // Sign in with first user to create a product
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Create a test product
    await page.goto('/products/new');
    await page.fill('input[name="title"]', 'Protected Product');
    await page.fill('textarea[name="description"]', 'This product should not be editable by others');
    await page.selectOption('select[name="status"]', 'published');
    await page.click('form button[type="submit"]:has-text("Create Product")');
    await page.waitForURL(/\/products\/.*/, { timeout: 10000 });

    // Get the product handle
    const url = page.url();
    const protectedHandle = url.split('/products/')[1];

    // Sign out
    await page.click('form button[type="submit"]:has-text("Sign out")');
    await page.waitForURL('/', { timeout: 10000 });

    // Sign in with second user
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', secondEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access the edit page
    await page.goto(`/products/${protectedHandle}`);

    // Should redirect to 404 (non-owners can't edit)
    await expect(page).toHaveURL('/404');

    // Navigate to product detail page
    await page.goto(`/products/${protectedHandle}`);

    // Should not see Edit and Delete buttons
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
  });

  test('should browse products and filter by tags', async ({ page }) => {
    // No need to sign in for browsing public products
    await page.goto('/products');

    // Verify browse page loads
    await expect(page.locator('text=Browse Products')).toBeVisible();

    // Verify search input is visible
    await expect(page.locator('input[name="search"]')).toBeVisible();

    // If there are products, verify they're displayed in a grid
    const productCards = page.locator('.product-card');
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      // Verify product cards have required elements
      const firstCard = productCards.first();
      await expect(firstCard.locator('.product-card__title')).toBeVisible();
      await expect(firstCard.locator('.product-card__author')).toBeVisible();
    }

    // Test tag filtering (if tags are available)
    const tags = page.locator('.products-filters__tag-link');
    const tagCount = await tags.count();

    if (tagCount > 0) {
      // Click first tag
      await tags.first().click();

      // Verify URL has tag parameter
      await expect(page).toHaveURL(/tag=/);

      // Verify active filter is shown
      await expect(page.locator('.products-filters__active-item')).toBeVisible();
    }
  });
});
