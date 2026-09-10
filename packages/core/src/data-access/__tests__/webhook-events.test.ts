/**
 * Webhook Idempotency Tests
 *
 * Stripe delivers every webhook at least once and retries on any non-2xx. Without
 * a claim, one retry of `checkout.session.completed` creates a second sale and a
 * second set of royalty obligations for a single payment.
 *
 * The claim is an INSERT against a UNIQUE constraint, so the database — not
 * application logic — decides who wins under concurrent delivery. These tests pin
 * the contract that makes that safe:
 *   - a unique violation means "already claimed", not an error
 *   - any OTHER database failure must throw, so the caller returns non-2xx and
 *     Stripe retries rather than silently dropping a paid order
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  claimWebhookEvent,
  markWebhookEventProcessed,
  releaseWebhookEvent,
} from '../webhook-events';
import { serverClient } from '../client';
import { mockTables } from '../../test/supabase-query-mock';

vi.mock('../client', () => ({
  serverClient: { from: vi.fn() },
}));

const EVENT_ID = 'evt_test_123';
const PAYLOAD = { id: 'cs_test', amount_total: 1999 };

describe('claimWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('claims an event that has not been seen before', async () => {
    mockTables(serverClient, {
      stripe_webhook_events: { data: null, error: null },
    });

    await expect(
      claimWebhookEvent(EVENT_ID, 'checkout.session.completed', PAYLOAD)
    ).resolves.toBe(true);
  });

  it('declines a duplicate delivery rather than processing it twice', async () => {
    // 23505 = unique_violation. This is the whole mechanism.
    mockTables(serverClient, {
      stripe_webhook_events: {
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      },
    });

    await expect(
      claimWebhookEvent(EVENT_ID, 'checkout.session.completed', PAYLOAD)
    ).resolves.toBe(false);
  });

  it('throws on any other database failure so Stripe retries', async () => {
    mockTables(serverClient, {
      stripe_webhook_events: {
        data: null,
        error: { code: '08006', message: 'connection failure' },
      },
    });

    // Returning false here would look like a duplicate and silently abandon a
    // paid order. Returning true would process against a broken database.
    await expect(
      claimWebhookEvent(EVENT_ID, 'checkout.session.completed', PAYLOAD)
    ).rejects.toThrow(/connection failure/);
  });

  it('does not mistake a non-unique constraint violation for a duplicate', async () => {
    mockTables(serverClient, {
      stripe_webhook_events: {
        data: null,
        error: { code: '23503', message: 'foreign key violation' },
      },
    });

    await expect(
      claimWebhookEvent(EVENT_ID, 'checkout.session.completed', PAYLOAD)
    ).rejects.toThrow();
  });
});

describe('markWebhookEventProcessed', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not throw when the update fails', async () => {
    mockTables(serverClient, {
      stripe_webhook_events: { data: null, error: { message: 'nope' } },
    });

    // Fulfilment already succeeded by this point. Failing to stamp the row must
    // not turn a completed order into a 500 and a pointless Stripe retry.
    await expect(
      markWebhookEventProcessed(EVENT_ID)
    ).resolves.toBeUndefined();
  });
});

describe('releaseWebhookEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not throw when the delete fails', async () => {
    mockTables(serverClient, {
      stripe_webhook_events: { data: null, error: { message: 'nope' } },
    });

    // Called from an error path; it must not mask the original failure.
    await expect(releaseWebhookEvent(EVENT_ID)).resolves.toBeUndefined();
  });
});
