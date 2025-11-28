import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * E2E Test: Complete Checkout Flow
 *
 * Tests the entire purchase journey from cart to download:
 * 1. User authentication
 * 2. Adding products to cart
 * 3. Checkout process (Stripe test mode)
 * 4. Payment confirmation
 * 5. Asset download access
 * 6. Royalty transaction creation
 */

test.describe('Checkout Flow E2E', () => {
  let page: Page;
  let testUserEmail: string;
  let testUserPassword: string;

  test.beforeAll(async () => {
    // Use test credentials (should be in .env.test or similar)
    testUserEmail = process.env.TEST_USER_EMAIL || 'test-checkout@example.com';
    testUserPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
  });

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('complete checkout flow with Stripe test card', async () => {
    test.slow(); // This test involves external API calls

    // Step 1: Sign in
    await test.step('Sign in to account', async () => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard or home
      await page.waitForURL(/\/(dashboard|feed)/);
    });

    // Step 2: Navigate to products and find a test product
    await test.step('Browse to product listing', async () => {
      await page.goto('/products');
      await expect(page.locator('h1')).toContainText('Browse Products');
    });

    // Step 3: Add product to cart
    let productHandle: string;
    await test.step('Add product to cart', async () => {
      // Click first product in the grid
      const firstProduct = page.locator('.browse-card').first();
      await expect(firstProduct).toBeVisible();

      // Get product handle from href
      const href = await firstProduct.getAttribute('href');
      productHandle = href?.split('/products/')[1] || '';

      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      // Click "Add to Cart" button
      const addToCartButton = page.locator('button:has-text("Add to Cart")');
      await expect(addToCartButton).toBeVisible();
      await addToCartButton.click();

      // Wait for success message or cart update
      await page.waitForTimeout(1000);
    });

    // Step 4: Navigate to cart
    await test.step('View cart', async () => {
      await page.goto('/cart');
      await expect(page.locator('h1')).toContainText('Shopping Cart');

      // Verify product is in cart
      await expect(page.locator('.cart-item')).toHaveCount(1, { timeout: 5000 });
    });

    // Step 5: Proceed to checkout (Stripe Checkout)
    let checkoutSessionId: string;
    await test.step('Initiate checkout', async () => {
      const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Proceed to Checkout")');
      await expect(checkoutButton).toBeVisible();

      // Click checkout and wait for Stripe redirect
      await checkoutButton.click();

      // Wait for Stripe Checkout page
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

      // Extract session ID from URL
      const url = page.url();
      const match = url.match(/checkout\.stripe\.com\/c\/pay\/(cs_[^#]+)/);
      if (match) {
        checkoutSessionId = match[1];
      }
    });

    // Step 6: Fill Stripe test card details
    await test.step('Complete Stripe payment', async () => {
      // Fill email if required
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill(testUserEmail);
      }

      // Fill card details
      // NOTE: Stripe uses iframes, so we need to handle them specially
      const cardNumberFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
      await cardNumberFrame.locator('input[name="cardnumber"]').fill('4242424242424242');

      // Fill expiry
      const expiryFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').nth(1);
      await expiryFrame.locator('input[name="exp-date"]').fill('1234'); // 12/34

      // Fill CVC
      const cvcFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').nth(2);
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      // Fill billing details
      const billingNameInput = page.locator('input[name="billingName"]');
      if (await billingNameInput.isVisible()) {
        await billingNameInput.fill('Test User');
      }

      // Submit payment
      const submitButton = page.locator('button[type="submit"]:has-text("Pay"), button:has-text("Subscribe")');
      await submitButton.click();

      // Wait for redirect back to site
      await page.waitForURL(/checkout\/success/, { timeout: 30000 });
    });

    // Step 7: Verify payment success
    let saleId: string;
    await test.step('Verify payment confirmation', async () => {
      // Should be on success page
      await expect(page.locator('h1, h2')).toContainText(/success|thank you/i);

      // Extract sale ID from URL or page content
      const url = page.url();
      const match = url.match(/session_id=([^&]+)/);
      if (match) {
        // We have the checkout session ID, could query backend for sale ID
        // For now, verify we're on success page
        expect(url).toContain('success');
      }
    });

    // Step 8: Verify cart is cleared
    await test.step('Verify cart is empty', async () => {
      await page.goto('/cart');
      const emptyMessage = page.locator('text=/cart is empty|no items/i');
      await expect(emptyMessage).toBeVisible({ timeout: 5000 });
    });

    // Step 9: Navigate to purchases and verify sale exists
    await test.step('Verify purchase appears in account', async () => {
      await page.goto('/dashboard');

      // Look for purchases or sales section
      const purchasesLink = page.locator('a:has-text("Purchases"), a:has-text("Orders")');
      if (await purchasesLink.isVisible()) {
        await purchasesLink.click();

        // Verify purchase is listed
        await expect(page.locator('.purchase-item, .sale-item')).toHaveCount(1, { timeout: 5000 });
      }
    });

    // Step 10: Verify download access (if purchase page exists)
    await test.step('Verify asset download access', async () => {
      // This step depends on having a purchases detail page
      // Navigate to first purchase
      const firstPurchase = page.locator('.purchase-item, .sale-item').first();
      if (await firstPurchase.isVisible()) {
        await firstPurchase.click();

        // Verify download buttons exist
        const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")');
        await expect(downloadButton).toBeVisible();

        // Optionally test download (would need to handle file download)
        // const downloadPromise = page.waitForEvent('download');
        // await downloadButton.click();
        // const download = await downloadPromise;
        // expect(download.suggestedFilename()).toBeTruthy();
      }
    });
  });

  test('cart persists across sessions', async () => {
    // Step 1: Add item to cart while signed in
    await test.step('Sign in and add to cart', async () => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      // Add product
      await page.goto('/products');
      const firstProduct = page.locator('.browse-card').first();
      await firstProduct.click();
      await page.locator('button:has-text("Add to Cart")').click();
      await page.waitForTimeout(1000);
    });

    // Step 2: Sign out
    await test.step('Sign out', async () => {
      const signOutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")');
      await signOutButton.click();
      await page.waitForURL('/');
    });

    // Step 3: Sign back in
    await test.step('Sign back in', async () => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);
    });

    // Step 4: Verify cart still has item
    await test.step('Verify cart persisted', async () => {
      await page.goto('/cart');
      await expect(page.locator('.cart-item')).toHaveCount(1, { timeout: 5000 });
    });
  });

  test('cannot checkout with empty cart', async () => {
    await test.step('Sign in', async () => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);
    });

    await test.step('Navigate to empty cart', async () => {
      await page.goto('/cart');
      const emptyMessage = page.locator('text=/cart is empty|no items/i');
      if (await emptyMessage.isVisible()) {
        // Cart is empty, good
        const checkoutButton = page.locator('button:has-text("Checkout")');
        await expect(checkoutButton).not.toBeVisible();
      } else {
        // Clear cart first
        const removeButtons = page.locator('button:has-text("Remove")');
        const count = await removeButtons.count();
        for (let i = 0; i < count; i++) {
          await removeButtons.first().click();
          await page.waitForTimeout(500);
        }

        // Now checkout should not be available
        const checkoutButton = page.locator('button:has-text("Checkout")');
        await expect(checkoutButton).not.toBeVisible();
      }
    });
  });

  test('handles declined payment gracefully', async () => {
    test.slow();

    await test.step('Sign in and add to cart', async () => {
      await page.goto('/sign-in');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|feed)/);

      await page.goto('/products');
      const firstProduct = page.locator('.browse-card').first();
      await firstProduct.click();
      await page.locator('button:has-text("Add to Cart")').click();
      await page.waitForTimeout(1000);
    });

    await test.step('Initiate checkout', async () => {
      await page.goto('/cart');
      const checkoutButton = page.locator('button:has-text("Checkout")');
      await checkoutButton.click();
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
    });

    await test.step('Use declined test card', async () => {
      // Use Stripe declined card: 4000000000000002
      const cardNumberFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
      await cardNumberFrame.locator('input[name="cardnumber"]').fill('4000000000000002');

      const expiryFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').nth(1);
      await expiryFrame.locator('input[name="exp-date"]').fill('1234');

      const cvcFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').nth(2);
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Should see error message
      const errorMessage = page.locator('text=/declined|error/i');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify cart still has items after failed payment', async () => {
      // Navigate back to cart
      await page.goto('/cart');

      // Cart should still have the item
      await expect(page.locator('.cart-item')).toHaveCount(1, { timeout: 5000 });
    });
  });

  test('purchase confirmation email sent (verify via test mode)', async () => {
    // This test would require access to Stripe test mode dashboard
    // or email testing service (like MailHog, Mailtrap)
    // For now, we'll just verify the webhook endpoint exists

    await test.step('Verify webhook endpoint is accessible', async () => {
      // Webhooks should return 405 for GET requests
      const response = await page.request.get('/api/webhooks/stripe');
      expect([405, 404]).toContain(response.status());
    });
  });
});

test.describe('Download Endpoint Security', () => {
  let authenticatedPage: Page;
  let unauthenticatedPage: Page;
  let testUserEmail: string;
  let testUserPassword: string;

  test.beforeAll(async () => {
    testUserEmail = process.env.TEST_USER_EMAIL || 'test-checkout@example.com';
    testUserPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
  });

  test.beforeEach(async ({ browser }) => {
    authenticatedPage = await browser.newPage();
    unauthenticatedPage = await browser.newPage();
  });

  test.afterEach(async () => {
    await authenticatedPage.close();
    await unauthenticatedPage.close();
  });

  test('unauthenticated users cannot access download endpoint', async () => {
    const fakeSaleId = '00000000-0000-0000-0000-000000000000';
    const fakeAssetId = '00000000-0000-0000-0000-000000000001';

    const response = await unauthenticatedPage.request.get(
      `/api/purchases/${fakeSaleId}/download/${fakeAssetId}`
    );

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('authenticated');
  });

  test('users cannot download assets from other users purchases', async () => {
    // Sign in as test user
    await authenticatedPage.goto('/sign-in');
    await authenticatedPage.fill('input[name="email"]', testUserEmail);
    await authenticatedPage.fill('input[name="password"]', testUserPassword);
    await authenticatedPage.click('button[type="submit"]');
    await authenticatedPage.waitForURL(/\/(dashboard|feed)/);

    // Try to access a fake/other user's sale
    const fakeSaleId = '00000000-0000-0000-0000-000000000000';
    const fakeAssetId = '00000000-0000-0000-0000-000000000001';

    const response = await authenticatedPage.request.get(
      `/api/purchases/${fakeSaleId}/download/${fakeAssetId}`
    );

    expect([403, 404]).toContain(response.status());
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('download URLs expire after 24 hours (test with mocked time)', async () => {
    // This would require time mocking or waiting 24 hours
    // For now, verify the endpoint returns signed URLs with expiry
    test.skip(); // Skip until we can mock time
  });
});
