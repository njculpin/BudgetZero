import { Show, For, createResource, onCleanup } from 'solid-js';
import { formatMoney } from '@gameloopers/core/utils/money';
import {
  PAYOUTS_CHANGED,
  fetchBalance,
  isBrowser,
} from '@/components/payouts/payouts-store';
import './payout-history.css';

/**
 * Past payout requests. Reads the same resource as the balance card, so a
 * successful request refreshes this list without a second round trip.
 */
export default function PayoutHistory() {
  const [balance, { refetch }] = createResource(isBrowser, fetchBalance);

  if (typeof window !== 'undefined') {
    const onChange = () => refetch();
    window.addEventListener(PAYOUTS_CHANGED, onChange);
    onCleanup(() => window.removeEventListener(PAYOUTS_CHANGED, onChange));
  }

  return (
    <Show
      when={!balance.loading}
      fallback={
        <p class="payout-history__pending" role="status">
          Loading history...
        </p>
      }
    >
      <Show
        when={(balance()?.payouts.length ?? 0) > 0}
        fallback={<p class="payout-history__empty">No payout requests yet</p>}
      >
        <ul class="payout-history">
          <For each={balance()?.payouts}>
            {(payout) => (
              <li class="payout-history__item">
                <span class="payout-history__amount">
                  {formatMoney(payout.amount_cents)}
                </span>
                <span class="payout-history__date">
                  {new Date(payout.requested_at).toLocaleDateString()}
                </span>
                <span class={`status-badge status-badge--${payout.status}`}>
                  {payout.status}
                </span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </Show>
  );
}
