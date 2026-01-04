import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Product Creation and Management Workflow
 *
 * These tests verify the complete product lifecycle, particularly focusing on:
 * - Product creation redirects to edit page (NOT view page) - critical bug fix
 * - Product editing workflow
 * - Owner vs non-owner views
 * - Edge cases and validation
 */

const TEST_EMAIL = `product-workflow-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Product Creation Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let productHandle: string;

  test.beforeAll(async ({ browser }) => {
    // Create test user account
    const page = await browser.newPage();
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });
    await page.close();
  });

  test('should redirect to edit page after creating product via form submission', async ({
    page,
  }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to create product page
    await page.goto('/products/new');
    await expect(page.locator('text=Create New Product')).toBeVisible();

    // Fill form
    const productTitle = `E2E Test Product ${Date.now()}`;
    await page.fill('input[name="title"]', productTitle);
    await page.fill('textarea[name="description"]', 'This is an E2E test product');

    // Add tags
    const tagInput = page.locator('#tag-input-field');
    await tagInput.fill('board-game');
    await tagInput.press('Enter');

    // Submit form
    await page.click('form button[type="submit"]:has-text("Create Product")');

    // CRITICAL: Should show success modal
    await expect(page.locator('.product-created__title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Product Created!')).toBeVisible();
    await expect(page.locator(`text="${productTitle}"`)).toBeVisible();

    // Click "Go to Product" button
    await page.click('button:has-text("Go to Product")');

    // CRITICAL: Should redirect to EDIT page, not view page
    await page.waitForURL(/\/products\/.*\/edit/, { timeout: 10000 });

    // Verify we're on the edit page by checking for edit-specific elements
    await expect(page).toHaveURL(/\/products\/.*\/edit$/);

    // Store handle for later tests
    const url = page.url();
    const matches = url.match(/\/products\/(.*)\/edit/);
    if (matches) {
      productHandle = matches[1];
    }

    // Verify edit page elements are visible
    await expect(page.locator('text=Product Settings')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });

  test('should allow editing product basic info', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}/edit`);

    // Verify we're on edit page
    await expect(page).toHaveURL(`/products/${productHandle}/edit`);

    // Update title
    const updatedTitle = `Updated Product Title ${Date.now()}`;
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);

    // Update description
    const updatedDescription = 'This product has been updated via E2E test';
    const descriptionTextarea = page.locator('textarea[name="description"]');
    await descriptionTextarea.clear();
    await descriptionTextarea.fill(updatedDescription);

    // Save changes
    await page.click('button[type="submit"]:has-text("Save")');

    // Verify changes persisted (page may reload or show success message)
    await page.waitForTimeout(1000);

    // Navigate back to edit page to verify persistence
    await page.goto(`/products/${productHandle}/edit`);
    await expect(titleInput).toHaveValue(updatedTitle);
    await expect(descriptionTextarea).toHaveValue(updatedDescription);
  });

  test('should allow changing product status', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}/edit`);

    // Find status selector
    const statusSelect = page.locator('select[name="status"]');
    await expect(statusSelect).toBeVisible();

    // Change to public
    await statusSelect.selectOption('public');

    // Save
    await page.click('button[type="submit"]:has-text("Save")');
    await page.waitForTimeout(1000);

    // Verify status changed
    await page.goto(`/products/${productHandle}/edit`);
    await expect(statusSelect).toHaveValue('public');
  });

  test('should show product in public marketplace when status is public', async ({
    page,
  }) => {
    // No need to sign in for browsing public products
    await page.goto('/products');

    // Search for our product
    const searchInput = page.locator('input[name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(productHandle);
      await page.waitForTimeout(1000);

      // Product should be visible in results
      const productCard = page.locator(`a[href*="${productHandle}"]`).first();
      await expect(productCard).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display edit controls only to owner on edit page', async ({ page }) => {
    // Sign in as owner
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${productHandle}/edit`);

    // Owner should see edit controls
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Save")')).toBeVisible();
  });

  test('should show product details on view page', async ({ page }) => {
    // Navigate to product view page (without /edit)
    await page.goto(`/products/${productHandle}`);

    // Should show product information
    await expect(page).toHaveURL(`/products/${productHandle}`);

    // Verify product details are visible
    // Note: Exact selectors depend on your product view page structure
    const productTitle = page.locator('h1, h2').first();
    await expect(productTitle).toBeVisible();
  });
});

test.describe('Product Creation Edge Cases', () => {
  const EDGE_CASE_EMAIL = `edge-case-${Date.now()}@example.com`;
  const EDGE_CASE_PASSWORD = 'TestPassword123!';

  test.beforeAll(async ({ browser }) => {
    // Create test user
    const page = await browser.newPage();
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', EDGE_CASE_EMAIL);
    await page.fill('input[name="password"]', EDGE_CASE_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });
    await page.close();
  });

  test('should create product with empty title using default timestamp', async ({
    page,
  }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', EDGE_CASE_EMAIL);
    await page.fill('input[name="password"]', EDGE_CASE_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to create product
    await page.goto('/products/new');

    // Submit form without filling title (leave it empty)
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();

    // Submit form
    await page.click('form button[type="submit"]:has-text("Create Product")');

    // Should show success modal with default timestamp title
    await expect(page.locator('.product-created__title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Product Created!')).toBeVisible();

    // Click go to product
    await page.click('button:has-text("Go to Product")');

    // Should redirect to edit page
    await page.waitForURL(/\/products\/.*\/edit/, { timeout: 10000 });

    // Verify title contains "New Product" (default pattern)
    const editTitleInput = page.locator('input[name="title"]');
    const titleValue = await editTitleInput.inputValue();
    expect(titleValue).toContain('New Product');
  });

  test('should handle special characters in product title', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', EDGE_CASE_EMAIL);
    await page.fill('input[name="password"]', EDGE_CASE_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Create product with special characters
    await page.goto('/products/new');

    const specialTitle = 'Product @#$ with Special % Chars!!!';
    await page.fill('input[name="title"]', specialTitle);
    await page.fill('textarea[name="description"]', 'Testing special characters');

    await page.click('form button[type="submit"]:has-text("Create Product")');

    // Wait for modal
    await expect(page.locator('.product-created__title')).toBeVisible({ timeout: 10000 });

    // Click go to product
    await page.click('button:has-text("Go to Product")');

    // Should redirect to edit page with sanitized handle
    await page.waitForURL(/\/products\/.*\/edit/, { timeout: 10000 });

    // URL should have sanitized handle (no special chars)
    const url = page.url();
    expect(url).toMatch(/\/products\/product-with-special-chars\/edit/);

    // Title should preserve special characters
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveValue(specialTitle);
  });

  test('should handle very long product titles', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', EDGE_CASE_EMAIL);
    await page.fill('input[name="password"]', EDGE_CASE_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Create product with very long title
    await page.goto('/products/new');

    const longTitle = 'A'.repeat(200); // 200 character title
    await page.fill('input[name="title"]', longTitle);

    await page.click('form button[type="submit"]:has-text("Create Product")');

    // Wait for modal
    await expect(page.locator('.product-created__title')).toBeVisible({ timeout: 10000 });

    // Click go to product
    await page.click('button:has-text("Go to Product")');

    // Should redirect to edit page
    await page.waitForURL(/\/products\/.*\/edit/, { timeout: 10000 });

    // Handle should be truncated to max length (50 chars)
    const url = page.url();
    const matches = url.match(/\/products\/(.*)\/edit/);
    if (matches) {
      const handle = matches[1];
      expect(handle.length).toBeLessThanOrEqual(50);
    }

    // Title should be preserved in full
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveValue(longTitle);
  });

  test('should create multiple products in quick succession without collision errors', async ({
    page,
  }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', EDGE_CASE_EMAIL);
    await page.fill('input[name="password"]', EDGE_CASE_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    const baseTitle = 'Duplicate Product Name';
    const createdHandles: string[] = [];

    // Create 3 products with same title
    for (let i = 0; i < 3; i++) {
      await page.goto('/products/new');

      await page.fill('input[name="title"]', baseTitle);
      await page.fill('textarea[name="description"]', `Product ${i + 1}`);

      await page.click('form button[type="submit"]:has-text("Create Product")');

      // Wait for modal
      await expect(page.locator('.product-created__title')).toBeVisible({
        timeout: 10000,
      });

      // Click go to product
      await page.click('button:has-text("Go to Product")');

      // Wait for edit page
      await page.waitForURL(/\/products\/.*\/edit/, { timeout: 10000 });

      // Extract handle
      const url = page.url();
      const matches = url.match(/\/products\/(.*)\/edit/);
      if (matches) {
        createdHandles.push(matches[1]);
      }
    }

    // Verify all handles are unique
    const uniqueHandles = new Set(createdHandles);
    expect(uniqueHandles.size).toBe(3);

    // Verify handles follow collision pattern
    expect(createdHandles[0]).toBe('duplicate-product-name');
    expect(createdHandles[1]).toBe('duplicate-product-name-1');
    expect(createdHandles[2]).toBe('duplicate-product-name-2');
  });
});

test.describe('Owner vs Non-Owner Product Views', () => {
  const OWNER_EMAIL = `owner-${Date.now()}@example.com`;
  const NON_OWNER_EMAIL = `non-owner-${Date.now()}@example.com`;
  const PASSWORD = 'TestPassword123!';
  let testProductHandle: string;

  test.beforeAll(async ({ browser }) => {
    // Create owner account
    const ownerPage = await browser.newPage();
    await ownerPage.goto('/sign-up');
    await ownerPage.fill('input[name="email"]', OWNER_EMAIL);
    await ownerPage.fill('input[name="password"]', PASSWORD);
    await ownerPage.click('form button[type="submit"]:has-text("Create account")');
    await ownerPage.waitForURL('/sign-in', { timeout: 10000 });

    // Sign in as owner
    await ownerPage.fill('input[name="email"]', OWNER_EMAIL);
    await ownerPage.fill('input[name="password"]', PASSWORD);
    await ownerPage.click('form button[type="submit"]:has-text("Sign in")');
    await ownerPage.waitForURL('/dashboard', { timeout: 10000 });

    // Create a product as owner
    await ownerPage.goto('/products/new');
    await ownerPage.fill('input[name="title"]', 'Owned Test Product');
    await ownerPage.fill('textarea[name="description"]', 'This is owned by the owner');
    await ownerPage.locator('select[name="status"]').selectOption('public');
    await ownerPage.click('form button[type="submit"]:has-text("Create Product")');

    // Wait for modal and get handle
    await ownerPage.waitForSelector('.product-created__title', { timeout: 10000 });
    await ownerPage.click('button:has-text("Go to Product")');
    await ownerPage.waitForURL(/\/products\/.*\/edit/, { timeout: 10000 });

    const url = ownerPage.url();
    const matches = url.match(/\/products\/(.*)\/edit/);
    if (matches) {
      testProductHandle = matches[1];
    }

    await ownerPage.close();

    // Create non-owner account
    const nonOwnerPage = await browser.newPage();
    await nonOwnerPage.goto('/sign-up');
    await nonOwnerPage.fill('input[name="email"]', NON_OWNER_EMAIL);
    await nonOwnerPage.fill('input[name="password"]', PASSWORD);
    await nonOwnerPage.click('form button[type="submit"]:has-text("Create account")');
    await nonOwnerPage.waitForURL('/sign-in', { timeout: 10000 });
    await nonOwnerPage.close();
  });

  test('owner should see edit page when accessing /edit URL', async ({ page }) => {
    // Sign in as owner
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', OWNER_EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/products/${testProductHandle}/edit`);

    // Should see edit page
    await expect(page).toHaveURL(`/products/${testProductHandle}/edit`);
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Save")')).toBeVisible();
  });

  test('non-owner should be redirected when trying to access /edit URL', async ({
    page,
  }) => {
    // Sign in as non-owner
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', NON_OWNER_EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access edit page
    await page.goto(`/products/${testProductHandle}/edit`);

    // Should be redirected (likely to 404 or view page)
    // Verify we're NOT on the edit page
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/edit');
  });

  test('non-owner should see view page without edit controls', async ({ page }) => {
    // Sign in as non-owner
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', NON_OWNER_EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to product view page
    await page.goto(`/products/${testProductHandle}`);

    // Should see product info but NO edit controls
    await expect(page).toHaveURL(`/products/${testProductHandle}`);

    // Should NOT see edit form inputs
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).not.toBeVisible();
  });

  test('anonymous user should see public product without edit controls', async ({
    page,
  }) => {
    // Don't sign in - browse as anonymous
    await page.goto(`/products/${testProductHandle}`);

    // Should see product
    await expect(page).toHaveURL(`/products/${testProductHandle}`);

    // Should NOT see edit controls
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).not.toBeVisible();
  });
});
