import { test, expect } from '@playwright/test';

const TEST_EMAIL = `asset-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_ASSET_TITLE = `Test Asset ${Date.now()}`;
const TEST_ASSET_DESCRIPTION = 'This is a test asset for E2E testing';
const TEST_ASSET_TAG = 'test-tag';

test.describe('Asset CRUD Operations', () => {
  test.describe.configure({ mode: 'serial' });

  let assetHandle: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user account
    const page = await browser.newPage();
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });
    await page.close();
  });

  test('should create a new asset successfully', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to create asset page
    await page.goto('/assets/new');
    await expect(page.locator('.asset-create-card')).toBeVisible();
    await expect(page.locator('text=Create New Asset')).toBeVisible();

    // Fill out the form
    await page.fill('input[name="title"]', TEST_ASSET_TITLE);
    await page.fill('textarea[name="description"]', TEST_ASSET_DESCRIPTION);

    // Add a tag
    const tagInput = page.locator('#tag-input-field');
    await tagInput.fill(TEST_ASSET_TAG);
    await tagInput.press('Enter');

    // Select status
    await page.selectOption('select[name="status"]', 'published');

    // Submit the form
    await page.click('button:has-text("Create Asset")');

    // Should redirect to asset detail page
    await page.waitForURL(/\/assets\/.*/, { timeout: 10000 });

    // Verify we're on the asset detail page
    await expect(page.locator('text=' + TEST_ASSET_TITLE)).toBeVisible();
    await expect(page.locator('text=' + TEST_ASSET_DESCRIPTION)).toBeVisible();
    await expect(page.locator('text=' + TEST_ASSET_TAG)).toBeVisible();

    // Store the asset handle for later tests
    const url = page.url();
    assetHandle = url.split('/assets/')[1];
  });

  test('should display the created asset correctly', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to the asset
    await page.goto(`/assets/${assetHandle}`);

    // Verify asset details
    await expect(page.locator('text=' + TEST_ASSET_TITLE)).toBeVisible();
    await expect(page.locator('text=' + TEST_ASSET_DESCRIPTION)).toBeVisible();
    await expect(page.locator('text=' + TEST_ASSET_TAG)).toBeVisible();
    await expect(page.locator('text=published')).toBeVisible();

    // Verify owner can see Edit and Delete buttons
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();

    // Verify stats are displayed
    await expect(page.locator('.asset-stats')).toBeVisible();
  });

  test('should update an asset successfully', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/assets/${assetHandle}/edit`);
    await expect(page.locator('text=Edit Asset')).toBeVisible();

    // Update the title
    const updatedTitle = `${TEST_ASSET_TITLE} (Updated)`;
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);

    // Update description
    const updatedDescription = `${TEST_ASSET_DESCRIPTION} - Updated via E2E test`;
    const descriptionTextarea = page.locator('textarea[name="description"]');
    await descriptionTextarea.clear();
    await descriptionTextarea.fill(updatedDescription);

    // Change status to draft
    await page.selectOption('select[name="status"]', 'draft');

    // Submit the form
    await page.click('button:has-text("Update Asset")');

    // Should redirect back to asset detail page
    await page.waitForURL(`/assets/${assetHandle}`, { timeout: 10000 });

    // Verify updates
    await expect(page.locator('text=' + updatedTitle)).toBeVisible();
    await expect(page.locator('text=' + updatedDescription)).toBeVisible();
    await expect(page.locator('text=draft')).toBeVisible();
  });

  test('should show validation error when title is empty', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/assets/${assetHandle}/edit`);

    // Clear the title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();

    // Try to submit
    await page.click('button:has-text("Update Asset")');

    // Should stay on the same page and show validation error
    // The browser's built-in validation should prevent submission
    await expect(page).toHaveURL(`/assets/${assetHandle}/edit`);
  });

  test('should delete an asset successfully', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to the asset
    await page.goto(`/assets/${assetHandle}`);

    // Set up dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    // Click delete button
    await page.click('button:has-text("Delete")');

    // Should redirect to user's profile
    await page.waitForURL(/\/users\/.*/, { timeout: 10000 });

    // Try to access the deleted asset
    await page.goto(`/assets/${assetHandle}`);

    // Should redirect to 404 or show error
    await expect(page).toHaveURL('/404');
  });

  test('should not allow non-owners to edit assets', async ({ page }) => {
    // Create a second test user
    const secondEmail = `asset-test-2-${Date.now()}@example.com`;
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', secondEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });

    // Sign in with the second user
    await page.fill('input[name="email"]', secondEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // First create an asset as the first user to get a valid handle
    // Sign in with first user
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Create a test asset
    await page.goto('/assets/new');
    await page.fill('input[name="title"]', 'Protected Asset');
    await page.fill('textarea[name="description"]', 'This asset should not be editable by others');
    await page.selectOption('select[name="status"]', 'published');
    await page.click('button:has-text("Create Asset")');
    await page.waitForURL(/\/assets\/.*/, { timeout: 10000 });

    // Get the asset handle
    const url = page.url();
    const protectedHandle = url.split('/assets/')[1];

    // Sign out and sign in with second user
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('/', { timeout: 10000 });

    await page.goto('/sign-in');
    await page.fill('input[name="email"]', secondEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access the edit page
    await page.goto(`/assets/${protectedHandle}/edit`);

    // Should redirect to the asset detail page
    await page.waitForURL(`/assets/${protectedHandle}`, { timeout: 10000 });

    // Should not see Edit and Delete buttons
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
  });
});
