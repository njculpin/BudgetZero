import { createSignal, createResource, For, Show, onMount } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import "@/components/interactive/base.css";
import "./product-embedded-products.css";

export interface ProductEmbeddedProductsProps {
  productId: string;
  userId: string;
}

interface EmbeddedProduct {
  id: string;
  component_id: string; // ProductComponent ID for unlinking
  title: string;
  handle: string;
  status: "draft" | "private" | "public" | "archived";
  inherited_price_cents: number;
  creator_name: string;
  creator_handle: string;
  file_count: number;
}

export default function ProductEmbeddedProducts(props: ProductEmbeddedProductsProps) {
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<any[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [unlinkingId, setUnlinkingId] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "✏️ Draft";
      case "private": return "🔒 Private";
      case "public": return "🌐 Public";
      case "archived": return "📦 Archived";
      default: return status;
    }
  };

  // Fetch embedded products
  const [embeddedProducts, { refetch }] = createResource(
    () => mounted() && props.productId,
    async (productId) => {
      const response = await fetch(`/api/products/${productId}/embedded-products`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.embeddedProducts || [];
    }
  );

  // Calculate total inherited price
  const totalInheritedPrice = () => {
    const products = embeddedProducts();
    if (!products) return 0;
    return products.reduce((sum: number, p: EmbeddedProduct) => sum + p.inherited_price_cents, 0);
  };

  const handleSearch = async () => {
    if (!searchQuery().trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const response = await fetch(
        `/api/products/search-embeddable?q=${encodeURIComponent(searchQuery())}&userId=${props.userId}`
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to search products");
        setIsSearching(false);
        return;
      }

      const data = await response.json();
      setSearchResults(data.products || []);
      setIsSearching(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSearching(false);
    }
  };

  const handleEmbedProduct = async (childProductId: string, priceInheritedCents: number) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/embed-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentProductId: props.productId,
          childProductId: childProductId,
          inheritedPriceCents: priceInheritedCents,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to embed product");
        return;
      }

      setSuccess("Product embedded successfully!");
      setSearchQuery("");
      setSearchResults([]);
      setIsModalOpen(false);

      // Refetch embedded products
      await refetch();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleUnembedProduct = async (componentId: string) => {
    if (!confirm("Are you sure you want to remove this embedded product?")) {
      return;
    }

    setUnlinkingId(componentId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/unembed-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId: componentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to remove embedded product");
        setUnlinkingId(null);
        return;
      }

      setSuccess("Embedded product removed successfully!");

      // Refetch embedded products
      await refetch();

      setUnlinkingId(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
      setUnlinkingId(null);
    }
  };

  return (
    <div class="embedded-products">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="embedded-products__header">
        <div class="embedded-products__title-group">
          <h5 class="embedded-products__title">Embedded Products</h5>
          <span class="embedded-products__count">
            {embeddedProducts.loading ? "..." : `${embeddedProducts()?.length || 0} product${embeddedProducts()?.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Show when={!embeddedProducts.loading && totalInheritedPrice() > 0}>
          <div class="embedded-products__price-total">
            <span class="embedded-products__price-label">Inherited Price:</span>
            <span class="embedded-products__price-value">
              ${(totalInheritedPrice() / 100).toFixed(2)}
            </span>
          </div>
        </Show>
      </div>

      <p class="embedded-products__description">
        Embed other products to include their files and automatically credit their creators with royalties.
      </p>

      <Show
        when={!embeddedProducts.loading && embeddedProducts() && embeddedProducts()!.length > 0}
        fallback={
          <div class="embedded-products__empty">
            <div class="embedded-products__empty-icon">🧩</div>
            <p class="embedded-products__empty-text">
              No embedded products yet. Click "Embed Product" below to add products from other creators.
            </p>
          </div>
        }
      >
        <div class="embedded-products__list">
          <For each={embeddedProducts()}>
            {(product: EmbeddedProduct) => (
              <div class="embedded-products__item">
                <a href={`/products/${product.handle}`} class="embedded-products__item-link" target="_blank">
                  <div class="embedded-products__item-image-container">
                    <div class="embedded-products__item-image-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  </div>
                  <div class="embedded-products__item-info">
                    <h6 class="embedded-products__item-title">{product.title}</h6>
                    <p class="embedded-products__item-creator">by @{product.creator_handle}</p>
                    <div class="embedded-products__item-meta">
                      <span class={`status-badge status-badge--${product.status}`}>
                        {getStatusLabel(product.status)}
                      </span>
                      <span class="embedded-products__item-price">
                        ${(product.inherited_price_cents / 100).toFixed(2)} inherited
                      </span>
                      <Show when={product.file_count > 0}>
                        <span class="embedded-products__item-files">
                          {product.file_count} {product.file_count === 1 ? 'file' : 'files'}
                        </span>
                      </Show>
                    </div>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={() => handleUnembedProduct(product.component_id)}
                  class="embedded-products__item-remove"
                  disabled={unlinkingId() === product.component_id}
                >
                  {unlinkingId() === product.component_id ? "Removing..." : "Remove"}
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        class="embedded-products__add-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Embed Product
      </button>

      {/* Search Modal */}
      <Show when={isModalOpen()}>
        <div class="embedded-products__modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div class="embedded-products__modal" onClick={(e) => e.stopPropagation()}>
            <div class="embedded-products__modal-header">
              <h3 class="embedded-products__modal-title">Embed a Product</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                class="embedded-products__modal-close"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div class="embedded-products__modal-body">
              <p class="embedded-products__modal-description">
                Search for public products or your own private products to embed. The embedded product's price will be added to your product's total price. Royalty payments will be made to the product owner on each sale.
              </p>

              <div class="embedded-products__create-product">
                <form action="/api/products/create-product" method="POST" class="embedded-products__create-form">
                  <button type="submit" class="embedded-products__create-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Create New Product to Embed
                  </button>
                  <p class="embedded-products__create-hint">
                    Don't see the product you need? Create a new one and embed it here.
                  </p>
                </form>
              </div>

              <div class="embedded-products__divider">
                <span class="embedded-products__divider-text">Or search existing products</span>
              </div>

              <div class="embedded-products__search">
                <input
                  type="text"
                  class="embedded-products__search-input"
                  placeholder="Search products..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
                <LoadingButton
                  onClick={handleSearch}
                  isLoading={isSearching()}
                  loadingText="Searching..."
                  variant="primary"
                  size="md"
                >
                  Search
                </LoadingButton>
              </div>

              <Show when={searchResults().length > 0}>
                <div class="embedded-products__results">
                  <For each={searchResults()}>
                    {(result: any) => (
                      <div class="embedded-products__result-item">
                        <div class="embedded-products__result-info">
                          <h6 class="embedded-products__result-title">{result.title}</h6>
                          <p class="embedded-products__result-creator">by @{result.creator_handle}</p>
                          <div class="embedded-products__result-meta">
                            <span class={`status-badge status-badge--${result.status}`}>
                              {getStatusLabel(result.status)}
                            </span>
                            <span class="embedded-products__result-price">
                              Price: ${(result.total_price_cents / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEmbedProduct(result.id, result.total_price_cents)}
                          class="embedded-products__result-embed-button"
                        >
                          Embed
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={!isSearching() && searchQuery() && searchResults().length === 0}>
                <p class="embedded-products__no-results">
                  No products found. Try a different search term.
                </p>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
