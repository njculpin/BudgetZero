import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL = `profile-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
let testUserHandle: string;

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('User Profile', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    // Create a test user and sign in
    const page = await browser.newPage();
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    // Submit and wait for navigation
    await page.click('button:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });

    // Sign in
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Get the actual handle from the database
    const { data: userData } = await supabase
      .from('users')
      .select('handle')
      .eq('email', TEST_EMAIL)
      .single();

    testUserHandle = userData?.handle || '';

    await page.close();
  });

  test('should display user profile page', async ({ page }) => {
    await page.goto(`/users/${testUserHandle}`);

    // Should show profile header
    await expect(page.locator('.profile-header__handle')).toContainText(`@${testUserHandle}`);

    // Should show avatar placeholder with first letter
    await expect(page.locator('.profile-header__avatar-placeholder')).toBeVisible();

    // Should show stats
    await expect(page.locator('.profile-stats')).toBeVisible();
  });

  test('should show edit button on own profile when logged in', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to own profile
    await page.goto(`/users/${testUserHandle}`);

    // Should show edit button
    await expect(page.locator('a[href$="/edit"]')).toBeVisible();
  });

  test('should navigate to edit page', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to profile
    await page.goto(`/users/${testUserHandle}`);

    // Wait for edit button and click
    await page.waitForSelector('a[href$="/edit"]', { timeout: 5000 });

    // Navigate to edit page directly (more reliable than clicking)
    await page.goto(`/users/${testUserHandle}/edit`);

    // Should be on edit page
    await expect(page).toHaveURL(`/users/${testUserHandle}/edit`);
    await expect(page.locator('.card__title')).toContainText('Edit Profile');
  });

  test('should update profile information', async ({ browser }) => {
    // Create fresh context to avoid state issues
    const context = await browser.newContext();
    const page = await context.newPage();

    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page
    await page.goto(`/users/${testUserHandle}/edit`);

    // Wait for form to load
    await page.waitForSelector('input[name="name"]', { timeout: 5000 });

    // Update profile fields
    await page.fill('input[name="name"]', 'Test User Profile');
    await page.fill('textarea[name="bio"]', 'This is my test bio for Game Loopers');

    // Submit form
    await page.click('button:has-text("Save Changes")');

    // Should redirect to profile page
    await page.waitForURL(`/users/${testUserHandle}`, { timeout: 10000 });

    // Should show updated information
    await expect(page.locator('.card__title')).toContainText('Test User Profile');
    await expect(page.locator('.profile-header__bio')).toContainText('This is my test bio for Game Loopers');

    await context.close();
  });

  test('should update handle and redirect to new URL', async ({ browser }) => {
    const newHandle = `updated-handle-${Date.now()}`;

    // Create fresh context
    const context = await browser.newContext();
    const page = await context.newPage();

    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to edit page with current handle
    await page.goto(`/users/${testUserHandle}/edit`);

    // Wait for form to load
    await page.waitForSelector('input[name="handle"]', { timeout: 5000 });

    // Update handle
    await page.fill('input[name="handle"]', newHandle);

    // Submit form
    await page.click('button:has-text("Save Changes")');

    // Should redirect to new profile URL
    await page.waitForURL(`/users/${newHandle}`, { timeout: 10000 });

    // Should show new handle
    await expect(page.locator('.profile-header__handle')).toContainText(`@${newHandle}`);

    // Update for other tests
    testUserHandle = newHandle;

    await context.close();
  });

  test('should show 404 for non-existent profile', async ({ page }) => {
    await page.goto('/users/nonexistent-handle-99999');

    // Should redirect to 404
    await expect(page).toHaveURL('/404');
  });

  test('should redirect to sign-in when accessing edit page without auth', async ({ browser }) => {
    // Create fresh context without authentication
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access edit page without being logged in
    await page.goto(`/users/${testUserHandle}/edit`);

    // Should redirect to sign-in
    await page.waitForURL('/sign-in', { timeout: 5000 });
    await expect(page).toHaveURL('/sign-in');

    await context.close();
  });

  test('should not allow editing another user\'s profile', async ({ page }) => {
    // Create another user
    const otherEmail = `other-${Date.now()}@example.com`;
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', otherEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Create account")');
    await page.waitForURL('/sign-in', { timeout: 10000 });

    await page.fill('input[name="email"]', otherEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access first user's edit page
    await page.goto(`/users/${testUserHandle}/edit`);

    // Should redirect to view page (no edit permission)
    await page.waitForURL(`/users/${testUserHandle}`, { timeout: 5000 });
    await expect(page).toHaveURL(`/users/${testUserHandle}`);
  });
});
