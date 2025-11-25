import { test, expect } from '@playwright/test';

/**
 * P2: Visual Regression Tests for Browse Pages
 *
 * Protects the recent DRY CSS refactor (2024-11-24) where ~855 lines
 * of duplicate CSS were consolidated into shared .browse-* classes.
 *
 * These tests create baseline screenshots and detect visual changes:
 * - Layout shifts
 * - Styling regressions
 * - Responsive breakpoint issues
 * - Component positioning
 *
 * Business Impact: Visual bugs damage brand trust and usability.
 */

test.describe('Visual Regression - Browse Pages', () => {
  test.describe('Products Page', () => {
    test('products browse page matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Hide dynamic content (dates, user-specific data)
      await page.evaluate(() => {
        // Hide timestamps
        document.querySelectorAll('[data-timestamp]').forEach(el => {
          (el as HTMLElement).textContent = '2024-01-01';
        });

        // Hide user avatars (vary by user)
        document.querySelectorAll('.avatar img').forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });

      // Wait for images to load
      await page.waitForTimeout(1000);

      // Full page screenshot
      await expect(page).toHaveScreenshot('products-browse-full.png', {
        fullPage: true,
      });
    });

    test('products browse page header matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Screenshot just the header area
      const header = page.locator('.page-header-with-action').first();
      await expect(header).toHaveScreenshot('products-header.png');
    });

    test('products search form matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const searchForm = page.locator('.browse-search').first();
      await expect(searchForm).toHaveScreenshot('products-search-form.png');
    });

    test('products tag filters match baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const tags = page.locator('.browse-tags').first();

      if (await tags.isVisible()) {
        await expect(tags).toHaveScreenshot('products-tag-filters.png');
      }
    });

    test('product card matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const firstCard = page.locator('.browse-card').first();
      await expect(firstCard).toBeVisible();

      // Hide dynamic content
      await firstCard.evaluate(card => {
        // Hide user avatars
        const avatar = card.querySelector('.browse-card__author');
        if (avatar) {
          (avatar as HTMLElement).textContent = 'by Test User';
        }
      });

      await expect(firstCard).toHaveScreenshot('product-card.png');
    });

    test('products pagination matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const pagination = page.locator('.browse-pagination').first();

      if (await pagination.isVisible()) {
        await expect(pagination).toHaveScreenshot('products-pagination.png');
      }
    });

    test('products empty state matches baseline', async ({ page }) => {
      // Search for something that won't exist
      await page.goto('/products?search=xyznonexistentproduct123');
      await page.waitForLoadState('networkidle');

      const emptyState = page.locator('.browse-empty').first();

      if (await emptyState.isVisible()) {
        await expect(emptyState).toHaveScreenshot('products-empty-state.png');
      }
    });
  });

  test.describe('Assets Page', () => {
    test('assets browse page matches baseline', async ({ page }) => {
      await page.goto('/assets');
      await page.waitForLoadState('networkidle');

      // Hide dynamic content
      await page.evaluate(() => {
        document.querySelectorAll('[data-timestamp]').forEach(el => {
          (el as HTMLElement).textContent = '2024-01-01';
        });
        document.querySelectorAll('.avatar img').forEach(el => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });

      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('assets-browse-full.png', {
        fullPage: true,
      });
    });

    test('asset card matches baseline', async ({ page }) => {
      await page.goto('/assets');
      await page.waitForLoadState('networkidle');

      const firstCard = page.locator('.browse-card').first();

      if (await firstCard.isVisible()) {
        await firstCard.evaluate(card => {
          const author = card.querySelector('.browse-card__author');
          if (author) {
            (author as HTMLElement).textContent = 'by Test User';
          }
        });

        await expect(firstCard).toHaveScreenshot('asset-card.png');
      }
    });
  });

  test.describe('Jams Page', () => {
    test('jams browse page matches baseline', async ({ page }) => {
      await page.goto('/jams');
      await page.waitForLoadState('networkidle');

      // Hide dynamic content
      await page.evaluate(() => {
        document.querySelectorAll('[data-timestamp]').forEach(el => {
          (el as HTMLElement).textContent = '2024-01-01';
        });
        document.querySelectorAll('.jam-dates').forEach(el => {
          (el as HTMLElement).textContent = '01/01/2024 - 01/31/2024';
        });
      });

      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('jams-browse-full.png', {
        fullPage: true,
      });
    });

    test('jam card with status badges matches baseline', async ({ page }) => {
      await page.goto('/jams');
      await page.waitForLoadState('networkidle');

      const firstCard = page.locator('.browse-card').first();

      if (await firstCard.isVisible()) {
        await firstCard.evaluate(card => {
          const author = card.querySelector('.browse-card__author');
          if (author) {
            (author as HTMLElement).textContent = 'by Test User';
          }
          const dates = card.querySelector('.jam-dates');
          if (dates) {
            (dates as HTMLElement).textContent = '01/01/2024 - 01/31/2024';
          }
        });

        await expect(firstCard).toHaveScreenshot('jam-card.png');
      }
    });
  });

  test.describe('BrowseCTA Component', () => {
    test('browse CTA matches baseline (desktop)', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Sign out to see CTA
      const signOutButton = page.locator('button:has-text("Sign out")').first();
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForTimeout(500);
      }

      // Navigate to a product detail (CTA shows there)
      await page.goto('/products');
      const firstCard = page.locator('.browse-card').first();

      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForTimeout(1000);

        const cta = page.locator('.browse-cta').first();

        if (await cta.isVisible()) {
          await expect(cta).toHaveScreenshot('browse-cta-desktop.png');
        }
      }
    });

    test('browse CTA matches baseline (mobile)', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Sign out to see CTA
      const signOutButton = page.locator('button:has-text("Sign out")').first();
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForTimeout(500);
      }

      // Navigate to product detail
      await page.goto('/products');
      const firstCard = page.locator('.browse-card').first();

      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForTimeout(1000);

        const cta = page.locator('.browse-cta').first();

        if (await cta.isVisible()) {
          // Buttons should stack vertically on mobile
          await expect(cta).toHaveScreenshot('browse-cta-mobile.png');
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('products page mobile layout matches baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        document.querySelectorAll('[data-timestamp]').forEach(el => {
          (el as HTMLElement).textContent = '2024-01-01';
        });
      });

      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('products-mobile.png', {
        fullPage: true,
      });
    });

    test('products page tablet layout matches baseline', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        document.querySelectorAll('[data-timestamp]').forEach(el => {
          (el as HTMLElement).textContent = '2024-01-01';
        });
      });

      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('products-tablet.png', {
        fullPage: true,
      });
    });

    test('products grid responsive behavior', async ({ page }) => {
      // Desktop: Multiple columns
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const grid = page.locator('.browse-grid').first();
      const gridColumns = await grid.evaluate(el => {
        return window.getComputedStyle(el).gridTemplateColumns;
      });

      // Should have multiple columns (at least 2)
      const columnCount = gridColumns.split(' ').length;
      expect(columnCount).toBeGreaterThanOrEqual(2);

      // Mobile: Single column
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      const mobileGrid = page.locator('.browse-grid').first();
      const mobileColumns = await mobileGrid.evaluate(el => {
        return window.getComputedStyle(el).gridTemplateColumns;
      });

      // Should be single column
      const mobileColumnCount = mobileColumns.split(' ').length;
      expect(mobileColumnCount).toBe(1);
    });
  });

  test.describe('Focus States', () => {
    test('product card focus state matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const firstCard = page.locator('.browse-card').first();
      await firstCard.focus();

      await expect(firstCard).toHaveScreenshot('product-card-focus.png');
    });

    test('tag filter focus state matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const firstTag = page.locator('.browse-tags__tag').first();

      if (await firstTag.isVisible()) {
        await firstTag.focus();
        await expect(firstTag).toHaveScreenshot('tag-filter-focus.png');
      }
    });

    test('pagination link focus state matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const paginationLink = page.locator('.browse-pagination__link').first();

      if (await paginationLink.isVisible()) {
        await paginationLink.focus();
        await expect(paginationLink).toHaveScreenshot('pagination-focus.png');
      }
    });
  });

  test.describe('Interactive States', () => {
    test('product card hover state matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const firstCard = page.locator('.browse-card').first();
      await firstCard.hover();

      // Wait for transition
      await page.waitForTimeout(300);

      await expect(firstCard).toHaveScreenshot('product-card-hover.png');
    });

    test('search button hover state matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const searchButton = page.locator('.browse-search__btn').first();
      await searchButton.hover();
      await page.waitForTimeout(300);

      await expect(searchButton).toHaveScreenshot('search-button-hover.png');
    });
  });

  test.describe('Color Theme', () => {
    test('products page light theme matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Ensure light theme
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
      });

      await page.waitForTimeout(500);

      const header = page.locator('.page-header-with-action').first();
      await expect(header).toHaveScreenshot('products-header-light.png');
    });

    // Dark theme test (if/when implemented)
    test.skip('products page dark theme matches baseline', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Set dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });

      await page.waitForTimeout(500);

      const header = page.locator('.page-header-with-action').first();
      await expect(header).toHaveScreenshot('products-header-dark.png');
    });
  });
});
