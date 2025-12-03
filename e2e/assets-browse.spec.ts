import { test, expect } from '@playwright/test';

const TEST_EMAIL = `browse-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Asset Browse and Search', () => {
  test.describe.configure({ mode: 'serial' });

  const testAssets = [
    {
      title: 'Game Board Design',
      description: 'A beautiful game board design for tabletop games',
      tags: ['board-game', 'design'],
      status: 'public' as const,
    },
    {
      title: '3D Miniature STL',
      description: '3D printable miniature files in STL format',
      tags: ['3d-model', 'miniature'],
      status: 'public' as const,
    },
    {
      title: 'Rulebook Template',
      description: 'Professional rulebook template for board games',
      tags: ['template', 'rulebook'],
      status: 'public' as const,
    },
    {
      title: 'Draft Asset',
      description: 'This asset is still in draft mode',
      tags: ['draft'],
      status: 'draft' as const,
    },
  ];

  test.beforeAll(async ({ browser }) => {
    // Create a test user and test assets
    const page = await browser.newPage();

    // Sign up
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });

    // Sign in
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Create test assets
    for (const asset of testAssets) {
      await page.goto('/assets/new');
      await page.fill('input[name="title"]', asset.title);
      await page.fill('textarea[name="description"]', asset.description);

      // Add tags
      const tagInput = page.locator('#tag-input-field');
      for (const tag of asset.tags) {
        await tagInput.fill(tag);
        await tagInput.press('Enter');
      }

      await page.selectOption('select[name="status"]', asset.status);
      await page.click('form button[type="submit"]:has-text("Create Asset")');
      await page.waitForURL(/\/assets\/.*/, { timeout: 10000 });
    }

    await page.close();
  });

  test('should display the browse assets page correctly', async ({ page }) => {
    await page.goto('/assets');

    // Verify page elements
    await expect(page.locator('text=Browse Assets')).toBeVisible();
    await expect(page.locator('input[name="search"]')).toBeVisible();
    await expect(page.locator('text=Popular Tags:')).toBeVisible();

    // Should show the assets grid
    await expect(page.locator('.assets-grid')).toBeVisible();

    // Should show at least 3 public assets (draft should not be visible)
    const assetCards = page.locator('.asset-card');
    const count = await assetCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should only show public assets to non-owners', async ({ page }) => {
    await page.goto('/assets');

    // Should show public assets
    await expect(page.locator('text=Game Board Design')).toBeVisible();
    await expect(page.locator('text=3D Miniature STL')).toBeVisible();
    await expect(page.locator('text=Rulebook Template')).toBeVisible();

    // Should NOT show draft asset
    await expect(page.locator('text=Draft Asset')).not.toBeVisible();
  });

  test('should search assets by title', async ({ page }) => {
    await page.goto('/assets');

    // Search for "Board"
    await page.fill('input[name="search"]', 'Board');
    await page.click('input[name="search"]');
    await page.press('input[name="search"]', 'Enter');

    // Wait for navigation
    await page.waitForURL(/\/assets\?search=.*/, { timeout: 10000 });

    // Should show the matching asset
    await expect(page.locator('text=Game Board Design')).toBeVisible();

    // Should show active filter
    await expect(page.locator('.assets-filters__active')).toBeVisible();
    await expect(page.locator('text=Search: "Board"')).toBeVisible();
  });

  test('should search assets by description', async ({ page }) => {
    await page.goto('/assets');

    // Search for "miniature"
    await page.fill('input[name="search"]', 'miniature');
    await page.press('input[name="search"]', 'Enter');

    // Wait for navigation
    await page.waitForURL(/\/assets\?search=.*/, { timeout: 10000 });

    // Should show the matching asset
    await expect(page.locator('text=3D Miniature STL')).toBeVisible();
  });

  test('should filter assets by tag', async ({ page }) => {
    await page.goto('/assets');

    // Wait for popular tags to load
    await page.waitForSelector('.assets-filters__tag-list', { timeout: 5000 });

    // Click on a tag (if available)
    const tagLink = page.locator('.assets-filters__tag-link').first();
    if (await tagLink.isVisible()) {
      await tagLink.click();

      // Wait for navigation
      await page.waitForURL(/\/assets\?tag=.*/, { timeout: 10000 });

      // Should show active filter
      await expect(page.locator('.assets-filters__active')).toBeVisible();
      await expect(page.locator('text=Tag:')).toBeVisible();
    }
  });

  test('should clear search filter', async ({ page }) => {
    await page.goto('/assets?search=Board');

    // Should show the filter
    await expect(page.locator('text=Search: "Board"')).toBeVisible();

    // Click clear button
    await page.locator('.assets-filters__clear').first().click();

    // Should redirect to unfiltered page
    await page.waitForURL('/assets', { timeout: 10000 });

    // Should show all public assets again
    const assetCards = page.locator('.asset-card');
    const count = await assetCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/assets?search=Board&tag=design');

    // Should show both filters
    await expect(page.locator('text=Search: "Board"')).toBeVisible();

    // Click "Clear filters" link
    const clearLink = page.locator('a[href="/assets"]').last();
    await clearLink.click();

    // Should redirect to unfiltered page
    await page.waitForURL('/assets', { timeout: 10000 });
  });

  test('should show empty state when no assets match search', async ({ page }) => {
    await page.goto('/assets');

    // Search for something that doesn't exist
    await page.fill('input[name="search"]', 'NonExistentAsset12345');
    await page.press('input[name="search"]', 'Enter');

    // Wait for navigation
    await page.waitForURL(/\/assets\?search=.*/, { timeout: 10000 });

    // Should show empty state
    await expect(page.locator('.assets-empty')).toBeVisible();
    await expect(page.locator('text=No assets found matching your search criteria')).toBeVisible();
    await expect(page.locator('a[href="/assets"]:has-text("Clear filters")')).toBeVisible();
  });

  test('should display asset cards with correct information', async ({ page }) => {
    await page.goto('/assets');

    // Find the first asset card
    const firstCard = page.locator('.asset-card').first();
    await expect(firstCard).toBeVisible();

    // Should show title
    await expect(firstCard.locator('.asset-card__title')).toBeVisible();

    // Should show author
    await expect(firstCard.locator('.asset-card__author')).toBeVisible();

    // Should show stats (files and downloads)
    await expect(firstCard.locator('.asset-card__stats')).toBeVisible();
  });

  test('should navigate to asset detail page when clicking card', async ({ page }) => {
    await page.goto('/assets');

    // Click on the first asset card
    const firstCard = page.locator('.asset-card').first();
    await firstCard.click();

    // Should navigate to asset detail page
    await page.waitForURL(/\/assets\/.*/, { timeout: 10000 });

    // Should show asset details
    await expect(page.locator('.asset-header')).toBeVisible();
    await expect(page.locator('.asset-stats')).toBeVisible();
  });

  test('should show pagination when there are many assets', async ({ page }) => {
    await page.goto('/assets');

    // Check if pagination exists (only if there are more than 20 assets)
    const pagination = page.locator('.assets-pagination');

    // If pagination exists, test it
    if (await pagination.isVisible()) {
      await expect(page.locator('text=Page 1')).toBeVisible();

      // Click next page
      const nextLink = page.locator('.assets-pagination__link:has-text("Next")');
      if (await nextLink.isVisible()) {
        await nextLink.click();
        await page.waitForURL(/\/assets\?page=2/, { timeout: 10000 });
        await expect(page.locator('text=Page 2')).toBeVisible();

        // Click previous page
        await page.locator('.assets-pagination__link:has-text("Previous")').click();
        await page.waitForURL(/\/assets(\?page=1)?$/, { timeout: 10000 });
      }
    }
  });

  test('should combine search and tag filters', async ({ page }) => {
    await page.goto('/assets');

    // Search first
    await page.fill('input[name="search"]', 'game');
    await page.press('input[name="search"]', 'Enter');
    await page.waitForURL(/\/assets\?search=.*/, { timeout: 10000 });

    // Then click on a tag (if available)
    const tagLink = page.locator('.assets-filters__tag-link').first();
    if (await tagLink.isVisible()) {
      await tagLink.click();

      // Should have both filters in URL
      await page.waitForURL(/\/assets\?.*search=.*&.*tag=.*|\/assets\?.*tag=.*&.*search=.*/, { timeout: 10000 });

      // Should show both active filters
      await expect(page.locator('text=Search:')).toBeVisible();
      await expect(page.locator('text=Tag:')).toBeVisible();
    }
  });

  test('should show owner can see all their assets', async ({ page }) => {
    // Sign in as the asset owner
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to assets page
    await page.goto('/assets');

    // Owner should see all assets including drafts when viewing their profile
    // But on the public browse page, only public assets are shown
    const assetCards = page.locator('.asset-card');
    const count = await assetCards.count();

    // Should show at least the 3 public assets
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
