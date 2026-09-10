import { createSignal, createResource, Show, For } from 'solid-js';
import Modal, { ModalFooter } from '@/components/modal/modal';
import LoadingButton from '@/components/interactive/loading-button/loading-button';
import { formatMoney } from '@gameloopers/core/utils/money';
import type { Payout } from '@gameloopers/core/types';
import './payout-dashboard.css';

/**
 * Balance, payout history and the request dialog.
 *
 * This was a page-level `<script>` that fetched the balance and then wrote the
 * result with `innerHTML`, template-stringing class names that lived in a page
 * stylesheet. The dialog it opened was a `<div>` toggled with
 * `style.display`: no focus trap, no Escape key, no scroll lock, and the
 * success path called `alert()`.
 */

/** Stripe will not send a transfer below this, so neither will we. */
const MINIMUM_PAYOUT_CENTS = 1000;

interface BalanceResponse {
  availableBalance: number;
  transactionCount: number;
  payouts: Payout[];
}

async function fetchBalance(): Promise<BalanceResponse> {
  const response = await fetch('/api/payouts/get-balance');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load balance');
  }

  return data as BalanceResponse;
}

export default function PayoutDashboard() {
  const [balance, { refetch }] = createResource(fetchBalance);

  const [isDialogOpen, setDialogOpen] = createSignal(false);
  const [amount, setAmount] = createSignal('');
  const [notes, setNotes] = createSignal('');
  const [formError, setFormError] = createSignal<string | null>(null);
  const [isSubmitting, setSubmitting] = createSignal(false);
  const [confirmation, setConfirmation] = createSignal<string | null>(null);

  const availableCents = () => balance()?.availableBalance ?? 0;
  const canRequest = () => availableCents() >= MINIMUM_PAYOUT_CENTS;

  function openDialog() {
    // The whole balance is the usual request, so it is the starting value.
    setAmount((availableCents() / 100).toFixed(2));
    setNotes('');
    setFormError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setFormError(null);
  }

  async function submit(event: Event) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const amountCents = Math.round(parseFloat(amount()) * 100);

      const response = await fetch('/api/payouts/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, notes: notes() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request payout');
      }

      closeDialog();
      await refetch();
      setConfirmation(
        'Payout requested. You will be notified when it has been processed.'
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to request payout');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Show when={confirmation()}>
        <p class="payout-dashboard__confirmation" role="status">
          {confirmation()}
        </p>
      </Show>

      <div class="payout-dashboard__balance">
        <Show
          when={!balance.loading}
          fallback={
            <p class="payout-dashboard__loading" role="status">
              Loading balance...
            </p>
          }
        >
          <Show
            when={!balance.error}
            fallback={
              <div class="payout-dashboard__error">
                <p role="alert">Failed to load balance</p>
                <button
                  type="button"
                  class="button button--outline button--sm"
                  onClick={() => refetch()}
                >
                  Retry
                </button>
              </div>
            }
          >
            <p class="payout-dashboard__amount">{formatMoney(availableCents())}</p>
            <p class="payout-dashboard__source">
              From {balance()?.transactionCount ?? 0}{' '}
              {balance()?.transactionCount === 1 ? 'transaction' : 'transactions'}
            </p>
            <Show
              when={canRequest()}
              fallback={
                <p class="payout-dashboard__minimum">
                  Minimum payout amount is {formatMoney(MINIMUM_PAYOUT_CENTS)}
                </p>
              }
            >
              <button
                type="button"
                class="button button--primary button--md"
                onClick={openDialog}
              >
                Request Payout
              </button>
            </Show>
          </Show>
        </Show>
      </div>

      <section class="payout-dashboard__history">
        <h2 class="payout-dashboard__history-title">Payout History</h2>
        <Show
          when={!balance.loading}
          fallback={
            <p class="payout-dashboard__loading" role="status">
              Loading history...
            </p>
          }
        >
          <Show
            when={(balance()?.payouts.length ?? 0) > 0}
            fallback={<p class="payout-dashboard__empty">No payout requests yet</p>}
          >
            <ul class="payout-dashboard__list">
              <For each={balance()?.payouts}>
                {(payout) => (
                  <li class="payout-dashboard__payout">
                    <span class="payout-dashboard__payout-amount">
                      {formatMoney(payout.amount_cents)}
                    </span>
                    <span class="payout-dashboard__payout-date">
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
      </section>

      <Modal
        isOpen={isDialogOpen()}
        onClose={closeDialog}
        title="Request Payout"
        size="sm"
      >
        <form onSubmit={submit} class="payout-dashboard__form">
          <div class="form-field">
            <label for="payout-amount" class="form-field__label">
              Amount
            </label>
            <div class="input-group">
              <span class="input-group__prefix" aria-hidden="true">
                $
              </span>
              <input
                id="payout-amount"
                class="input input--prefixed"
                type="number"
                step="0.01"
                min={MINIMUM_PAYOUT_CENTS / 100}
                max={availableCents() / 100}
                placeholder="0.00"
                required
                value={amount()}
                onInput={(e) => setAmount(e.currentTarget.value)}
              />
            </div>
            <p class="form-field__help">
              Minimum payout: {formatMoney(MINIMUM_PAYOUT_CENTS)}
            </p>
          </div>

          <div class="form-field">
            <label for="payout-notes" class="form-field__label">
              Notes (optional)
            </label>
            <textarea
              id="payout-notes"
              class="textarea"
              rows={3}
              placeholder="Add any notes about this payout..."
              value={notes()}
              onInput={(e) => setNotes(e.currentTarget.value)}
            />
          </div>

          <Show when={formError()}>
            <p class="form-field__error" role="alert">
              {formError()}
            </p>
          </Show>

          <ModalFooter>
            <button
              type="button"
              class="button button--outline button--md"
              onClick={closeDialog}
            >
              Cancel
            </button>
            <LoadingButton type="submit" isLoading={isSubmitting()} variant="primary">
              Request Payout
            </LoadingButton>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
