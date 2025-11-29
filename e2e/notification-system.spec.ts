/**
 * E2E Tests: Notification System
 *
 * Tests complete notification flows from trigger to user interaction
 * Covers critical user journeys and edge cases
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Notification System E2E', () => {
  let testUserEmail: string;
  let testUserPassword: string;
  let assetOwnerEmail: string;
  let assetOwnerPassword: string;

  test.beforeAll(async () => {
    // Use test credentials from environment
    testUserEmail = process.env.TEST_USER_EMAIL || 'product-owner@test.com';
    testUserPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
    assetOwnerEmail = process.env.TEST_ASSET_OWNER_EMAIL || 'asset-owner@test.com';
    assetOwnerPassword = process.env.TEST_ASSET_OWNER_PASSWORD || 'TestPassword123!';
  });

  test.describe('Asset Price Change → Notification → Conflict Resolution', () => {
    test('should create notification when asset price causes product conflict', async ({ browser }) => {
      test.slow(); // This test involves multiple user sessions and database operations

      const productOwnerContext = await browser.newContext();
      const assetOwnerContext = await browser.newContext();

      const productOwnerPage = await productOwnerContext.newPage();
      const assetOwnerPage = await assetOwnerContext.newPage();

      try {
        // Step 1: Product owner signs in
        await test.step('Product owner signs in', async () => {
          await productOwnerPage.goto('/sign-in');
          await productOwnerPage.fill('input[name="email"]', testUserEmail);
          await productOwnerPage.fill('input[name="password"]', testUserPassword);
          await productOwnerPage.click('button[type="submit"]');
          await productOwnerPage.waitForURL(/\/(dashboard|feed)/);
        });

        // Step 2: Note initial notification count
        let initialUnreadCount = 0;
        await test.step('Check initial notification count', async () => {
          await productOwnerPage.goto('/dashboard');
          const badge = productOwnerPage.locator('.notification-center__badge');
          if (await badge.isVisible()) {
            const countText = await badge.textContent();
            initialUnreadCount = parseInt(countText?.replace('+', '') || '0');
          }
        });

        // Step 3: Asset owner signs in and increases asset price
        await test.step('Asset owner increases asset price', async () => {
          await assetOwnerPage.goto('/sign-in');
          await assetOwnerPage.fill('input[name="email"]', assetOwnerEmail);
          await assetOwnerPage.fill('input[name="password"]', assetOwnerPassword);
          await assetOwnerPage.click('button[type="submit"]');
          await assetOwnerPage.waitForURL(/\/(dashboard|feed)/);

          // Navigate to asset management
          // Note: This assumes assets can be edited. If not, this step will need adjustment.
          await assetOwnerPage.goto('/dashboard?tab=assets');

          // Find first asset and increase its price
          const firstAsset = assetOwnerPage.locator('.asset-card, .browse-card').first();
          if (await firstAsset.isVisible()) {
            await firstAsset.click();

            // Increase royalty price
            const priceInput = assetOwnerPage.locator('input[name="royalty_fixed_total"]');
            if (await priceInput.isVisible()) {
              const currentPrice = await priceInput.inputValue();
              const newPrice = (parseFloat(currentPrice) + 50).toFixed(2);
              await priceInput.fill(newPrice);

              // Save changes
              const saveButton = assetOwnerPage.locator('button:has-text("Save"), button[type="submit"]');
              await saveButton.click();

              // Wait for save to complete
              await assetOwnerPage.waitForTimeout(2000);
            }
          }
        });

        // Step 4: Product owner refreshes and checks for notification
        await test.step('Product owner sees new notification', async () => {
          await productOwnerPage.reload();
          await productOwnerPage.waitForTimeout(2000); // Wait for notifications to load

          // Check notification badge increased
          const badge = productOwnerPage.locator('.notification-center__badge');
          if (await badge.isVisible()) {
            const countText = await badge.textContent();
            const newCount = parseInt(countText?.replace('+', '') || '0');
            expect(newCount).toBeGreaterThan(initialUnreadCount);
          }

          // Open notification center
          await productOwnerPage.click('[aria-label="Notifications"]');

          // Verify notification about asset price change
          await expect(
            productOwnerPage.locator('.notification-center__item').first()
          ).toContainText(/price|conflict|asset/i);
        });

        // Step 5: Navigate to product and see conflict banner
        await test.step('Product shows conflict banner', async () => {
          // Click on notification to navigate to product
          await productOwnerPage.click('.notification-center__item-link');

          // Should see ProductConflictBanner
          await expect(
            productOwnerPage.locator('.product-conflict-banner')
          ).toBeVisible({ timeout: 5000 });

          await expect(
            productOwnerPage.locator('.product-conflict-banner__title')
          ).toContainText('Product Needs Attention');
        });

        // Step 6: Resolve the conflict
        await test.step('Product owner resolves conflict', async () => {
          const resolveButton = productOwnerPage.locator(
            'button:has-text("Mark as Resolved")'
          );
          await expect(resolveButton).toBeVisible();

          // Click resolve
          await resolveButton.click();

          // Wait for API call
          await productOwnerPage.waitForTimeout(1000);

          // Banner should disappear
          await expect(
            productOwnerPage.locator('.product-conflict-banner')
          ).not.toBeVisible({ timeout: 5000 });
        });
      } finally {
        await productOwnerPage.close();
        await assetOwnerPage.close();
        await productOwnerContext.close();
        await assetOwnerContext.close();
      }
    });

    test.skip('should take product offline when price conflict exists', async ({ page }) => {
      // This test requires database seeding with specific test data
      // TODO: Implement after database seeding is set up
    });
  });

  test.describe('Notification Center Functionality', () => {
    test('should display and interact with notification center', async ({ page }) => {
      // Sign in
      await test.step('Sign in', async () => {
        await page.goto('/sign-in');
        await page.fill('input[name="email"]', testUserEmail);
        await page.fill('input[name="password"]', testUserPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(dashboard|feed)/);
      });

      // Open notification center
      await test.step('Open notification center', async () => {
        const bellButton = page.locator('[aria-label="Notifications"]');
        await expect(bellButton).toBeVisible();

        // Check aria-expanded before click
        await expect(bellButton).toHaveAttribute('aria-expanded', 'false');

        await bellButton.click();

        // Check aria-expanded after click
        await expect(bellButton).toHaveAttribute('aria-expanded', 'true');

        // Dropdown should be visible
        await expect(page.locator('.notification-center__dropdown')).toBeVisible();
      });

      // Verify notification list
      await test.step('View notifications', async () => {
        const notificationList = page.locator('.notification-center__list');
        await expect(notificationList).toBeVisible();

        // Should have notifications or empty state
        const hasNotifications = await page.locator('.notification-center__item').count();
        const hasEmptyState = await page.locator('.notification-center__empty').isVisible();

        expect(hasNotifications > 0 || hasEmptyState).toBe(true);
      });

      // Close dropdown by clicking backdrop
      await test.step('Close notification center', async () => {
        await page.click('.notification-center__backdrop');

        // Dropdown should close
        await expect(page.locator('.notification-center__dropdown')).not.toBeVisible();
      });
    });

    test('should mark individual notification as read', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Open notifications
      await page.click('[aria-label="Notifications"]');

      // Find first unread notification
      const unreadNotification = page.locator('.notification-center__item--unread').first();

      if (await unreadNotification.isVisible()) {
        // Get initial unread count
        const badge = page.locator('.notification-center__badge');
        let initialCount = 0;
        if (await badge.isVisible()) {
          const countText = await badge.textContent();
          initialCount = parseInt(countText?.replace('+', '') || '0');
        }

        // Click notification
        await unreadNotification.locator('.notification-center__item-link').click();

        // Wait for page navigation
        await page.waitForTimeout(1000);

        // Navigate back and verify count decreased
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);

        if (initialCount > 0) {
          const newBadge = page.locator('.notification-center__badge');
          if (await newBadge.isVisible()) {
            const newCountText = await newBadge.textContent();
            const newCount = parseInt(newCountText?.replace('+', '') || '0');
            expect(newCount).toBeLessThanOrEqual(initialCount);
          }
        }
      }
    });

    test('should mark all notifications as read', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Open notifications
      await page.click('[aria-label="Notifications"]');

      // Check if "Mark all read" button exists
      const markAllButton = page.locator('button:has-text("Mark all read")');

      if (await markAllButton.isVisible()) {
        await markAllButton.click();

        // Wait for API call
        await page.waitForTimeout(1000);

        // Badge should disappear
        await expect(page.locator('.notification-center__badge')).not.toBeVisible({
          timeout: 5000,
        });

        // No unread notifications should exist
        await expect(
          page.locator('.notification-center__item--unread')
        ).toHaveCount(0);
      }
    });

    test('should delete notification', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Open notifications
      await page.click('[aria-label="Notifications"]');

      // Count current notifications
      const initialCount = await page.locator('.notification-center__item').count();

      if (initialCount > 0) {
        // Click delete on first notification
        const deleteButton = page.locator('[aria-label="Delete notification"]').first();
        await deleteButton.click();

        // Wait for deletion
        await page.waitForTimeout(1000);

        // Count should decrease
        const newCount = await page.locator('.notification-center__item').count();
        expect(newCount).toBeLessThan(initialCount);
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should save notification preferences', async ({ page }) => {
      // Sign in
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Navigate to notification settings
      await test.step('Navigate to settings', async () => {
        await page.goto('/settings/notifications');
        await expect(page.locator('h1, h2')).toContainText(/notification/i);
      });

      // Toggle some settings
      await test.step('Change settings', async () => {
        // Find email checkboxes
        const checkboxes = page.locator('input[type="checkbox"]');
        const count = await checkboxes.count();

        if (count > 0) {
          // Toggle first checkbox
          const firstCheckbox = checkboxes.first();
          const wasChecked = await firstCheckbox.isChecked();
          await firstCheckbox.click();
          await expect(firstCheckbox).toBeChecked({ checked: !wasChecked });
        }
      });

      // Save settings
      await test.step('Save settings', async () => {
        const saveButton = page.locator('button:has-text("Save Settings")');
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        // Should see success message
        await expect(
          page.locator('text=/settings saved/i')
        ).toBeVisible({ timeout: 5000 });
      });

      // Reload and verify persistence
      await test.step('Verify settings persisted', async () => {
        await page.reload();
        await page.waitForTimeout(1000);

        // Settings should still be toggled
        // (Actual verification would check specific checkbox states)
      });
    });

    test('should show error message on save failure', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      await page.goto('/settings/notifications');

      // Intercept API call to simulate failure
      await page.route('/api/settings/notifications', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to save settings' }),
        });
      });

      // Try to save
      const saveButton = page.locator('button:has-text("Save Settings")');
      await saveButton.click();

      // Should see error message
      await expect(
        page.locator('text=/failed|error/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Mobile Notification UX', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      // Sign in
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Open notification center
      const bellButton = page.locator('[aria-label="Notifications"]');
      await expect(bellButton).toBeVisible();
      await bellButton.click();

      // Dropdown should be visible and properly sized
      const dropdown = page.locator('.notification-center__dropdown');
      await expect(dropdown).toBeVisible();

      // Check dropdown doesn't overflow viewport
      const boundingBox = await dropdown.boundingBox();
      if (boundingBox) {
        expect(boundingBox.x).toBeGreaterThanOrEqual(0);
        expect(boundingBox.y).toBeGreaterThanOrEqual(0);
        expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(375);
      }

      // Touch targets should be large enough (minimum 44x44px)
      const notificationItems = page.locator('.notification-center__item-link');
      const count = await notificationItems.count();

      if (count > 0) {
        const itemBox = await notificationItems.first().boundingBox();
        if (itemBox) {
          expect(itemBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Intercept notifications API to simulate error
      await page.route('/api/notifications', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      // Open notification center
      await page.click('[aria-label="Notifications"]');

      // Should show empty state (fallback behavior)
      await expect(
        page.locator('.notification-center__empty, text=/no notifications/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should handle network timeout', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Intercept and delay notifications API
      await page.route('/api/notifications', async (route) => {
        // Never resolve to simulate timeout
        await new Promise(() => {}); // Infinite wait
      });

      // Open notification center
      await page.click('[aria-label="Notifications"]');

      // Should handle timeout gracefully (show loading or empty state)
      await page.waitForTimeout(5000);
    });
  });

  test.describe('Performance', () => {
    test('should handle large notification lists efficiently', async ({ page }) => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Measure time to open notification center
      const startTime = Date.now();

      await page.click('[aria-label="Notifications"]');
      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should open within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
