import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should show unauthenticated navigation on landing page', async ({ page }) => {
    await page.goto('/');

    // Should show brand
    await expect(page.locator('.navigation__logo')).toContainText('Game Loopers');

    // Should show main navigation links
    await expect(page.locator('a[href="/products"]')).toBeVisible();
    await expect(page.locator('a[href="/assets"]')).toBeVisible();
    await expect(page.locator('a[href="/jams"]')).toBeVisible();
    await expect(page.locator('a[href="/users"]')).toBeVisible();

    // Should show sign in and sign up buttons
    await expect(page.locator('a[href="/sign-in"]')).toBeVisible();
    await expect(page.locator('a[href="/sign-up"]')).toBeVisible();

    // Should NOT show dashboard or sign out
    await expect(page.locator('a[href="/dashboard"]')).not.toBeVisible();
    await expect(page.locator('form[action="/api/auth/sign-out"]')).not.toBeVisible();
  });

  test('should show authenticated navigation when logged in', async ({ page }) => {
    // Sign in first
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.goto('/sign-up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]:has-text("Create account")');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to home
    await page.goto('/');

    // Should show dashboard and sign out
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('form[action="/api/auth/sign-out"]')).toBeVisible();

    // Should NOT show sign in and sign up
    await expect(page.locator('a[href="/sign-in"]')).not.toBeVisible();
    await expect(page.locator('a[href="/sign-up"]')).not.toBeVisible();
  });
});
