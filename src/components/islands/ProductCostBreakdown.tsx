import { createSignal, createResource, For, Show, onMount } from "solid-js";
import "./product-cost-breakdown.css";

export interface ProductCostBreakdownProps {
  variantId: string;
  currentPrice: number; // in cents, 0 if no price set
}

interface Asset {
  id: string;
  title: string;
  handle: string;
  royalty_total: number; // in cents
}

export default function ProductCostBreakdown(props: ProductCostBreakdownProps) {
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  // Fetch variant assets with royalty totals
  const [assetsData] = createResource(
    () => mounted() && props.variantId,
    async (variantId) => {
      const response = await fetch(`/api/products/variants/${variantId}/assets`);
      if (!response.ok) return { assets: [], total: 0 };
      const data = await response.json();

      // For each asset, fetch its royalty total
      const assetsWithRoyalties = await Promise.all(
        (data.assets || []).map(async (asset: Asset) => {
          const royaltyResponse = await fetch(`/api/assets/${asset.id}/royalty-total`);
          if (!royaltyResponse.ok) return { ...asset, royalty_total: 0 };
          const royaltyData = await royaltyResponse.json();
          return { ...asset, royalty_total: royaltyData.total || 0 };
        })
      );

      const total = assetsWithRoyalties.reduce((sum, asset) => sum + asset.royalty_total, 0);

      return { assets: assetsWithRoyalties, total };
    }
  );

  const profitMargin = () => {
    if (!assetsData() || props.currentPrice === 0) return null;
    const cost = assetsData()!.total;
    const price = props.currentPrice;
    const profit = price - cost;
    const margin = (profit / price) * 100;
    return { profit, margin };
  };

  return (
    <div class="cost-breakdown">
      <div class="cost-breakdown__header">
        <h5 class="cost-breakdown__title">Cost Analysis</h5>
      </div>

                        <Show when={(assetsData()?.assets || []).length > 0}>
          <div class="cost-breakdown__details">
            <div class="cost-breakdown__list">
              <For each={assetsData()?.assets}>
                {(asset: Asset) => (
                  <div class="cost-breakdown__item">
                    <a href={`/assets/${asset.handle}`} class="cost-breakdown__item-link">
                      <span class="cost-breakdown__item-name">{asset.title}</span>
                    </a>
                    <span class="cost-breakdown__item-cost">
                      ${(asset.royalty_total / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

      <Show when={!assetsData.loading && assetsData()}>
        <div class="cost-breakdown__summary">
          <div class="cost-breakdown__summary-item">
            <span class="cost-breakdown__label">Total Asset Cost</span>
            <span class="cost-breakdown__value cost-breakdown__value--cost">
              ${((assetsData()?.total || 0) / 100).toFixed(2)}
            </span>
          </div>

          <Show when={props.currentPrice > 0}>
            <div class="cost-breakdown__summary-item">
              <span class="cost-breakdown__label">Your Price</span>
              <span class="cost-breakdown__value">
                ${(props.currentPrice / 100).toFixed(2)}
              </span>
            </div>

            <div class={`cost-breakdown__summary-item ${profitMargin()!.profit < 0 ? 'cost-breakdown__summary-item--negative' : 'cost-breakdown__summary-item--positive'}`}>
              <span class="cost-breakdown__label">
                {profitMargin()!.profit >= 0 ? 'Profit' : 'Loss'}
              </span>
              <span class="cost-breakdown__value cost-breakdown__value--profit">
                ${Math.abs(profitMargin()!.profit / 100).toFixed(2)} ({profitMargin()!.margin.toFixed(1)}%)
              </span>
            </div>
          </Show>

          <Show when={props.currentPrice === 0 && (assetsData()?.total || 0) > 0}>
            <div class="cost-breakdown__warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>No price set. Add pricing to see profit calculations.</span>
            </div>
          </Show>
        </div>

        <Show when={(assetsData()?.assets || []).length === 0}>
          <div class="cost-breakdown__empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No assets linked to this variant yet. Add assets below to see cost breakdown.</p>
          </div>
        </Show>
      </Show>
    </div>
  );
}
