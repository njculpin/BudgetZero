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
          platformFee: priceData.platformFee || 0,
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
    // Owner gets the subtotal (before platform fee) minus royalties
    const subtotal = data.totalPrice - (data.platformFee || 0);
    return Math.max(0, subtotal - totalRoyalties);
  };

  const getPercentage = (amount: number) => {
    const data = royaltyData();
    if (!data || data.totalPrice === 0) return 0;
    return ((amount / data.totalPrice) * 100).toFixed(1);
  };

  const getPlatformFeePercentage = () => {
    const data = royaltyData();
    if (!data || !data.platformFee) return "10.0";
    return ((data.platformFee / data.totalPrice) * 100).toFixed(1);
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

                {/* Platform Fee */}
                <Show when={data.platformFee && data.platformFee > 0}>
                  <div class="royalty-breakdown__item royalty-breakdown__item--platform">
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
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="9" x2="15" y2="9" />
                          <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        <div class="royalty-breakdown__item-details">
                          <span class="royalty-breakdown__item-name">
                            Platform Fee
                          </span>
                          <span class="royalty-breakdown__item-role">Game Loopers</span>
                        </div>
                      </div>
                      <div class="royalty-breakdown__item-amount">
                        <span class="royalty-breakdown__item-price">
                          {formatPrice(data.platformFee)}
                        </span>
                        <span class="royalty-breakdown__item-percentage">
                          {getPlatformFeePercentage()}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </>
          );
        })()}
      </Show>
    </div>
  );
}
