import { createSignal, createResource, Show, For } from "solid-js";
import "./product-royalty-breakdown.css";

export interface ProductRoyaltyBreakdownProps {
  productId: string;
  productOwnerId?: string;
  productOwnerHandle?: string;
  productOwnerName?: string;
}

interface RoyaltyRecipient {
  userId: string;
  userHandle: string;
  userName: string;
  amountCents: number;
  description: string;
}

export default function ProductRoyaltyBreakdown(props: ProductRoyaltyBreakdownProps) {
  const [mounted, setMounted] = createSignal(false);

  // Fetch royalty data
  const [royaltyData] = createResource(
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

        // Use provided owner info or default values
        return {
          totalPrice: priceData.totalPrice || 0,
          productOwner: {
            userId: props.productOwnerId || "",
            userHandle: props.productOwnerHandle || "Unknown",
            userName: props.productOwnerName || props.productOwnerHandle || "Unknown",
          },
          royalties: royaltiesData.royalties || [],
        };
      } catch (error) {
        console.error("Error fetching royalty data:", error);
        return null;
      }
    }
  );

  const formatPrice = (cents: number) => {
    if (cents === 0) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateOwnerShare = () => {
    const data = royaltyData();
    if (!data) return 0;

    const totalRoyalties = data.royalties.reduce(
      (sum: number, r: { royalty_value: number }) => sum + (r.royalty_value || 0),
      0
    );
    return Math.max(0, data.totalPrice - totalRoyalties);
  };

  const getPercentage = (amount: number) => {
    const data = royaltyData();
    if (!data || data.totalPrice === 0) return 0;
    return ((amount / data.totalPrice) * 100).toFixed(1);
  };

  // Mount on client
  setTimeout(() => setMounted(true), 0);

  return (
    <div class="royalty-breakdown">
      <Show
        when={!royaltyData.loading && royaltyData()}
        fallback={
          <div class="royalty-breakdown__loading">
            <div class="royalty-breakdown__spinner"></div>
            <p>Loading royalty breakdown...</p>
          </div>
        }
      >
        {(() => {
          const data = royaltyData();
          if (!data) return null;

          const ownerShare = calculateOwnerShare();
          const hasRoyalties = data.royalties && data.royalties.length > 0;

          return (
            <>
              <div class="royalty-breakdown__header">
                <h4 class="royalty-breakdown__title">Revenue Breakdown</h4>
                <div class="royalty-breakdown__total">
                  <span class="royalty-breakdown__total-label">Total Price:</span>
                  <span class="royalty-breakdown__total-value">
                    {formatPrice(data.totalPrice)}
                  </span>
                </div>
              </div>

              <div class="royalty-breakdown__list">
                {/* Product Owner Share */}
                <div class="royalty-breakdown__item royalty-breakdown__item--owner">
                  <div class="royalty-breakdown__item-header">
                    <div class="royalty-breakdown__item-info">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="royalty-breakdown__icon"
                        aria-hidden="true"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <div class="royalty-breakdown__item-details">
                        <span class="royalty-breakdown__item-name">
                          {data.productOwner.userName}
                        </span>
                        <span class="royalty-breakdown__item-handle">
                          @{data.productOwner.userHandle}
                        </span>
                        <span class="royalty-breakdown__item-role">Product Creator</span>
                      </div>
                    </div>
                    <div class="royalty-breakdown__item-amount">
                      <span class="royalty-breakdown__item-price">
                        {formatPrice(ownerShare)}
                      </span>
                      <span class="royalty-breakdown__item-percentage">
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
                      <div class="royalty-breakdown__item royalty-breakdown__item--contributor">
                        <div class="royalty-breakdown__item-header">
                          <div class="royalty-breakdown__item-info">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              class="royalty-breakdown__icon"
                              aria-hidden="true"
                            >
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <div class="royalty-breakdown__item-details">
                              <span class="royalty-breakdown__item-name">
                                {royalty.user_name || "Contributor"}
                              </span>
                              <span class="royalty-breakdown__item-handle">
                                @{royalty.user_handle || "unknown"}
                              </span>
                              <span class="royalty-breakdown__item-role">Contributor</span>
                            </div>
                          </div>
                          <div class="royalty-breakdown__item-amount">
                            <span class="royalty-breakdown__item-price">
                              {formatPrice(royalty.royalty_value)}
                            </span>
                            <span class="royalty-breakdown__item-percentage">
                              {getPercentage(royalty.royalty_value)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>

              <div class="royalty-breakdown__footer">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <p class="royalty-breakdown__footer-text">
                  <strong>Transparent Revenue:</strong> Your purchase directly supports all
                  contributors involved in creating this product.
                </p>
              </div>
            </>
          );
        })()}
      </Show>
    </div>
  );
}
