import { createSignal, Show, For, onMount } from "solid-js";
import { ErrorMessage } from "./base";
import "./base/base.css";

export interface PricingBreakdownProps {
  variantId: string;
  variantTitle: string;
}

export default function PricingBreakdown(props: PricingBreakdownProps) {
  const [breakdown, setBreakdown] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  const formatCurrency = (cents: number, currency = "usd") => {
    const dollars = cents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(dollars);
  };

  const fetchBreakdown = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/products/variants/pricing-breakdown?variantId=${props.variantId}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load pricing breakdown");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.message) {
        setError(data.message);
        setIsLoading(false);
        return;
      }

      setBreakdown(data.breakdown);
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchBreakdown();
  });

  return (
    <div class="pricing-breakdown">
      <h4 class="pricing-breakdown__title">
        Pricing Breakdown: {props.variantTitle}
      </h4>

      <Show when={error()}>
        <div class="pricing-breakdown__message">
          <p>{error()}</p>
        </div>
      </Show>

      <Show when={isLoading()}>
        <div class="pricing-breakdown__loading">
          <p>Calculating breakdown...</p>
        </div>
      </Show>

      <Show when={!isLoading() && !error() && breakdown()}>
        <div class="pricing-breakdown__content">
          {/* Base Price */}
          <div class="pricing-breakdown__row pricing-breakdown__row--total">
            <span class="pricing-breakdown__label">Base Price</span>
            <span class="pricing-breakdown__value pricing-breakdown__value--large">
              {formatCurrency(breakdown().basePrice.amount, breakdown().basePrice.currency)}
            </span>
          </div>

          {/* Platform Fee */}
          <div class="pricing-breakdown__row">
            <span class="pricing-breakdown__label">
              Platform Fee ({breakdown().platformFee.percentage}%)
            </span>
            <span class="pricing-breakdown__value pricing-breakdown__value--negative">
              -{formatCurrency(breakdown().platformFee.amount, breakdown().basePrice.currency)}
            </span>
          </div>

          {/* Validation Warning */}
          <Show when={breakdown().validation && !breakdown().validation.isValid}>
            <div class="pricing-breakdown__warning">
              <p>
                ⚠️ Product price (
                {formatCurrency(breakdown().validation.productPrice, breakdown().basePrice.currency)})
                is less than sum of asset flat rates (
                {formatCurrency(breakdown().validation.sumOfAssetRates, breakdown().basePrice.currency)}).
                Shortfall: {formatCurrency(breakdown().validation.shortfall, breakdown().basePrice.currency)}
              </p>
            </div>
          </Show>

          {/* Asset Payouts Section */}
          <Show when={breakdown().assets.items.length > 0}>
            <div class="pricing-breakdown__section">
              <div class="pricing-breakdown__section-header">
                <h5 class="pricing-breakdown__section-title">Asset Payouts</h5>
                <span class="pricing-breakdown__section-total pricing-breakdown__value--negative">
                  -{formatCurrency(breakdown().assets.totalPayouts, breakdown().basePrice.currency)}
                </span>
              </div>

              <For each={breakdown().assets.items}>
                {(assetBreakdown) => (
                  <div class="pricing-breakdown__asset">
                    <div class="pricing-breakdown__asset-header">
                      <span class="pricing-breakdown__asset-title">
                        {assetBreakdown.asset.title}
                      </span>
                      <div class="pricing-breakdown__asset-info">
                        <span class="pricing-breakdown__asset-percentage">
                          {assetBreakdown.percentage}%
                        </span>
                        <span class="pricing-breakdown__asset-total">
                          {formatCurrency(assetBreakdown.payout, breakdown().basePrice.currency)}
                        </span>
                      </div>
                    </div>

                    <div class="pricing-breakdown__asset-rate">
                      Flat rate: {formatCurrency(assetBreakdown.flatRate, breakdown().basePrice.currency)}
                    </div>

                    <Show when={assetBreakdown.royalties.length > 0}>
                      <ul class="pricing-breakdown__contributors">
                        <For each={assetBreakdown.royalties}>
                          {(royalty) => (
                            <li class="pricing-breakdown__contributor">
                              <span class="pricing-breakdown__contributor-name">
                                {royalty.user?.name || royalty.user?.handle || "Unknown"}
                              </span>
                              <span class="pricing-breakdown__contributor-amount">
                                {formatCurrency(royalty.royalty_value, breakdown().basePrice.currency)}
                              </span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Net to Owner */}
          <div class="pricing-breakdown__row pricing-breakdown__row--final">
            <span class="pricing-breakdown__label pricing-breakdown__label--bold">
              Net to Product Owner
            </span>
            <span class="pricing-breakdown__value pricing-breakdown__value--positive pricing-breakdown__value--large">
              {formatCurrency(breakdown().netToOwner.amount, breakdown().basePrice.currency)}
              <span class="pricing-breakdown__percentage">
                {" "}({breakdown().netToOwner.percentage}%)
              </span>
            </span>
          </div>
        </div>
      </Show>
    </div>
  );
}
