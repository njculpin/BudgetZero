import { createSignal, createResource, Show, onMount } from "solid-js";
import "./product-value-breakdown.css";

export interface ProductValueBreakdownProps {
  variantId: string;
  price: number; // in cents
  assetCount: number;
}

export default function ProductValueBreakdown(props: ProductValueBreakdownProps) {
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  // Fetch total royalty cost - only run on client after mount
  const [royaltyTotal] = createResource(
    () => mounted() && props.variantId,
    async (variantId) => {
      const response = await fetch(`/api/products/variants/${variantId}/royalty-total`);
      if (!response.ok) return 0;
      const data = await response.json();
      return data.total || 0;
    }
  );

  const savings = () => {
    const total = royaltyTotal();
    if (!total || total === 0) return 0;
    return Math.max(0, total - props.price);
  };

  const percentageSavings = () => {
    const total = royaltyTotal();
    if (!total || total === 0) return 0;
    const saved = savings();
    return Math.round((saved / total) * 100);
  };

  return (
    <Show when={!royaltyTotal.loading && royaltyTotal() && royaltyTotal()! > 0}>
      <div class="value-breakdown">
        <div class="value-breakdown__items">
          <div class="value-breakdown__item">
            <span class="value-breakdown__label">Individual Asset Value</span>
            <span class="value-breakdown__value value-breakdown__value--muted">
              ${((royaltyTotal() || 0) / 100).toFixed(2)}
            </span>
          </div>

          <div class="value-breakdown__item value-breakdown__item--highlight">
            <span class="value-breakdown__label">Your Price</span>
            <span class="value-breakdown__value value-breakdown__value--primary">
              ${(props.price / 100).toFixed(2)}
            </span>
          </div>

          <Show when={savings() > 0}>
            <div class="value-breakdown__savings">
              <svg class="value-breakdown__savings-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span class="value-breakdown__savings-text">
                You save ${(savings() / 100).toFixed(2)} ({percentageSavings()}% off)
              </span>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
