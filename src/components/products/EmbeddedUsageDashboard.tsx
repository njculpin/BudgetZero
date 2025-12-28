import { createSignal, createEffect, For, Show } from "solid-js";
import "./embedded-usage-dashboard.css";

interface ParentProduct {
  id: string;
  title: string;
  handle: string;
  cover_image_url: string | null;
  owner_name: string;
  owner_handle: string;
  royalty_rate: number;
  total_earnings: number;
  sales_count: number;
}

export interface EmbeddedUsageDashboardProps {
  userId: string;
}

export default function EmbeddedUsageDashboard(props: EmbeddedUsageDashboardProps) {
  const [parentProducts, setParentProducts] = createSignal<ParentProduct[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  createEffect(() => {
    fetchEmbeddedUsage();
  });

  const fetchEmbeddedUsage = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/products/embedded-usage?userId=${props.userId}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load embedded usage data");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setParentProducts(data.parentProducts || []);
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const totalEarnings = () => {
    return parentProducts().reduce((sum, product) => sum + product.total_earnings, 0);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div class="embedded-usage">
      <div class="embedded-usage__header">
        <div>
          <h2 class="embedded-usage__title">Where Your Work Is Used</h2>
          <p class="embedded-usage__subtitle">
            Track products that embed your work and the royalties you've earned.
          </p>
        </div>
        <Show when={!isLoading() && parentProducts().length > 0}>
          <div class="embedded-usage__total">
            <span class="embedded-usage__total-label">Total Royalties Earned</span>
            <span class="embedded-usage__total-amount">{formatCurrency(totalEarnings())}</span>
          </div>
        </Show>
      </div>

      <Show when={isLoading()}>
        <div class="embedded-usage__loading">
          <div class="embedded-usage__skeleton">
            <div class="embedded-usage__skeleton-row" />
            <div class="embedded-usage__skeleton-row" />
            <div class="embedded-usage__skeleton-row" />
          </div>
        </div>
      </Show>

      <Show when={error()}>
        <div class="embedded-usage__error">
          <p class="embedded-usage__error-text">{error()}</p>
        </div>
      </Show>

      <Show when={!isLoading() && !error() && parentProducts().length === 0}>
        <div class="embedded-usage__empty">
          <div class="embedded-usage__empty-icon">📦</div>
          <h3 class="embedded-usage__empty-title">No Embedded Products Yet</h3>
          <p class="embedded-usage__empty-text">
            Your products haven't been embedded in other products yet. Make sure your products are marked as embeddable and set to public status to allow others to use them.
          </p>
        </div>
      </Show>

      <Show when={!isLoading() && !error() && parentProducts().length > 0}>
        <div class="embedded-usage__grid">
          <For each={parentProducts()}>
            {(product) => (
              <a
                href={`/products/${product.handle}`}
                class="embedded-product-card"
              >
                <div class="embedded-product-card__image">
                  {product.cover_image_url ? (
                    <img
                      src={product.cover_image_url}
                      alt={product.title}
                      class="embedded-product-card__img"
                    />
                  ) : (
                    <div class="embedded-product-card__placeholder">
                      <span>📦</span>
                    </div>
                  )}
                </div>

                <div class="embedded-product-card__content">
                  <h3 class="embedded-product-card__title">{product.title}</h3>
                  <p class="embedded-product-card__owner">
                    by <span class="embedded-product-card__owner-name">{product.owner_name}</span>
                  </p>

                  <div class="embedded-product-card__stats">
                    <div class="embedded-product-card__stat">
                      <span class="embedded-product-card__stat-label">Your Royalty Rate</span>
                      <span class="embedded-product-card__stat-value">{product.royalty_rate}%</span>
                    </div>
                    <div class="embedded-product-card__stat">
                      <span class="embedded-product-card__stat-label">Sales</span>
                      <span class="embedded-product-card__stat-value">{product.sales_count}</span>
                    </div>
                    <div class="embedded-product-card__stat embedded-product-card__stat--highlight">
                      <span class="embedded-product-card__stat-label">Earned</span>
                      <span class="embedded-product-card__stat-value">{formatCurrency(product.total_earnings)}</span>
                    </div>
                  </div>
                </div>
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
