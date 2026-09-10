import { makeContext } from '@gameloopers/api/test-support';
/**
 * Payout Execution Endpoint Tests
 *
 * Tests for POST /api/payouts/execute — the route that moves real money out of
 * the platform. It had no test at any level, and that is the file where a
 * double-payout bug was found today.
 *
 * The invariant this endpoint exists to protect: the Stripe transfer is a point
 * of no return. Anything failing BEFORE it may release the reservation; nothing
 * failing after it ever may, because the money has already gone.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { payoutsExecute } from '@gameloopers/api/controllers/payouts/execute';
import * as admin from '@gameloopers/core/auth/admin';
import * as users from '@gameloopers/core/data-access/users';
import * as payouts from '@gameloopers/core/data-access/payouts';
import * as payments from '@gameloopers/core/payments';
import type { Payout, PayoutItem, User } from '@gameloopers/core/types';
import type Stripe from 'stripe';

vi.mock('@gameloopers/core/auth/admin');
vi.mock('@gameloopers/core/data-access/users');
vi.mock('@gameloopers/core/data-access/payouts');
vi.mock('@gameloopers/core/payments');
vi.mock('@gameloopers/core/monitoring');

const PAYOUT_ID = '11111111-1111-1111-1111-111111111111';
const RECIPIENT_ID = '22222222-2222-2222-2222-222222222222';
const ADMIN_ID = '33333333-3333-3333-3333-333333333333';

const pendingPayout = {
  id: PAYOUT_ID,
  user_id: RECIPIENT_ID,
  amount_cents: 5000,
  currency: 'usd',
  status: 'pending',
} as Payout;

const eligibleRecipient = {
  id: RECIPIENT_ID,
  stripe_connect_account_id: 'acct_live',
  stripe_connect_payouts_enabled: true,
} as User;

const backingItems = [
  { id: 'i1', amount_cents: 3000, voided: false },
  { id: 'i2', amount_cents: 2000, voided: false },
] as PayoutItem[];

function invoke(userId: string | null = ADMIN_ID) {
  return payoutsExecute(
    makeContext({
      userId,
      clientAddress: '203.0.113.5',
      request: new Request('http://localhost/api/payouts/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId: PAYOUT_ID }),
      }),
    })
  );
}

describe('POST /api/payouts/execute', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(admin.verifyAdmin).mockResolvedValue({
      authorized: true,
      userId: ADMIN_ID,
    });
    vi.mocked(admin.logAdminAction).mockResolvedValue(null);
    vi.mocked(payouts.getPayoutById).mockResolvedValue(pendingPayout);
    vi.mocked(users.getUserById).mockResolvedValue(eligibleRecipient);
    vi.mocked(payouts.claimPayoutForProcessing).mockResolvedValue(true);
    vi.mocked(payouts.getPayoutItems).mockResolvedValue(backingItems);
    vi.mocked(payouts.releasePayout).mockResolvedValue(2);
    vi.mocked(payouts.settlePayout).mockResolvedValue(2);
    vi.mocked(payments.createTransfer).mockResolvedValue({
      id: 'tr_success',
    } as Stripe.Transfer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authorization', () => {
    it('rejects a non-admin without touching money', async () => {
      vi.mocked(admin.verifyAdmin).mockResolvedValue({
        authorized: false,
        error: 'Insufficient permissions',
      });

      const response = await invoke();

      expect(response.status).toBe(403);
      expect(payments.createTransfer).not.toHaveBeenCalled();
    });

    it('returns 401 rather than 403 for an unauthenticated caller', async () => {
      vi.mocked(admin.verifyAdmin).mockResolvedValue({
        authorized: false,
        error: 'Not authenticated',
      });

      expect((await invoke()).status).toBe(401);
    });
  });

  describe('Recipient eligibility', () => {
    it('refuses to transfer when Connect payouts are not enabled', async () => {
      // A Connect account can be restricted or have transfers revoked between the
      // request and the admin clicking Pay. Checking only that an account id
      // exists let the queue keep offering a transfer that fails every time.
      vi.mocked(users.getUserById).mockResolvedValue({
        ...eligibleRecipient,
        stripe_connect_payouts_enabled: false,
      } as User);

      const response = await invoke();

      expect(response.status).toBe(400);
      expect(payments.createTransfer).not.toHaveBeenCalled();
      // The earnings must go back, not sit reserved against a payout that cannot run.
      expect(payouts.releasePayout).toHaveBeenCalledWith(
        PAYOUT_ID,
        expect.stringMatching(/payouts are not enabled/i)
      );
    });

    it('refuses to transfer when there is no Connect account', async () => {
      vi.mocked(users.getUserById).mockResolvedValue({
        ...eligibleRecipient,
        stripe_connect_account_id: null,
      } as User);

      expect((await invoke()).status).toBe(400);
      expect(payments.createTransfer).not.toHaveBeenCalled();
      expect(payouts.releasePayout).toHaveBeenCalled();
    });
  });

  describe('Integrity check', () => {
    it('refuses to wire an amount not backed by reserved items', async () => {
      // request_payout always writes matching items, so a mismatch means
      // something upstream is wrong in a way that must not be papered over.
      vi.mocked(payouts.getPayoutItems).mockResolvedValue([
        { id: 'i1', amount_cents: 1000, voided: false },
      ] as PayoutItem[]);

      const response = await invoke();

      expect(response.status).toBe(500);
      expect(payments.createTransfer).not.toHaveBeenCalled();
      expect(payouts.releasePayout).toHaveBeenCalled();
    });

    it('ignores voided items when totalling the backing', async () => {
      vi.mocked(payouts.getPayoutItems).mockResolvedValue([
        ...backingItems,
        { id: 'i3', amount_cents: 9999, voided: true },
      ] as PayoutItem[]);

      // The voided line must not count toward the 5000 backing, or a released
      // item would make an under-backed payout look correct.
      expect((await invoke()).status).toBe(200);
      expect(payments.createTransfer).toHaveBeenCalled();
    });
  });

  describe('Concurrency', () => {
    it('refuses when another execution already claimed the payout', async () => {
      vi.mocked(payouts.claimPayoutForProcessing).mockResolvedValue(false);

      const response = await invoke();

      expect(response.status).toBe(409);
      expect(payments.createTransfer).not.toHaveBeenCalled();
    });

    it('refuses a payout that is not pending', async () => {
      vi.mocked(payouts.getPayoutById).mockResolvedValue({
        ...pendingPayout,
        status: 'paid',
      } as Payout);

      expect((await invoke()).status).toBe(400);
      expect(payments.createTransfer).not.toHaveBeenCalled();
    });
  });

  describe('The transfer', () => {
    it('passes an idempotency key derived from the payout', async () => {
      await invoke();

      // Without this, a lost response means the caller releases the reservation
      // while Stripe has already created the transfer — and the same earnings
      // become payable a second time.
      expect(payments.createTransfer).toHaveBeenCalledWith(
        'acct_live',
        5000,
        'usd',
        expect.objectContaining({ payout_id: PAYOUT_ID }),
        `payout_${PAYOUT_ID}`
      );
    });

    it('settles and reports success', async () => {
      const response = await invoke();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(payouts.settlePayout).toHaveBeenCalledWith(PAYOUT_ID, 'tr_success');
      expect(body.transferId).toBe('tr_success');
    });
  });

  describe('Failure before the transfer releases the reservation', () => {
    it('releases and reports failure when the transfer throws', async () => {
      vi.mocked(payments.createTransfer).mockRejectedValue(new Error('card_declined'));

      const response = await invoke();

      expect(response.status).toBe(500);
      // No money moved, so the creator's earnings must return to their balance.
      expect(payouts.releasePayout).toHaveBeenCalledWith(PAYOUT_ID, 'card_declined');
      expect(payouts.settlePayout).not.toHaveBeenCalled();
    });

    it('does not let a release failure mask the transfer failure', async () => {
      vi.mocked(payments.createTransfer).mockRejectedValue(new Error('card_declined'));
      vi.mocked(payouts.releasePayout).mockRejectedValue(
        new Error('database unreachable')
      );

      // The response must still describe the transfer problem, and the route must
      // not throw its way into a generic 500 that loses the cause.
      const response = await invoke();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.details).toBe('card_declined');
    });
  });

  describe('Failure AFTER the transfer never releases', () => {
    it('does not release when settlement fails', async () => {
      vi.mocked(payouts.settlePayout).mockRejectedValue(
        new Error('database unreachable')
      );

      const response = await invoke();
      const body = await response.json();

      expect(response.status).toBe(500);

      // This is the double-payout guard. The recipient has the money; releasing
      // would return the royalties to their balance and let them be paid again.
      expect(payouts.releasePayout).not.toHaveBeenCalled();
      expect(body.error).toMatch(/settlement failed/i);
      expect(body.details).toMatch(/do not retry/i);
      expect(body.transferId).toBe('tr_success');
    });

    it('does not let audit logging undo a completed payout', async () => {
      vi.mocked(admin.logAdminAction).mockRejectedValue(
        new Error('audit log unavailable')
      );

      const response = await invoke();

      // Settlement already happened; a logging failure must not roll it back.
      expect(response.status).toBe(200);
      expect(payouts.releasePayout).not.toHaveBeenCalled();
      expect(payouts.settlePayout).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('rejects a missing payout id', async () => {
      const response = await payoutsExecute(
        makeContext({
          userId: ADMIN_ID,
          clientAddress: '203.0.113.5',
          request: new Request('http://localhost/api/payouts/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }),
        })
      );

      expect(response.status).toBe(400);
      expect(payments.createTransfer).not.toHaveBeenCalled();
    });

    it('returns 404 for a payout that does not exist', async () => {
      vi.mocked(payouts.getPayoutById).mockResolvedValue(null);

      expect((await invoke()).status).toBe(404);
      expect(payments.createTransfer).not.toHaveBeenCalled();
    });
  });
});
