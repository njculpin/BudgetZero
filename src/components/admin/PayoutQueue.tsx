import { createSignal, For, Show } from "solid-js";
import "./payout-queue.css";

export interface PayoutQueueEntry {
  id: string;
  amountCents: number;
  requestedAt: string;
  notes: string | null;
  itemCount: number;
  recipientHandle: string;
  recipientName: string | null;
  /** False when the recipient has not finished Stripe Connect onboarding. */
  payoutsEnabled: boolean;
}

export interface PayoutQueueProps {
  payouts: PayoutQueueEntry[];
}

type Outcome =
  | { kind: "idle" }
  | { kind: "confirming" }
  | { kind: "working" }
  | { kind: "paid"; transferId: string }
  | { kind: "error"; message: string };

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function PayoutQueue(props: PayoutQueueProps) {
  // Outcomes are tracked per payout so one failure does not obscure the rest of
  // the queue, and a paid row keeps its transfer id visible for reconciliation.
  const [outcomes, setOutcomes] = createSignal<Record<string, Outcome>>({});

  const outcomeFor = (id: string): Outcome =>
    outcomes()[id] ?? { kind: "idle" };

  const setOutcome = (id: string, outcome: Outcome) =>
    setOutcomes((prev) => ({ ...prev, [id]: outcome }));

  // Transfers move real money and cannot be undone from this screen, so paying out
  // takes two deliberate clicks. This is an inline `confirming` state rather than
  // window.confirm because a native dialog blocks the page — and with it the
  // end-to-end suite.
  const execute = async (payout: PayoutQueueEntry) => {
    setOutcome(payout.id, { kind: "working" });

    try {
      const response = await fetch("/api/payouts/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId: payout.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOutcome(payout.id, {
          kind: "error",
          message: data.details || data.error || "Transfer failed",
        });
        return;
      }

      setOutcome(payout.id, { kind: "paid", transferId: data.transferId });
    } catch {
      setOutcome(payout.id, {
        kind: "error",
        message: "Could not reach the server. The payout may or may not have run — reload before retrying.",
      });
    }
  };

  return (
    <div class="payout-queue">
      <Show
        when={props.payouts.length > 0}
        fallback={
          <p class="payout-queue__empty">No payouts are waiting to be paid.</p>
        }
      >
        <table class="payout-queue__table">
          <thead>
            <tr>
              <th scope="col">Recipient</th>
              <th scope="col">Requested</th>
              <th scope="col" class="payout-queue__cell--numeric">
                Amount
              </th>
              <th scope="col" class="payout-queue__cell--numeric">
                Royalties
              </th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.payouts}>
              {(payout) => {
                const outcome = () => outcomeFor(payout.id);
                const isDone = () => outcome().kind === "paid";
                const isWorking = () => outcome().kind === "working";
                const isConfirming = () => outcome().kind === "confirming";

                return (
                  <tr
                    class="payout-queue__row"
                    classList={{ "payout-queue__row--settled": isDone() }}
                  >
                    <td>
                      <div class="payout-queue__recipient">
                        <span class="payout-queue__handle">
                          @{payout.recipientHandle}
                        </span>
                        <Show when={payout.recipientName}>
                          <span class="payout-queue__name">
                            {payout.recipientName}
                          </span>
                        </Show>
                        <Show when={!payout.payoutsEnabled}>
                          <span class="payout-queue__warning">
                            Stripe Connect payouts not enabled — this transfer
                            will fail
                          </span>
                        </Show>
                        <Show when={payout.notes}>
                          <span class="payout-queue__note">{payout.notes}</span>
                        </Show>
                      </div>
                    </td>
                    <td>{formatDate(payout.requestedAt)}</td>
                    <td class="payout-queue__cell--numeric">
                      {formatCurrency(payout.amountCents)}
                    </td>
                    <td class="payout-queue__cell--numeric">
                      {payout.itemCount}
                    </td>
                    <td>
                      <Show
                        when={!isDone()}
                        fallback={
                          <span class="payout-queue__status payout-queue__status--paid">
                            Paid ·{" "}
                            {(outcome() as { transferId: string }).transferId}
                          </span>
                        }
                      >
                        <Show
                          when={isConfirming()}
                          fallback={
                            <button
                              type="button"
                              class="button button--primary button--sm"
                              disabled={isWorking()}
                              onClick={() =>
                                setOutcome(payout.id, { kind: "confirming" })
                              }
                            >
                              <span class="button__text">
                                {isWorking() ? "Transferring…" : "Pay out"}
                              </span>
                            </button>
                          }
                        >
                          <div class="payout-queue__confirm">
                            <p class="payout-queue__confirm-text">
                              Send {formatCurrency(payout.amountCents)} to @
                              {payout.recipientHandle}? This cannot be undone.
                            </p>
                            <div class="payout-queue__confirm-actions">
                              <button
                                type="button"
                                class="button button--primary button--sm"
                                onClick={() => execute(payout)}
                              >
                                <span class="button__text">Confirm</span>
                              </button>
                              <button
                                type="button"
                                class="button button--outline button--sm"
                                onClick={() =>
                                  setOutcome(payout.id, { kind: "idle" })
                                }
                              >
                                <span class="button__text">Cancel</span>
                              </button>
                            </div>
                          </div>
                        </Show>
                      </Show>

                      <Show when={outcome().kind === "error"}>
                        <p class="payout-queue__status payout-queue__status--error">
                          {(outcome() as { message: string }).message}
                        </p>
                      </Show>
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
