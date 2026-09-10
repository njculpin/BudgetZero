import { createSignal, createResource, Show, For } from "solid-js";

export interface RoyaltyRecipient {
  user_id: string;
  user_handle: string;
  user_name: string;
  royalty_value: number;
}

export interface RevenuePreviewProps {
  productId: string;
  totalPrice: number;
  productOwnerName?: string;
}

export default function RevenuePreview(props: RevenuePreviewProps) {
  const [mounted, setMounted] = createSignal(false);

  const [royaltiesData] = createResource(
    () => mounted() && props.productId,
    async (productId) => {
      try {
        const response = await fetch(`/api/products/${productId}/royalties`);
        if (!response.ok) throw new Error("Failed to fetch royalties");
        const data = await response.json();
        return data.royalties || [];
      } catch (error) {
        console.error("Error fetching royalties:", error);
        return [];
      }
    }
  );

  const formatPrice = (cents: number): string => {
    if (cents === 0) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateOwnerShare = (): number => {
    const royalties = royaltiesData() || [];
    const totalRoyalties = royalties.reduce(
      (sum: number, r: RoyaltyRecipient) => sum + (r.royalty_value || 0),
      0
    );
    return Math.max(0, props.totalPrice - totalRoyalties);
  };

  const getPercentage = (amount: number): string => {
    if (props.totalPrice === 0) return "0.0";
    return ((amount / props.totalPrice) * 100).toFixed(1);
  };

  setTimeout(() => setMounted(true), 0);

  return (
    <div class="revenue-preview">
      <div class="revenue-preview__header">
        <h3 class="revenue-preview__title">Revenue Split</h3>
        <span class="revenue-preview__sale-price">
          Sale: {formatPrice(props.totalPrice)}
        </span>
      </div>

      <Show
        when={!royaltiesData.loading && royaltiesData()}
        fallback={
          <div class="revenue-preview__loading">
            <div class="revenue-preview__spinner"></div>
          </div>
        }
      >
        {(() => {
          if (props.totalPrice === 0) {
            return (
              <p class="revenue-preview__empty">
                Set a price to see revenue distribution
              </p>
            );
          }

          const ownerShare = calculateOwnerShare();
          const royalties = royaltiesData() || [];

          return (
            <>
              <div class="revenue-preview__table">
                {/* Owner Share */}
                <div class="revenue-preview__row revenue-preview__row--owner">
                  <div class="revenue-preview__recipient">
                    <span class="revenue-preview__name">
                      {props.productOwnerName || "You"}
                    </span>
                    <span class="revenue-preview__label">(Owner)</span>
                  </div>
                  <div class="revenue-preview__amounts">
                    <span class="revenue-preview__price">
                      {formatPrice(ownerShare)}
                    </span>
                    <span class="revenue-preview__percent">
                      {getPercentage(ownerShare)}%
                    </span>
                  </div>
                </div>

                {/* Royalty Recipients */}
                <For each={royalties}>
                  {(royalty: RoyaltyRecipient) => (
                    <div class="revenue-preview__row">
                      <div class="revenue-preview__recipient">
                        <span class="revenue-preview__name">
                          {royalty.user_name}
                        </span>
                        <span class="revenue-preview__label">
                          @{royalty.user_handle}
                        </span>
                      </div>
                      <div class="revenue-preview__amounts">
                        <span class="revenue-preview__price">
                          {formatPrice(royalty.royalty_value)}
                        </span>
                        <span class="revenue-preview__percent">
                          {getPercentage(royalty.royalty_value)}%
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>

              <p class="revenue-preview__note">
                Platform fees deducted at checkout
              </p>
            </>
          );
        })()}
      </Show>
    </div>
  );
}
