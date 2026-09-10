import { createResource, createSignal, Show } from 'solid-js';
import Modal, { ModalFooter } from '@/components/modal/modal';
import LoadingButton from '@/components/interactive/loading-button/loading-button';
import { formatMoney } from '@gameloopers/core/utils/money';
import {
  MINIMUM_PAYOUT_CENTS,
  announcePayoutChange,
  fetchBalance,
  isBrowser,
  requestPayout,
} from '@/components/payouts/payouts-store';
import './payout-balance.css';

/**
 * What is available to withdraw, and the dialog that withdraws it.
 *
 * This was a page-level `<script>` that fetched the balance and wrote the
 * result with `innerHTML`. The dialog it opened was a `<div>` toggled with
 * `style.display`: no focus trap, no Escape key, no scroll lock. Its Retry
 * button was `onclick="loadData()"`, which cannot resolve a function in module
 * scope, so retrying never worked.
 */
export default function PayoutBalance() {
  const [balance, { refetch }] = createResource(isBrowser, fetchBalance);

  const [isDialogOpen, setDialogOpen] = createSignal(false);
  const [amount, setAmount] = createSignal('');
  const [notes, setNotes] = createSignal('');
  const [formError, setFormError] = createSignal<string | null>(null);
  const [isSubmitting, setSubmitting] = createSignal(false);
  const [confirmation, setConfirmation] = createSignal<string | null>(null);

  const availableCents = () => balance()?.availableBalance ?? 0;
  const transactionCount = () => balance()?.transactionCount ?? 0;
  const canRequest = () => availableCents() >= MINIMUM_PAYOUT_CENTS;

  function openDialog() {
    // Withdrawing the whole balance is the usual case, so it is the default.
    setAmount((availableCents() / 100).toFixed(2));
    setNotes('');
    setFormError(null);
    setConfirmation(null);
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
      await requestPayout(Math.round(parseFloat(amount()) * 100), notes());
      closeDialog();
      await refetch();
      // The history card reads the same endpoint and has to catch up.
      announcePayoutChange();
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
        <p class="payout-balance__confirmation" role="status">
          {confirmation()}
        </p>
      </Show>

      <div class="payout-balance">
        <Show
          when={!balance.loading}
          fallback={
            <p class="payout-balance__pending" role="status">
              Loading balance...
            </p>
          }
        >
          <Show
            when={!balance.error}
            fallback={
              <div class="payout-balance__failed">
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
            <p class="payout-balance__amount">{formatMoney(availableCents())}</p>
            <p class="payout-balance__source">
              From {transactionCount()}{' '}
              {transactionCount() === 1 ? 'transaction' : 'transactions'}
            </p>
            <Show
              when={canRequest()}
              fallback={
                <p class="payout-balance__minimum">
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

      <Modal
        isOpen={isDialogOpen()}
        onClose={closeDialog}
        title="Request Payout"
        size="sm"
      >
        <form onSubmit={submit} class="payout-balance__form">
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
