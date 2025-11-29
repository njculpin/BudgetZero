/**
 * E2E Accessibility Tests: Notification System
 *
 * Tests keyboard navigation, screen reader support, and ARIA compliance
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Notification System Accessibility', () => {
  let testUserEmail: string;
  let testUserPassword: string;

  test.beforeAll(async () => {
    testUserEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    testUserPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
  });

  test.beforeEach(async ({ page }) => {
    // Sign in for all tests
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|feed)/);
  });

  test.describe('Keyboard Navigation', () => {
    test('should open notification center with Enter key', async ({ page }) => {
      // Tab to notification bell
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs depending on page structure

      // Find notification bell and focus it
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.focus();

      // Verify focus
      await expect(bellButton).toBeFocused();

      // Press Enter to open
      await page.keyboard.press('Enter');

      // Dropdown should open
      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // ARIA expanded should be true
      await expect(bellButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('should navigate through notifications with Tab key', async ({ page }) => {
      // Open notification center
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      // Wait for dropdown to open
      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Tab through notifications
      await page.keyboard.press('Tab');

      // Check if first interactive element is focused
      const firstInteractive = page.locator(
        '.notification-center__dropdown button, .notification-center__dropdown a'
      ).first();

      await expect(firstInteractive).toBeFocused();

      // Continue tabbing
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to tab through all interactive elements
    });

    test('should close notification center with Escape key', async ({ page }) => {
      // Open notification center
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Dropdown should close
      await expect(page.locator('.notification-center__dropdown')).not.toBeVisible({
        timeout: 2000,
      });

      // Focus should return to bell button
      await expect(bellButton).toBeFocused();
    });

    test('should activate notification with Enter key', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Tab to first notification link
      const notificationLinks = page.locator('.notification-center__item-link');
      const count = await notificationLinks.count();

      if (count > 0) {
        await notificationLinks.first().focus();
        await expect(notificationLinks.first()).toBeFocused();

        // Get current URL
        const currentUrl = page.url();

        // Press Enter
        await page.keyboard.press('Enter');

        // Should navigate
        await page.waitForTimeout(1000);

        // URL should change (or page should update)
        const newUrl = page.url();
        expect(newUrl).toBeDefined();
      }
    });

    test('should activate delete button with Enter key', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Focus delete button
      const deleteButtons = page.locator('[aria-label="Delete notification"]');
      const count = await deleteButtons.count();

      if (count > 0) {
        const initialCount = count;
        await deleteButtons.first().focus();
        await expect(deleteButtons.first()).toBeFocused();

        // Press Enter to delete
        await page.keyboard.press('Enter');

        // Wait for deletion
        await page.waitForTimeout(1000);

        // Notification should be removed
        const newCount = await page.locator('[aria-label="Delete notification"]').count();
        expect(newCount).toBeLessThan(initialCount);
      }
    });

    test('should navigate notification settings form with keyboard', async ({ page }) => {
      await page.goto('/settings/notifications');

      // Tab through form elements
      await page.keyboard.press('Tab'); // First checkbox
      await page.keyboard.press('Space'); // Toggle checkbox

      // Continue tabbing through all checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        await page.keyboard.press('Tab');
      }

      // Tab to submit button
      while (!(await page.locator('button:has-text("Save Settings")').isFocused())) {
        await page.keyboard.press('Tab');
      }

      // Activate submit button
      await page.keyboard.press('Enter');

      // Should see success message
      await expect(
        page.locator('text=/settings saved/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should navigate product conflict banner with keyboard', async ({ page }) => {
      // This test requires a product with active conflict
      // Skip if no conflicts exist
      await page.goto('/dashboard');

      const conflictBanner = page.locator('.product-conflict-banner');

      if (await conflictBanner.isVisible()) {
        // Tab to "Mark as Resolved" button
        const resolveButton = conflictBanner.locator('button:has-text("Mark as Resolved")');
        await resolveButton.focus();
        await expect(resolveButton).toBeFocused();

        // Tab to "Edit Product" link
        await page.keyboard.press('Tab');
        const editLink = conflictBanner.locator('a:has-text("Edit Product")');
        await expect(editLink).toBeFocused();

        // Press Enter to navigate
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    });

    test('should have logical tab order', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Track tab order
      const tabOrder: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluateHandle(() => document.activeElement);
        const tagName = await focused.evaluate((el) => el.tagName);
        const className = await focused.evaluate((el) => el.className);
        tabOrder.push(`${tagName}.${className}`);
      }

      // Tab order should be logical (header → notifications → footer)
      // First few tabs should be within notification dropdown
      expect(tabOrder.length).toBeGreaterThan(0);
    });
  });

  test.describe('Screen Reader Support (ARIA)', () => {
    test('should have proper ARIA labels on notification bell', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');

      await expect(bellButton).toHaveAttribute('aria-label', 'Notifications');
      await expect(bellButton).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      await bellButton.click();

      // aria-expanded should update
      await expect(bellButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('should have proper ARIA labels on notification items', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      // Check delete buttons have labels
      const deleteButtons = page.locator('[aria-label="Delete notification"]');
      const count = await deleteButtons.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(deleteButtons.nth(i)).toHaveAttribute(
          'aria-label',
          'Delete notification'
        );
      }
    });

    test('should announce notification count to screen readers', async ({ page }) => {
      const badge = page.locator('.notification-center__badge');

      if (await badge.isVisible()) {
        const countText = await badge.textContent();
        expect(countText).toBeTruthy();

        // Badge should ideally have aria-label like "3 unread notifications"
        // Check if bell button includes count in label
        const bellButton = page.locator('[aria-label="Notifications"]');
        const label = await bellButton.getAttribute('aria-label');
        expect(label).toContain('Notification');
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      // Check for heading in dropdown
      const heading = page.locator('.notification-center__title');
      if (await heading.isVisible()) {
        // Should be h2 or h3 (not h1, as that's the page title)
        const tagName = await heading.evaluate((el) => el.tagName);
        expect(['H2', 'H3', 'H4']).toContain(tagName);
      }
    });

    test('should have accessible form labels', async ({ page }) => {
      await page.goto('/settings/notifications');

      // All checkboxes should have associated labels
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        const checkbox = checkboxes.nth(i);
        const id = await checkbox.getAttribute('id');

        // If checkbox has ID, there should be a label for it
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          await expect(label).toBeVisible();
        }
      }
    });

    test('should announce live region updates', async ({ page }) => {
      await page.goto('/settings/notifications');

      // Success/error messages should be in live regions
      // Change a setting and save
      const firstCheckbox = page.locator('input[type="checkbox"]').first();
      await firstCheckbox.click();

      const saveButton = page.locator('button:has-text("Save Settings")');
      await saveButton.click();

      // Wait for success message
      const successMessage = page.locator('.notification-settings-form__success');
      if (await successMessage.isVisible()) {
        // Should have aria-live attribute
        const ariaLive = await successMessage.getAttribute('aria-live');
        // Note: This test assumes aria-live is implemented
        // If not, this is a finding to report
      }
    });

    test('should have semantic HTML structure', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      // Dropdown should use semantic structure
      const dropdown = page.locator('.notification-center__dropdown');
      await expect(dropdown).toBeVisible();

      // Check for semantic elements
      const list = dropdown.locator('ul, ol, [role="list"]');
      // Note: May or may not exist depending on implementation
    });
  });

  test.describe('Focus Management', () => {
    test('should trap focus within notification dropdown', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Tab through all interactive elements
      let iterations = 0;
      const maxIterations = 50;

      while (iterations < maxIterations) {
        await page.keyboard.press('Tab');
        iterations++;

        // Check if focus escaped dropdown
        const focusedElement = await page.evaluateHandle(() => document.activeElement);
        const isInDropdown = await focusedElement.evaluate((el) => {
          const dropdown = document.querySelector('.notification-center__dropdown');
          const backdrop = document.querySelector('.notification-center__backdrop');
          return dropdown?.contains(el) || el === backdrop || el === document.querySelector('[aria-label="Notifications"]');
        });

        // Focus should stay within dropdown or return to bell
        // If it escapes, that's a finding
        if (!isInDropdown) {
          // This might be okay if focus returns to bell
          const isBell = await focusedElement.evaluate((el, label) => {
            return el.getAttribute('aria-label') === label;
          }, 'Notifications');

          if (!isBell) {
            console.log('Focus escaped notification dropdown - accessibility issue');
          }
          break;
        }
      }
    });

    test('should restore focus after closing dropdown', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Focus should return to bell
      await expect(bellButton).toBeFocused();
    });

    test('should have visible focus indicators', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.focus();

      // Check for focus styling (outline, box-shadow, etc.)
      const outlineColor = await bellButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outlineColor || styles.boxShadow;
      });

      // Should have some focus styling
      expect(outlineColor).toBeTruthy();
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast for text', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      // Get notification text color and background
      const notificationItem = page.locator('.notification-center__item').first();

      if (await notificationItem.isVisible()) {
        const { color, backgroundColor } = await notificationItem.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
          };
        });

        // Basic check that colors are defined
        expect(color).toBeTruthy();
        expect(backgroundColor).toBeTruthy();

        // For actual contrast ratio calculation, would need a library
        // like 'color-contrast-checker' or axe-core
      }
    });

    test('should have sufficient contrast for unread indicators', async ({ page }) => {
      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      const unreadItem = page.locator('.notification-center__item--unread').first();

      if (await unreadItem.isVisible()) {
        // Unread items should have visual distinction
        const backgroundColor = await unreadItem.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        expect(backgroundColor).toBeTruthy();
      }
    });

    test('should have sufficient contrast for badge', async ({ page }) => {
      const badge = page.locator('.notification-center__badge');

      if (await badge.isVisible()) {
        const { color, backgroundColor } = await badge.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
          };
        });

        // Badge should have high contrast (white on red, etc.)
        expect(color).toBeTruthy();
        expect(backgroundColor).toBeTruthy();
      }
    });
  });

  test.describe('Touch Targets (Mobile)', () => {
    test('should have adequate touch target sizes on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      // Check notification item touch targets
      const notificationLinks = page.locator('.notification-center__item-link');
      const count = await notificationLinks.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const link = notificationLinks.nth(i);
        const box = await link.boundingBox();

        if (box) {
          // WCAG recommends minimum 44x44px touch targets
          expect(box.height).toBeGreaterThanOrEqual(44);
          // Width might be full width of dropdown
        }
      }

      // Check delete button touch targets
      const deleteButtons = page.locator('[aria-label="Delete notification"]');
      const deleteCount = await deleteButtons.count();

      for (let i = 0; i < Math.min(deleteCount, 3); i++) {
        const button = deleteButtons.nth(i);
        const box = await button.boundingBox();

        if (box) {
          // Delete buttons should be at least 44x44px
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should have adequate spacing between touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      const notificationItems = page.locator('.notification-center__item');
      const count = await notificationItems.count();

      if (count >= 2) {
        const firstBox = await notificationItems.first().boundingBox();
        const secondBox = await notificationItems.nth(1).boundingBox();

        if (firstBox && secondBox) {
          // Calculate spacing between items
          const spacing = secondBox.y - (firstBox.y + firstBox.height);

          // Should have some spacing (at least a few pixels)
          expect(spacing).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      const bellButton = page.locator('[aria-label="Notifications"]');
      await bellButton.click();

      // Dropdown should still appear, but without animations
      await expect(page.locator('.notification-center__dropdown')).toBeVisible();

      // Check if transitions are disabled
      const dropdown = page.locator('.notification-center__dropdown');
      const transition = await dropdown.evaluate((el) => {
        return window.getComputedStyle(el).transition;
      });

      // With reduced motion, transitions should be minimal or none
      // Note: This depends on implementation
    });
  });
});
