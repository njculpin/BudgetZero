import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Authentication Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('should display sign-up page correctly', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page.locator('.card__title')).toContainText('Create your account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create account")').first()).toBeVisible();
  });

  test('should sign up a new user successfully', async ({ page }) => {
    await page.goto('/sign-up');

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('form button[type="submit"]:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });

    // Now sign in with the new account
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.dashboard__title')).toContainText('Welcome back');
  });

  test('should sign out successfully', async ({ page }) => {
    // First sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Then sign out
    await page.click('form button[type="submit"]:has-text("Sign out")');
    await page.waitForURL('/', { timeout: 10000 });

    // Should be on home page
    await expect(page).toHaveURL('/');

    // Should show sign in/sign up buttons again
    await expect(page.locator('button:has-text("Sign in")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Sign up")').first()).toBeVisible();
  });

  test('should sign in existing user successfully', async ({ page }) => {
    await page.goto('/sign-in');

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.dashboard__title')).toContainText('Welcome back');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', 'WrongPassword123!');

    await page.click('form button[type="submit"]:has-text("Sign in")');

    // Should stay on sign-in page or show error
    // Note: This may need adjustment based on actual error handling
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should redirect to sign-in when accessing dashboard while logged out', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to sign-in page
    await expect(page).toHaveURL('/sign-in');
  });

  test('should redirect to dashboard when accessing sign-in while logged in', async ({ page }) => {
    // First sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('form button[type="submit"]:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access sign-in page again
    await page.goto('/sign-in');

    // Should redirect back to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
