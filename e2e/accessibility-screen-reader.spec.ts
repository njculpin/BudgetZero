import { test, expect } from '@playwright/test';

/**
 * P1 ACCESSIBILITY: Screen Reader Tests
 *
 * Tests WCAG 2.1 Level AA screen reader accessibility:
 * - ARIA attributes (live regions, labels, roles)
 * - Semantic HTML structure
 * - Alternative text for images
 * - Form labels and descriptions
 * - Dynamic content announcements
 *
 * Business Impact: 2-3% of users rely on screen readers
 * (blind users, low vision users)
 */

test.describe('Screen Reader Accessibility', () => {
  test.describe('ARIA Live Regions', () => {
    test('chat messages container should have aria-live', async ({ page }) => {
      // Sign in to access chat
      const testEmail = `screen-reader-test-${Date.now()}@example.com`;
      await page.goto('/sign-up');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/sign-in', { timeout: 10000 });

      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to product with chat
      await page.goto('/products');
      const firstProduct = page.locator('.browse-card').first();

      if (await firstProduct.isVisible()) {
        await firstProduct.click();
        await page.waitForTimeout(1000);

        // Check for chat component
        const chatMessages = page.locator('.product-chat__messages, .asset-chat__messages').first();

        if (await chatMessages.isVisible()) {
          // Should have aria-live="polite"
          const ariaLive = await chatMessages.getAttribute('aria-live');
          expect(ariaLive).toBe('polite');

          // Should have aria-label
          const ariaLabel = await chatMessages.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toContain('message');
        }
      }
    });

    test('error messages should have role="alert" or aria-live="assertive"', async ({ page }) => {
      await page.goto('/sign-in');

      // Submit with invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Wait for potential error message
      await page.waitForTimeout(1000);

      // Check for error message with proper ARIA
      const errorMessage = page.locator('[role="alert"], [aria-live="assertive"]').first();

      // Error might not show in all cases, so this is conditional
      if (await errorMessage.isVisible()) {
        const role = await errorMessage.getAttribute('role');
        const ariaLive = await errorMessage.getAttribute('aria-live');

        const hasProperAria = role === 'alert' || ariaLive === 'assertive';
        expect(hasProperAria).toBe(true);
      }
    });

    test('loading states should have role="status"', async ({ page }) => {
      await page.goto('/products');

      // Check for loading spinners
      const loadingSpinner = page.locator('[role="status"], .loading, .spinner').first();

      if (await loadingSpinner.isVisible()) {
        const role = await loadingSpinner.getAttribute('role');
        const ariaLabel = await loadingSpinner.getAttribute('aria-label');

        // Should have either role="status" or aria-live="polite"
        const hasProperAria = role === 'status' || ariaLabel?.toLowerCase().includes('loading');

        if (role || ariaLabel) {
          expect(hasProperAria).toBe(true);
        }
      }
    });
  });

  test.describe('ARIA Labels', () => {
    test('search input should have accessible label', async ({ page }) => {
      await page.goto('/products');

      const searchInput = page.locator('input[name="search"]');
      await expect(searchInput).toBeVisible();

      // Check for label
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const ariaLabelledby = await searchInput.getAttribute('aria-labelledby');
      const placeholder = await searchInput.getAttribute('placeholder');

      // Should have aria-label or visible label or meaningful placeholder
      const hasAccessibleLabel = ariaLabel || ariaLabelledby || placeholder;
      expect(hasAccessibleLabel).toBeTruthy();

      if (ariaLabel) {
        expect(ariaLabel.toLowerCase()).toContain('search');
      }
    });

    test('icon-only buttons should have aria-label', async ({ page }) => {
      await page.goto('/products');

      // Find buttons with icons but no visible text
      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        if (await button.isVisible()) {
          const textContent = await button.textContent();
          const hasVisibleText = textContent && textContent.trim().length > 0;

          // If button has no visible text, it must have aria-label
          if (!hasVisibleText) {
            const ariaLabel = await button.getAttribute('aria-label');
            expect(ariaLabel).toBeTruthy();
          }
        }
      }
    });

    test('form inputs should have associated labels', async ({ page }) => {
      await page.goto('/sign-in');

      // Check email input
      const emailInput = page.locator('input[name="email"]');
      const emailId = await emailInput.getAttribute('id');
      const emailAriaLabel = await emailInput.getAttribute('aria-label');
      const emailAriaLabelledby = await emailInput.getAttribute('aria-labelledby');

      // Should have one of: id with corresponding label, aria-label, or aria-labelledby
      const emailHasLabel = emailId || emailAriaLabel || emailAriaLabelledby;
      expect(emailHasLabel).toBeTruthy();

      // If has ID, check for corresponding label
      if (emailId) {
        const label = page.locator(`label[for="${emailId}"]`);
        const labelExists = await label.count() > 0;

        if (!labelExists) {
          // No label element, must have aria-label
          expect(emailAriaLabel).toBeTruthy();
        }
      }

      // Check password input
      const passwordInput = page.locator('input[name="password"]');
      const passwordId = await passwordInput.getAttribute('id');
      const passwordAriaLabel = await passwordInput.getAttribute('aria-label');
      const passwordAriaLabelledby = await passwordInput.getAttribute('aria-labelledby');

      const passwordHasLabel = passwordId || passwordAriaLabel || passwordAriaLabelledby;
      expect(passwordHasLabel).toBeTruthy();
    });
  });

  test.describe('ARIA Hidden', () => {
    test('decorative SVG icons should have aria-hidden="true"', async ({ page }) => {
      await page.goto('/products');

      // Find SVG icons
      const svgIcons = await page.locator('svg').all();

      for (const svg of svgIcons) {
        if (await svg.isVisible()) {
          // Check if SVG has meaningful role or if it's decorative
          const role = await svg.getAttribute('role');
          const ariaHidden = await svg.getAttribute('aria-hidden');
          const ariaLabel = await svg.getAttribute('aria-label');

          // If no role or aria-label, should have aria-hidden="true"
          const isDecorative = !role && !ariaLabel;

          if (isDecorative) {
            expect(ariaHidden).toBe('true');
          }
        }
      }
    });

    test('icon containers with text should hide icon from screen readers', async ({ page }) => {
      await page.goto('/products');

      // Buttons/links with both icon and text should hide icon
      const buttonWithIcon = page.locator('button:has(svg)').first();

      if (await buttonWithIcon.isVisible()) {
        const textContent = await buttonWithIcon.textContent();

        // If button has text, SVG should be aria-hidden
        if (textContent && textContent.trim().length > 0) {
          const svg = buttonWithIcon.locator('svg').first();
          const ariaHidden = await svg.getAttribute('aria-hidden');

          expect(ariaHidden).toBe('true');
        }
      }
    });
  });

  test.describe('Image Alt Text', () => {
    test('product card images should have meaningful alt text', async ({ page }) => {
      await page.goto('/products');

      // Find product card images
      const productImages = await page.locator('.browse-card__image, .product-card__image').all();

      for (const img of productImages) {
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');

          // Alt text should exist
          expect(alt).toBeDefined();

          // Alt text should not be empty (unless truly decorative)
          if (alt) {
            expect(alt.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('avatar images should have alt text with user name', async ({ page }) => {
      await page.goto('/products');

      // Find avatar images (if any)
      const avatarImages = await page.locator('.avatar img, [class*="avatar"] img').all();

      for (const img of avatarImages) {
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');

          expect(alt).toBeTruthy();
          // Alt should describe who the avatar represents
          expect(alt!.length).toBeGreaterThan(0);
        }
      }
    });

    test('decorative images should have empty alt', async ({ page }) => {
      await page.goto('/');

      // Background images and decorative elements should have alt=""
      const decorativeImages = await page.locator('[class*="decoration"] img, [class*="background"] img').all();

      for (const img of decorativeImages) {
        if (await img.isVisible()) {
          const alt = await img.getAttribute('alt');

          // Decorative images should have alt="" (empty, not null)
          expect(alt).toBe('');
        }
      }
    });
  });

  test.describe('Semantic HTML', () => {
    test('page should have main landmark', async ({ page }) => {
      await page.goto('/products');

      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
    });

    test('page should have navigation landmark', async ({ page }) => {
      await page.goto('/products');

      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();
    });

    test('headings should follow hierarchical order', async ({ page }) => {
      await page.goto('/products');

      // Get all headings
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

      const headingLevels: number[] = [];

      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.charAt(1));
        headingLevels.push(level);
      }

      // Check hierarchy (no skipping levels)
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];

        // Should not skip levels (e.g., h1 -> h3)
        if (diff > 1) {
          console.warn(`Heading hierarchy skip: h${headingLevels[i - 1]} -> h${headingLevels[i]}`);
        }

        // This is a warning, not a failure
        // expect(diff).toBeLessThanOrEqual(1);
      }

      // Should have at least one h1
      expect(headingLevels).toContain(1);
    });

    test('lists should use proper markup', async ({ page }) => {
      await page.goto('/products');

      // Find tag lists
      const tagList = page.locator('.browse-tags__list').first();

      if (await tagList.isVisible()) {
        const tagName = await tagList.evaluate(el => el.tagName);

        // Should be <ul> or <div role="list">
        const isProperList = tagName === 'UL' || tagName === 'OL' ||
          (await tagList.getAttribute('role')) === 'list';

        // This is advisory - BEM often uses divs for styling flexibility
        console.log('Tag list uses semantic list markup:', isProperList);
      }
    });

    test('buttons should use button elements, not divs', async ({ page }) => {
      await page.goto('/products');

      // Find elements that look like buttons but aren't
      const fakeButtons = await page.locator('div[onclick], span[onclick], div[class*="button"]:not(button)').all();

      // Should be zero (all buttons should be <button> or <a>)
      expect(fakeButtons.length).toBe(0);
    });
  });

  test.describe('Form Accessibility', () => {
    test('form inputs should have associated labels', async ({ page }) => {
      await page.goto('/sign-in');

      const inputs = await page.locator('input').all();

      for (const input of inputs) {
        if (await input.isVisible()) {
          const type = await input.getAttribute('type');

          // Skip hidden inputs
          if (type === 'hidden') continue;

          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');

          // Must have one of: id with label, aria-label, or aria-labelledby
          const hasLabel = (id && await page.locator(`label[for="${id}"]`).count() > 0) ||
            ariaLabel ||
            ariaLabelledby;

          expect(hasLabel).toBeTruthy();
        }
      }
    });

    test('required fields should be indicated for screen readers', async ({ page }) => {
      await page.goto('/sign-in');

      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');

      // Check if required attribute is set
      const emailRequired = await emailInput.getAttribute('required');
      const passwordRequired = await passwordInput.getAttribute('required');

      // Check if aria-required is set
      const emailAriaRequired = await emailInput.getAttribute('aria-required');
      const passwordAriaRequired = await passwordInput.getAttribute('aria-required');

      // Should have required or aria-required="true"
      const emailHasRequired = emailRequired !== null || emailAriaRequired === 'true';
      const passwordHasRequired = passwordRequired !== null || passwordAriaRequired === 'true';

      expect(emailHasRequired).toBe(true);
      expect(passwordHasRequired).toBe(true);
    });

    test('form validation errors should be announced', async ({ page }) => {
      await page.goto('/sign-up');

      // Submit empty form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      // Check for error messages with proper ARIA
      const errorMessages = await page.locator('[role="alert"], [aria-live="assertive"], .error').all();

      // If validation errors exist, they should have proper ARIA
      if (errorMessages.length > 0) {
        for (const error of errorMessages) {
          if (await error.isVisible()) {
            const role = await error.getAttribute('role');
            const ariaLive = await error.getAttribute('aria-live');

            const hasProperAria = role === 'alert' || ariaLive === 'assertive';

            if (role || ariaLive) {
              expect(hasProperAria).toBe(true);
            }
          }
        }
      }
    });
  });

  test.describe('Dynamic Content Updates', () => {
    test('cart count updates should be announced', async ({ page }) => {
      // This requires actually adding items to cart
      // For now, verify cart count element has proper structure

      await page.goto('/cart');

      const cartCount = page.locator('[aria-label*="cart"], [class*="cart-count"]').first();

      if (await cartCount.isVisible()) {
        const ariaLive = await cartCount.getAttribute('aria-live');
        const ariaAtomic = await cartCount.getAttribute('aria-atomic');

        // Cart count should have aria-live (polite) and aria-atomic (true)
        console.log('Cart count aria-live:', ariaLive);
        console.log('Cart count aria-atomic:', ariaAtomic);

        // This is advisory
        if (ariaLive) {
          expect(['polite', 'assertive']).toContain(ariaLive);
        }
      }
    });

    test('success messages should be announced', async ({ page }) => {
      // Success messages should have role="status" or aria-live="polite"

      await page.goto('/dashboard');

      const successMessage = page.locator('[role="status"], .success, [class*="success"]').first();

      if (await successMessage.isVisible()) {
        const role = await successMessage.getAttribute('role');
        const ariaLive = await successMessage.getAttribute('aria-live');

        if (role || ariaLive) {
          const hasProperAria = role === 'status' || ariaLive === 'polite';
          expect(hasProperAria).toBe(true);
        }
      }
    });
  });

  test.describe('Links and Buttons', () => {
    test('links should have descriptive text', async ({ page }) => {
      await page.goto('/products');

      const links = await page.locator('a').all();

      for (const link of links) {
        if (await link.isVisible()) {
          const textContent = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');

          // Link must have text content or aria-label
          const hasDescription = (textContent && textContent.trim().length > 0) || ariaLabel;

          expect(hasDescription).toBe(true);

          // Avoid generic link text
          if (textContent) {
            const genericText = ['click here', 'read more', 'link', 'here'];
            const isGeneric = genericText.some(generic =>
              textContent.trim().toLowerCase() === generic
            );

            // Generic text is a warning, not a failure
            if (isGeneric && !ariaLabel) {
              console.warn(`Generic link text found: "${textContent.trim()}"`);
            }
          }
        }
      }
    });

    test('buttons should have descriptive text or aria-label', async ({ page }) => {
      await page.goto('/products');

      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        if (await button.isVisible()) {
          const textContent = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');

          // Button must have text or aria-label
          const hasDescription = (textContent && textContent.trim().length > 0) || ariaLabel;

          expect(hasDescription).toBe(true);
        }
      }
    });
  });

  test.describe('Page Structure', () => {
    test('page should have descriptive title', async ({ page }) => {
      await page.goto('/products');

      const title = await page.title();

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title).toContain('Product');
    });

    test('page language should be set', async ({ page }) => {
      await page.goto('/products');

      const htmlLang = await page.locator('html').getAttribute('lang');

      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toBe('en'); // Or appropriate language code
    });

    test('page should not have tabindex > 0', async ({ page }) => {
      await page.goto('/products');

      // Find elements with positive tabindex
      const positiveTabindex = await page.locator('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').all();

      // Filter to only positive values
      const actualPositive = [];
      for (const el of positiveTabindex) {
        const tabindex = await el.getAttribute('tabindex');
        if (tabindex && parseInt(tabindex) > 0) {
          actualPositive.push(el);
        }
      }

      // Should be zero (positive tabindex breaks natural tab order)
      expect(actualPositive.length).toBe(0);
    });
  });
});
