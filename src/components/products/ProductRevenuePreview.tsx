import { createSignal, createResource, Show, For } from "solid-js";
import "./product-revenue-preview.css";

export interface ProductRevenuePreviewProps {
  productId: string;
  productOwnerId?: string;
  productOwnerHandle?: string;
  productOwnerName?: string;
}

export default function ProductRevenuePreview(props: ProductRevenuePreviewProps) {
  const [mounted, setMounted] = createSignal(false);

  // Fetch price breakdown and royalties
  const [revenueData] = createResource(
    () => mounted() && props.productId,
    async (productId) => {
      try {
        // Fetch product price breakdown
        const priceResponse = await fetch(`/api/products/${productId}/price-breakdown`);
        if (!priceResponse.ok) {
          throw new Error("Failed to fetch price breakdown");
        }
        const priceData = await priceResponse.json();

        // Fetch product royalties
        const royaltiesResponse = await fetch(`/api/products/${productId}/royalties`);
        if (!royaltiesResponse.ok) {
          throw new Error("Failed to fetch royalties");
        }
        const royaltiesData = await royaltiesResponse.json();

        return {
          totalPrice: priceData.totalPrice || 0,
          subtotal: priceData.subtotal || 0,
          platformFee: priceData.platformFee || 0,
          royalties: royaltiesData.royalties || [],
        };
      } catch (error) {
        console.error("Error fetching revenue data:", error);
        return null;
      }
    }
  );

  const formatPrice = (cents: number) => {
    if (cents === 0) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateOwnerShare = () => {
    const data = revenueData();
    if (!data) return 0;

    const totalRoyalties = data.royalties.reduce(
      (sum: number, r: { royalty_value: number }) => sum + (r.royalty_value || 0),
      0
    );
    // Owner gets the subtotal (before platform fee) minus royalties
    return Math.max(0, data.subtotal - totalRoyalties);
  };

  const getPercentage = (amount: number) => {
    const data = revenueData();
    if (!data || data.totalPrice === 0) return 0;
    return ((amount / data.totalPrice) * 100).toFixed(1);
  };

  // Mount on client
  setTimeout(() => setMounted(true), 0);

  return (
    <div class="revenue-preview">
      <Show
        when={!revenueData.loading && revenueData()}
        fallback={
          <div class="revenue-preview__loading">
            <div class="revenue-preview__spinner"></div>
            <p>Loading revenue preview...</p>
          </div>
        }
      >
        {(() => {
          const data = revenueData();
          if (!data) return null;

          const ownerShare = calculateOwnerShare();
          const hasRoyalties = data.royalties && data.royalties.length > 0;

          // If total price is zero, show a helpful message
          if (data.totalPrice === 0) {
            return (
              <div class="revenue-preview__empty">
                <div class="revenue-preview__empty-icon">💰</div>
                <p class="revenue-preview__empty-text">
                  Add files, documents, or embed products to see your revenue preview.
                </p>
              </div>
            );
          }

          return (
            <>
              <div class="revenue-preview__header">
                <h4 class="revenue-preview__title">Revenue Preview</h4>
                <div class="revenue-preview__total">
                  <span class="revenue-preview__total-label">Customer Pays:</span>
                  <span class="revenue-preview__total-value">
                    {formatPrice(data.totalPrice)}
                  </span>
                </div>
              </div>

              <p class="revenue-preview__description">
                When someone buys this product, here's how the ${(data.totalPrice / 100).toFixed(2)} will be distributed:
              </p>

              <div class="revenue-preview__list">
                {/* Product Owner Share */}
                <div class="revenue-preview__item revenue-preview__item--owner">
                  <div class="revenue-preview__item-header">
                    <div class="revenue-preview__item-info">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="revenue-preview__icon"
                        aria-hidden="true"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <div class="revenue-preview__item-details">
                        <span class="revenue-preview__item-name">
                          {props.productOwnerName || props.productOwnerHandle || "You"}
                        </span>
                        <span class="revenue-preview__item-role">Your Share</span>
                      </div>
                    </div>
                    <div class="revenue-preview__item-amount">
                      <span class="revenue-preview__item-price">
                        {formatPrice(ownerShare)}
                      </span>
                      <span class="revenue-preview__item-percentage">
                        {getPercentage(ownerShare)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Royalty Recipients */}
                <Show when={hasRoyalties}>
                  <For each={data.royalties}>
                    {(royalty: {
                      user_id: string;
                      user_handle: string;
                      user_name: string;
                      royalty_value: number;
                    }) => (
                      <div class="revenue-preview__item revenue-preview__item--contributor">
                        <div class="revenue-preview__item-header">
                          <div class="revenue-preview__item-info">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              class="revenue-preview__icon"
                              aria-hidden="true"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <div class="revenue-preview__item-details">
                              <span class="revenue-preview__item-name">
                                {royalty.user_name || "Contributor"}
                              </span>
                              <span class="revenue-preview__item-handle">
                                @{royalty.user_handle || "unknown"}
                              </span>
                              <span class="revenue-preview__item-role">Embedded Product Royalty</span>
                            </div>
                          </div>
                          <div class="revenue-preview__item-amount">
                            <span class="revenue-preview__item-price">
                              {formatPrice(royalty.royalty_value)}
                            </span>
                            <span class="revenue-preview__item-percentage">
                              {getPercentage(royalty.royalty_value)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>

                {/* Platform Fee */}
                <Show when={data.platformFee && data.platformFee > 0}>
                  <div class="revenue-preview__item revenue-preview__item--platform">
                    <div class="revenue-preview__item-header">
                      <div class="revenue-preview__item-info">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          class="revenue-preview__icon"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="9" x2="15" y2="9" />
                          <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        <div class="revenue-preview__item-details">
                          <span class="revenue-preview__item-name">
                            Platform Fee
                          </span>
                          <span class="revenue-preview__item-role">Game Loopers (10%)</span>
                        </div>
                      </div>
                      <div class="revenue-preview__item-amount">
                        <span class="revenue-preview__item-price">
                          {formatPrice(data.platformFee)}
                        </span>
                        <span class="revenue-preview__item-percentage">
                          {getPercentage(data.platformFee)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>

              <div class="revenue-preview__note">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="revenue-preview__note-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p class="revenue-preview__note-text">
                  This is a preview based on your current product configuration. Actual revenue may vary based on final pricing and royalty agreements.
                </p>
              </div>
            </>
          );
        })()}
      </Show>
    </div>
  );
}
