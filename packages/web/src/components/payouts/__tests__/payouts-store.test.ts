import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MINIMUM_PAYOUT_CENTS,
  PAYOUTS_CHANGED,
  announcePayoutChange,
  fetchBalance,
  isBrowser,
  requestPayout,
} from '../payouts-store';

/**
 * These exercise the real functions the payouts islands call. The page they
 * replaced put the same logic in an inline `<script>`, where nothing could
 * reach it — including its own Retry button, which called `loadData()` from
 * module scope and silently did nothing.
 */

const originalFetch = global.fetch;

function respond(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('fetchBalance', () => {
  it('returns the balance payload on success', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      respond(200, { availableBalance: 5000, transactionCount: 3, payouts: [] })
    );

    const balance = await fetchBalance();

    expect(global.fetch).toHaveBeenCalledWith('/api/payouts/get-balance');
    expect(balance.availableBalance).toBe(5000);
    expect(balance.transactionCount).toBe(3);
  });

  it('surfaces the server error message rather than a generic one', async () => {
    // The user needs to know *why* — "Stripe account not connected" is
    // actionable, "Failed to load balance" is not.
    vi.mocked(global.fetch).mockResolvedValue(
      respond(400, { error: 'Stripe account not connected' })
    );

    await expect(fetchBalance()).rejects.toThrow('Stripe account not connected');
  });

  it('falls back to a message when the server sends none', async () => {
    vi.mocked(global.fetch).mockResolvedValue(respond(500, {}));

    await expect(fetchBalance()).rejects.toThrow('Failed to load balance');
  });
});

describe('requestPayout', () => {
  it('posts the amount in cents', async () => {
    // The form collects dollars. Sending 25 instead of 2500 would request a
    // hundredth of the money.
    vi.mocked(global.fetch).mockResolvedValue(respond(200, { ok: true }));

    await requestPayout(2500, 'April earnings');

    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe('/api/payouts/request-payout');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      amountCents: 2500,
      notes: 'April earnings',
    });
  });

  it('omits empty notes instead of sending an empty string', async () => {
    vi.mocked(global.fetch).mockResolvedValue(respond(200, { ok: true }));

    await requestPayout(2500, '');

    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse(String(init?.body))).toEqual({ amountCents: 2500 });
  });

  it('sends JSON content type so the controller parses the body', async () => {
    vi.mocked(global.fetch).mockResolvedValue(respond(200, { ok: true }));

    await requestPayout(1000);

    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('surfaces the server error message', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      respond(409, { error: 'Insufficient balance' })
    );

    await expect(requestPayout(999999)).rejects.toThrow('Insufficient balance');
  });

  it('does not resolve on a failed request', async () => {
    // The caller closes the dialog and shows a confirmation on resolve; if a
    // rejection came back as success the user would be told it worked.
    vi.mocked(global.fetch).mockResolvedValue(respond(500, {}));

    await expect(requestPayout(1000)).rejects.toThrow();
  });
});

describe('MINIMUM_PAYOUT_CENTS', () => {
  it('is ten dollars, matching what the form and the copy claim', () => {
    expect(MINIMUM_PAYOUT_CENTS).toBe(1000);
  });
});

describe('isBrowser', () => {
  it('is truthy in a browser so the resource loads', () => {
    expect(isBrowser()).toBe(true);
  });

  it('is undefined with no window, so the resource never fetches during SSR', () => {
    // Both islands are client:load, so these modules also run while Astro
    // renders them on the server. Fetching there would resolve '/api/...'
    // against no origin and throw.
    vi.stubGlobal('window', undefined);

    expect(isBrowser()).toBeUndefined();

    vi.unstubAllGlobals();
  });
});

describe('announcePayoutChange', () => {
  it('fires an event the history card can hear', () => {
    // The two cards read the same endpoint; without this the history still
    // shows the balance from before the request.
    const heard = vi.fn();
    window.addEventListener(PAYOUTS_CHANGED, heard);

    announcePayoutChange();

    expect(heard).toHaveBeenCalledOnce();
    window.removeEventListener(PAYOUTS_CHANGED, heard);
  });

  it('does nothing with no window rather than throwing', () => {
    vi.stubGlobal('window', undefined);

    expect(() => announcePayoutChange()).not.toThrow();

    vi.unstubAllGlobals();
  });
});
