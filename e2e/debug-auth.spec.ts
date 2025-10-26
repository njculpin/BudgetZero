import { test, expect } from '@playwright/test';

const TEST_EMAIL = `debug-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test('debug sign-up and sign-in flow', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  page.on('response', response => {
    if (response.url().includes('/api/auth/')) {
      console.log(`API Response: ${response.url()} - ${response.status()}`);
      response.text().then(text => console.log('Response body:', text)).catch(() => {});
    }
  });

  // Sign up
  console.log('=== STARTING SIGN-UP ===');
  await page.goto('/sign-up');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('form button[type="submit"]:has-text("Create account")');

  console.log('Waiting for redirect to /sign-in...');
  await page.waitForURL('/sign-in', { timeout: 10000 });
  console.log('Successfully redirected to /sign-in');

  // Sign in
  console.log('=== STARTING SIGN-IN ===');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);

  console.log('Clicking Sign in button...');
  await page.click('form button[type="submit"]:has-text("Sign in")');

  console.log('Waiting for redirect to /dashboard...');
  try {
    await page.waitForURL('/dashboard', { timeout: 15000 });
    console.log('Successfully redirected to /dashboard');
  } catch (error) {
    console.log('TIMEOUT waiting for /dashboard');
    console.log('Current URL:', page.url());
    console.log('Page content:', await page.content());
  }
});
