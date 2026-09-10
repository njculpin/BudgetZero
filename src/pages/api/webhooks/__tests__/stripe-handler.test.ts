/**
 * Stripe Webhook Handler Tests
 *
 * Tests for POST /api/webhooks/stripe by importing the handler and mocking the
 * abstraction layers beneath it.
 *
 * The existing stripe.test.ts does NOT do this — it hand-writes inserts against
 * Postgres and asserts they landed, so it is testing the database rather than the
 * handler. Every bug found in this file today (retries that could never progress,
 * validation failures orphaning the event claim, partial refunds voiding a whole
 * royalty) was invisible to it.
 *
 * The invariant: a customer has paid. Fulfilment either completes, or fails in a
 * way a retry can finish, or shouts. It must never fail quietly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../stripe';
import * as payments from '@/lib/payments';
import * as sales from '@/lib/data-access/sales';
import * as cart from '@/lib/data-access/cart';
import * as products from '@/lib/data-access/products';
import * as royalties from '@/lib/data-access/royalties';
import * as payouts from '@/lib/data-access/payouts';
import * as users from '@/lib/data-access/users';
import * as webhookEvents from '@/lib/data-access/webhook-events';
import * as email from '@/lib/email/purchase-confirmation';
import * as monitoring from '@/lib/monitoring';
import type { Sale, SaleItem, Product } from '@/types';
import type Stripe from 'stripe';

vi.mock('@/lib/payments');
vi.mock('@/lib/data-access/sales');
vi.mock('@/lib/data-access/cart');
vi.mock('@/lib/data-access/products');
vi.mock('@/lib/data-access/royalties');
vi.mock('@/lib/data-access/payouts');
vi.mock('@/lib/data-access/users');
vi.mock('@/lib/data-access/webhook-events');
vi.mock('@/lib/email/purchase-confirmation');
vi.mock('@/lib/monitoring');

const EVENT_ID = 'evt_test_1';
const SALE_ID = 'sale-1';
const PRODUCT_ID = 'product-1';
const CHARGE_ID = 'pi_test_1';

function checkoutEvent(overrides: Record<string, unknown> = {}): Stripe.Event {
  return {
    id: EVENT_ID,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_1',
        payment_intent: CHARGE_ID,
        customer_email: 'buyer@example.com',
        amount_total: 5000,
        currency: 'usd',
        metadata: { userId: 'user-1', cartId: 'cart-1' },
        ...overrides,
      },
    },
  } as unknown as Stripe.Event;
}

function post(): Promise<Response> {
  return POST({
    request: new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: '{}',
    }),
  } as unknown as Parameters<typeof POST>[0]);
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(payments.verifyWebhookSignature).mockReturnValue(checkoutEvent());
    vi.mocked(webhookEvents.claimWebhookEvent).mockResolvedValue(true);
    vi.mocked(webhookEvents.markWebhookEventProcessed).mockResolvedValue();
    vi.mocked(webhookEvents.releaseWebhookEvent).mockResolvedValue();

    vi.mocked(cart.getCartItems).mockResolvedValue([
      { id: 'ci-1', product_id: PRODUCT_ID, quantity: 1 },
    ] as never);
    vi.mocked(cart.clearCart).mockResolvedValue(true);

    vi.mocked(sales.getSaleByStripeChargeId).mockResolvedValue(null);
    vi.mocked(sales.createSale).mockResolvedValue({
      id: SALE_ID,
      price_cents: 5000,
    } as Sale);
    vi.mocked(sales.getSaleItems).mockResolvedValue([]);
    vi.mocked(sales.createSaleItem).mockResolvedValue({
      id: 'si-1',
    } as SaleItem);

    vi.mocked(products.getProductById).mockResolvedValue({
      id: PRODUCT_ID,
      title: 'A product',
      description: '',
    } as Product);
    vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
      filePriceTotal: 4000,
      documentPriceTotal: 0,
      embeddedPriceTotal: 0,
      subtotal: 4545,
      platformFee: 455,
      totalPrice: 5000,
    });
    vi.mocked(products.getProductComponents).mockResolvedValue([]);
    vi.mocked(royalties.createRoyaltyTransactionsForProduct).mockResolvedValue([]);
    vi.mocked(email.sendPurchaseConfirmation).mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Idempotency', () => {
    it('acknowledges a duplicate delivery without fulfilling again', async () => {
      vi.mocked(webhookEvents.claimWebhookEvent).mockResolvedValue(false);

      const response = await post();
      const body = await response.json();

      // Stripe retries on any non-2xx, so a duplicate must return 200 or it
      // retries forever. And it must not create a second sale.
      expect(response.status).toBe(200);
      expect(body.duplicate).toBe(true);
      expect(sales.createSale).not.toHaveBeenCalled();
    });

    it('returns 500 so Stripe retries when the claim itself fails', async () => {
      vi.mocked(webhookEvents.claimWebhookEvent).mockRejectedValue(
        new Error('database unreachable')
      );

      // Returning 200 here would silently drop a paid order.
      expect((await post()).status).toBe(500);
      expect(sales.createSale).not.toHaveBeenCalled();
    });

    it('releases the claim when fulfilment throws, so a retry can resume', async () => {
      vi.mocked(sales.createSaleItem).mockResolvedValue(null);

      const response = await post();

      expect(response.status).toBe(500);
      expect(webhookEvents.releaseWebhookEvent).toHaveBeenCalledWith(EVENT_ID);
      expect(monitoring.captureError).toHaveBeenCalled();
    });
  });

  describe('Resumability', () => {
    it('reuses an existing sale rather than inserting a duplicate', async () => {
      // sales.stripe_charge_id is UNIQUE. If a previous attempt created the sale
      // and then failed, a plain insert returns null, the handler throws,
      // releases, and the next retry does the same thing — forever.
      vi.mocked(sales.getSaleByStripeChargeId).mockResolvedValue({
        id: SALE_ID,
        price_cents: 5000,
      } as Sale);

      const response = await post();

      expect(response.status).toBe(200);
      expect(sales.createSale).not.toHaveBeenCalled();
      expect(sales.createSaleItem).toHaveBeenCalled();
    });

    it('skips line items a previous attempt already fulfilled', async () => {
      vi.mocked(sales.getSaleByStripeChargeId).mockResolvedValue({
        id: SALE_ID,
      } as Sale);
      vi.mocked(sales.getSaleItems).mockResolvedValue([
        { id: 'si-1', product_id: PRODUCT_ID },
      ] as SaleItem[]);

      await post();

      // Re-creating it would double the customer's entitlement and the royalties.
      expect(sales.createSaleItem).not.toHaveBeenCalled();
      expect(
        royalties.createRoyaltyTransactionsForProduct
      ).not.toHaveBeenCalled();
    });

    it('does not send a second receipt on a fully resumed run', async () => {
      vi.mocked(sales.getSaleByStripeChargeId).mockResolvedValue({
        id: SALE_ID,
      } as Sale);
      vi.mocked(sales.getSaleItems).mockResolvedValue([
        { id: 'si-1', product_id: PRODUCT_ID },
      ] as SaleItem[]);

      await post();

      expect(email.sendPurchaseConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('Validation failures are loud, not silent', () => {
    it('alerts and closes the claim on missing metadata', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue(
        checkoutEvent({ metadata: {} })
      );

      const response = await post();

      expect(response.status).toBe(400);
      // Stripe does not retry 4xx, so this event is terminal — it must alert and
      // resolve the claim rather than leaving it orphaned as unprocessed work.
      expect(monitoring.captureError).toHaveBeenCalled();
      expect(webhookEvents.markWebhookEventProcessed).toHaveBeenCalledWith(
        EVENT_ID
      );
    });

    it('alerts when the cart is empty at fulfilment time', async () => {
      vi.mocked(cart.getCartItems).mockResolvedValue([]);

      expect((await post()).status).toBe(400);
      expect(monitoring.captureError).toHaveBeenCalled();
    });
  });

  describe('Fulfilment failures are reported', () => {
    it('reports a product that cannot be resolved instead of dropping it', async () => {
      vi.mocked(products.getProductById).mockResolvedValue(null);

      await post();

      // Silently skipping ships an incomplete order with a cheerful receipt.
      expect(monitoring.captureError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ operation: 'webhook.fulfil_item' })
      );
    });

    it('reports an unpriced product', async () => {
      vi.mocked(products.getProductPriceBreakdown).mockResolvedValue({
        filePriceTotal: 0,
        documentPriceTotal: 0,
        embeddedPriceTotal: 0,
        subtotal: 0,
        platformFee: 0,
        totalPrice: 0,
      });

      await post();

      expect(monitoring.captureMessage).toHaveBeenCalled();
    });

    it('creates royalties for embedded components at their inherited price', async () => {
      vi.mocked(products.getProductComponents).mockResolvedValue([
        { child_product_id: 'child-1', inherited_price_cents: 1200 },
      ] as never);

      await post();

      expect(
        royalties.createRoyaltyTransactionsForProduct
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'child-1',
          saleItemPriceCents: 1200,
        })
      );
    });
  });

  describe('charge.refunded', () => {
    const refundEvent = (amountRefunded: number): Stripe.Event =>
      ({
        id: EVENT_ID,
        type: 'charge.refunded',
        data: {
          object: {
            payment_intent: CHARGE_ID,
            amount_refunded: amountRefunded,
            refunds: { data: [{ reason: 'requested_by_customer' }] },
          },
        },
      }) as unknown as Stripe.Event;

    beforeEach(() => {
      vi.mocked(sales.getSaleByStripeChargeId).mockResolvedValue({
        id: SALE_ID,
        price_cents: 5000,
      } as Sale);
      vi.mocked(sales.recordSaleRefund).mockResolvedValue(true);
      vi.mocked(royalties.markSaleRoyaltiesAsRefunded).mockResolvedValue(2);
      vi.mocked(payouts.releasePayoutsForSale).mockResolvedValue([]);
    });

    it('keeps the royalty on a partial refund', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue(
        refundEvent(100)
      );

      const response = await post();
      const body = await response.json();

      expect(body.partialRefund).toBe(true);
      // A $1 refund on a $50 order must not void the creator's whole royalty.
      expect(royalties.markSaleRoyaltiesAsRefunded).not.toHaveBeenCalled();
      expect(sales.recordSaleRefund).toHaveBeenCalledWith(
        SALE_ID,
        100,
        expect.any(String),
        false
      );
    });

    it('refunds royalties on a full refund', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue(
        refundEvent(5000)
      );

      await post();

      expect(royalties.markSaleRoyaltiesAsRefunded).toHaveBeenCalledWith(SALE_ID);
      expect(sales.recordSaleRefund).toHaveBeenCalledWith(
        SALE_ID,
        5000,
        expect.any(String),
        true
      );
    });

    it('releases a pending payout BEFORE refunding its royalties', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue(
        refundEvent(5000)
      );

      const order: string[] = [];
      vi.mocked(payouts.releasePayoutsForSale).mockImplementation(async () => {
        order.push('release');
        return [{ payoutId: 'p1', releasedCount: 2 }];
      });
      vi.mocked(royalties.markSaleRoyaltiesAsRefunded).mockImplementation(
        async () => {
          order.push('refund');
          return 2;
        }
      );

      await post();

      // Order matters: release_payout only restores rows still in 'reserved', so
      // refunding first would strand them in a payout that still transfers.
      expect(order).toEqual(['release', 'refund']);
    });

    it('reports a refund for a charge with no matching sale', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue(
        refundEvent(5000)
      );
      vi.mocked(sales.getSaleByStripeChargeId).mockResolvedValue(null);

      const response = await post();

      expect(response.status).toBe(200);
      expect(monitoring.captureMessage).toHaveBeenCalled();
    });
  });

  describe('transfer.reversed', () => {
    const reversalEvent = {
      id: EVENT_ID,
      type: 'transfer.reversed',
      data: { object: { id: 'tr_1', amount: 5000 } },
    } as unknown as Stripe.Event;

    it('returns the royalties to the balance', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue(reversalEvent);
      vi.mocked(payouts.reversePayout).mockResolvedValue({
        payoutId: 'p1',
        restoredCount: 2,
        amountCents: 5000,
      });

      const response = await post();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.royaltiesRestored).toBe(2);
      expect(payouts.reversePayout).toHaveBeenCalledWith(
        'tr_1',
        expect.any(String)
      );
    });

    it('escalates a reversal with no matching payout', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue(reversalEvent);
      vi.mocked(payouts.reversePayout).mockResolvedValue(null);

      const response = await post();
      const body = await response.json();

      // Money moved that this system cannot account for.
      expect(body.orphanedReversal).toBe(true);
      expect(monitoring.captureError).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          operation: 'webhook.transfer_reversed_orphan',
        })
      );
    });
  });

  describe('account.updated', () => {
    it('syncs the stored Connect capability flags', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockReturnValue({
        id: EVENT_ID,
        type: 'account.updated',
        data: {
          object: {
            id: 'acct_1',
            details_submitted: true,
            charges_enabled: true,
            payouts_enabled: false,
          },
        },
      } as unknown as Stripe.Event);
      vi.mocked(users.syncConnectAccountStatus).mockResolvedValue(true);

      await post();

      // Without this the flag only refreshes when a creator opens their settings,
      // so a restricted account keeps payouts_enabled = true indefinitely.
      expect(users.syncConnectAccountStatus).toHaveBeenCalledWith('acct_1', {
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: false,
      });
    });
  });

  describe('Signature', () => {
    it('rejects an event that fails verification', async () => {
      vi.mocked(payments.verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await post();

      expect(response.status).toBe(400);
      expect(webhookEvents.claimWebhookEvent).not.toHaveBeenCalled();
    });
  });
});
