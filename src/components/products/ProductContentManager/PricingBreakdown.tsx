import { Show } from "solid-js";

export interface PricingBreakdownProps {
  totalPrice: number;
}

export default function PricingBreakdown(props: PricingBreakdownProps) {
  const formatPrice = (cents: number): string => {
    if (cents === 0) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const hasContent = () => props.totalPrice > 0;

  return (
    <div class="pricing-breakdown">
      <Show when={hasContent()}>
        <div class="pricing-breakdown__content">
          <div class="pricing-breakdown__total">
            <span class="pricing-breakdown__total-label">Total Price:</span>
            <span class="pricing-breakdown__total-value">
              {formatPrice(props.totalPrice)}
            </span>
          </div>
        </div>
      </Show>

      <Show when={!hasContent()}>
        <div class="pricing-breakdown__empty">
          <span class="pricing-breakdown__empty-icon">💰</span>
          <p class="pricing-breakdown__empty-text">Free</p>
          <p class="pricing-breakdown__empty-hint">
            No price set for files, documents, or embedded products
          </p>
        </div>
      </Show>
    </div>
  );
}
