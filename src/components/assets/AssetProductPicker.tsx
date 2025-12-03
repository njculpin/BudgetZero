import { createSignal, createResource, For, Show, onMount } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import "@/components/interactive/base.css";
import "./asset-product-picker.css";

export interface AssetProductPickerProps {
  assetId: string;
  userId: string;
}

interface ProductVariant {
  id: string;
  title: string;
  sku: string;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  variants: ProductVariant[];
}

export default function AssetProductPicker(props: AssetProductPickerProps) {
  const [isSelectingProduct, setIsSelectingProduct] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedVariantId, setSelectedVariantId] = createSignal<string | null>(null);
  const [isLinking, setIsLinking] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  // Fetch user's products with variants - only run on client after mount
  const [products] = createResource(
    () => mounted() && props.userId,
    async () => {
      const response = await fetch("/api/products/user-products-with-variants");
      if (!response.ok) return [];
      const data = await response.json();
      return data.products || [];
    }
  );

  const filteredProducts = () => {
    const productsData = products() || [];
    const query = searchQuery().toLowerCase().trim();

    if (!query) {
      return productsData;
    }

    return productsData.filter((p: Product) =>
      p.title.toLowerCase().includes(query) ||
      p.handle.toLowerCase().includes(query)
    );
  };

  const handleLinkAsset = async () => {
    const variantId = selectedVariantId();
    if (!variantId) return;

    setIsLinking(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/link-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variantId,
          assetId: props.assetId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add asset to product");
        setIsLinking(false);
        return;
      }

      setSuccess("Asset added to product successfully!");
      setSelectedVariantId(null);
      setSearchQuery("");
      setIsSelectingProduct(false);
      setIsLinking(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLinking(false);
    }
  };

  return (
    <div class="asset-product-picker">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <Show
        when={isSelectingProduct()}
        fallback={
          <button
            type="button"
            onClick={() => setIsSelectingProduct(true)}
            class="asset-product-picker__trigger"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add to Product
          </button>
        }
      >
        <div class="asset-product-picker__modal">
          <div class="asset-product-picker__modal-content">
            <div class="asset-product-picker__header">
              <h6 class="asset-product-picker__title">Select a Product Variant</h6>
              <button
                type="button"
                onClick={() => {
                  setIsSelectingProduct(false);
                  setSelectedVariantId(null);
                  setSearchQuery("");
                }}
                class="asset-product-picker__close"
                aria-label="Close product selector"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="asset-product-picker__search"
            />

            <Show when={!products.loading}>
              <Show
                when={filteredProducts().length > 0}
                fallback={
                  <div class="asset-product-picker__no-results">
                    <p>No products found</p>
                    {searchQuery() && <p class="asset-product-picker__no-results-hint">Try a different search term</p>}
                  </div>
                }
              >
                <div class="asset-product-picker__list">
                  <For each={filteredProducts()}>
                    {(product: Product) => (
                      <div class="asset-product-picker__product">
                        <h6 class="asset-product-picker__product-title">{product.title}</h6>
                        <div class="asset-product-picker__variants">
                          <For each={product.variants}>
                            {(variant: ProductVariant) => (
                              <label class={`asset-product-picker__variant ${selectedVariantId() === variant.id ? 'asset-product-picker__variant--selected' : ''}`}>
                                <input
                                  type="radio"
                                  name="variant-selection"
                                  value={variant.id}
                                  checked={selectedVariantId() === variant.id}
                                  onChange={() => setSelectedVariantId(variant.id)}
                                  class="asset-product-picker__variant-radio"
                                />
                                <span class="asset-product-picker__variant-title">{variant.title}</span>
                                <div class="asset-product-picker__variant-check">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                </div>
                              </label>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                <div class="asset-product-picker__actions">
                  <LoadingButton
                    type="button"
                    onClick={handleLinkAsset}
                    isLoading={isLinking()}
                    loadingText="Adding..."
                    variant="primary"
                    size="sm"
                    disabled={!selectedVariantId()}
                  >
                    Add to Selected Variant
                  </LoadingButton>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectingProduct(false);
                      setSelectedVariantId(null);
                      setSearchQuery("");
                    }}
                    class="asset-product-picker__cancel"
                  >
                    Cancel
                  </button>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
