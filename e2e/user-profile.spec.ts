import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Need service role to query users table
);

test.describe('User Profile Creation', () => {
  test('should create user profile in database on sign up', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Sign up
    await page.goto('/sign-up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]:has-text("Create account")');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check if user profile was created in database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail);

    expect(error).toBeNull();
    expect(users).toHaveLength(1);

    const user = users![0];
    expect(user.email).toBe(testEmail);
    expect(user.handle).toMatch(/^[a-z0-9]+-[a-z0-9]{4}$/); // Should match pattern: username-xxxx
    expect(user.deleted).toBe(false);
    expect(user.created_at).toBeTruthy();
    expect(user.updated_at).toBeTruthy();
  });
});
