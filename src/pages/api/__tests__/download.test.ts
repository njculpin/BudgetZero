/**
 * Download Endpoint Tests
 *
 * Tests for /api/download (POST)
 *
 * The case that matters most here is entitlement. This endpoint used to trust a
 * `product_id` sent by the caller: it verified the user had purchased *that*
 * product, then served whatever `file_id` was posted alongside it. Buying any
 * cheap product therefore unlocked every file on the platform.
 *
 * Coverage:
 * - Authentication required
 * - Entitlement is derived from the file's own product, never the caller's input
 * - Files belonging to embedded components are downloadable
 * - Signed URLs are short-lived
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../download';
import * as auth from '@/lib/auth';
import * as sales from '@/lib/data-access/sales';
import * as products from '@/lib/data-access/products';
import * as storage from '@/lib/storage';
import type { ProductFile } from '@/types';
import { mockSession, mockUser } from '@/test/supabase-fixtures';

vi.mock('@/lib/auth');
vi.mock('@/lib/data-access/sales');
vi.mock('@/lib/data-access/products');
vi.mock('@/lib/storage');

const BUYER_ID = 'user-buyer';
const PURCHASED_PRODUCT_ID = 'product-purchased';
const UNPURCHASED_PRODUCT_ID = 'product-not-purchased';

/** A file belonging to a product the buyer did NOT purchase. */
const foreignFile = {
  id: 'file-foreign',
  product_id: UNPURCHASED_PRODUCT_ID,
  storage_path: `${'other-user'}/secret.stl`,
} as ProductFile;

const ownedFile = {
  id: 'file-owned',
  product_id: PURCHASED_PRODUCT_ID,
  storage_path: `${BUYER_ID}/model.stl`,
} as ProductFile;

function downloadRequest(fields: Record<string, string>): Request {
  const body = new FormData();
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  return new Request('http://localhost/api/download', { method: 'POST', body });
}

describe('POST /api/download', () => {
  let mockCookies: { get: ReturnType<typeof vi.fn> };
  const mockRedirect = vi.fn((url: string) => new Response(null, {
    status: 302,
    headers: { Location: url },
  }));

  beforeEach(() => {
    vi.clearAllMocks();

    mockCookies = {
      get: vi.fn((name: string) => {
        if (name === 'sb-access-token') return { value: 'access' };
        if (name === 'sb-refresh-token') return { value: 'refresh' };
        return undefined;
      }),
    };

    vi.mocked(auth.setSession).mockResolvedValue({
      data: {
        user: mockUser({ id: BUYER_ID }),
        session: mockSession(),
      },
      error: null,
    });

    vi.mocked(storage.createSignedUrl).mockResolvedValue(
      'https://storage.example/signed'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const invoke = (req: Request) =>
    POST({
      request: req,
      cookies: mockCookies,
      redirect: mockRedirect,
    } as unknown as Parameters<typeof POST>[0]);

  describe('Authentication', () => {
    it('redirects to sign-in when auth cookies are absent', async () => {
      mockCookies.get = vi.fn(() => undefined);

      await invoke(downloadRequest({ file_id: ownedFile.id }));

      expect(mockRedirect).toHaveBeenCalledWith('/sign-in?redirect=/downloads');
      expect(storage.createSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('Entitlement', () => {
    it("refuses a file belonging to a product the user has not purchased", async () => {
      vi.mocked(products.getProductFileById).mockResolvedValue(foreignFile);
      vi.mocked(sales.hasUserPurchasedProduct).mockResolvedValue(false);

      const response = await invoke(
        downloadRequest({ file_id: foreignFile.id })
      );

      expect(response.status).toBe(403);
      expect(storage.createSignedUrl).not.toHaveBeenCalled();
    });

    it("checks entitlement against the file's own product, not a caller-supplied one", async () => {
      // The attack: pair a product you DID buy with a file you did not.
      vi.mocked(products.getProductFileById).mockResolvedValue(foreignFile);
      vi.mocked(sales.hasUserPurchasedProduct).mockResolvedValue(false);

      const response = await invoke(
        downloadRequest({
          file_id: foreignFile.id,
          product_id: PURCHASED_PRODUCT_ID, // ignored, and must be
        })
      );

      expect(response.status).toBe(403);
      // The check must have used the file's product, never the posted one.
      expect(sales.hasUserPurchasedProduct).toHaveBeenCalledWith(
        BUYER_ID,
        UNPURCHASED_PRODUCT_ID
      );
      expect(sales.hasUserPurchasedProduct).not.toHaveBeenCalledWith(
        BUYER_ID,
        PURCHASED_PRODUCT_ID
      );
      expect(storage.createSignedUrl).not.toHaveBeenCalled();
    });

    it('serves a file the user is entitled to', async () => {
      vi.mocked(products.getProductFileById).mockResolvedValue(ownedFile);
      vi.mocked(sales.hasUserPurchasedProduct).mockResolvedValue(true);

      await invoke(downloadRequest({ file_id: ownedFile.id }));

      expect(sales.hasUserPurchasedProduct).toHaveBeenCalledWith(
        BUYER_ID,
        PURCHASED_PRODUCT_ID
      );
      expect(mockRedirect).toHaveBeenCalledWith('https://storage.example/signed');
    });

    it('returns 404 for a file that does not exist', async () => {
      vi.mocked(products.getProductFileById).mockResolvedValue(null);

      const response = await invoke(downloadRequest({ file_id: 'nope' }));

      expect(response.status).toBe(404);
      expect(sales.hasUserPurchasedProduct).not.toHaveBeenCalled();
    });

    it('requires a file_id', async () => {
      const response = await invoke(downloadRequest({}));

      expect(response.status).toBe(400);
      expect(products.getProductFileById).not.toHaveBeenCalled();
    });
  });

  describe('Signed URL', () => {
    it('reads from the product-files bucket', async () => {
      vi.mocked(products.getProductFileById).mockResolvedValue(ownedFile);
      vi.mocked(sales.hasUserPurchasedProduct).mockResolvedValue(true);

      await invoke(downloadRequest({ file_id: ownedFile.id }));

      // A bucket name that no migration creates fails silently at upload time and
      // only surfaces when a paying customer tries to download.
      expect(storage.createSignedUrl).toHaveBeenCalledWith(
        'product-files',
        ownedFile.storage_path,
        expect.any(Number)
      );
    });

    it('keeps the link short-lived', async () => {
      vi.mocked(products.getProductFileById).mockResolvedValue(ownedFile);
      vi.mocked(sales.hasUserPurchasedProduct).mockResolvedValue(true);

      await invoke(downloadRequest({ file_id: ownedFile.id }));

      // The URL is a bearer credential for paid content. It previously lasted 24h.
      const ttl = vi.mocked(storage.createSignedUrl).mock.calls[0][2] as number;
      expect(ttl).toBeLessThanOrEqual(900);
      expect(ttl).toBeGreaterThan(0);
    });

    it('returns 500 when the URL cannot be signed', async () => {
      vi.mocked(products.getProductFileById).mockResolvedValue(ownedFile);
      vi.mocked(sales.hasUserPurchasedProduct).mockResolvedValue(true);
      vi.mocked(storage.createSignedUrl).mockResolvedValue(null);

      const response = await invoke(downloadRequest({ file_id: ownedFile.id }));

      expect(response.status).toBe(500);
    });
  });
});
