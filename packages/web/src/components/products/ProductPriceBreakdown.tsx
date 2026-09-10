import { createSignal, createResource, Show, For, onMount } from "solid-js";
import "./product-price-breakdown.css";

export interface ProductFile {
  id: string;
  title: string;
  price_cents: number;
}

export interface ProductDocument {
  id: string;
  title: string;
  price_cents: number;
}

export interface EmbeddedProduct {
  id: string;
  title: string;
  handle: string;
  inherited_price_cents: number;
  creator_name: string;
}

export interface ProductPriceBreakdownProps {
  productId: string;
}

interface BreakdownData {
  files: ProductFile[];
  documents: ProductDocument[];
  embeddedProducts: EmbeddedProduct[];
}

export default function ProductPriceBreakdown(props: ProductPriceBreakdownProps) {
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Fetch pricing data
  const [pricingData] = createResource(
    () => mounted() && props.productId,
    async (productId) => {
      try {
        // Fetch files
        const filesResponse = await fetch(`/api/products/${productId}/files`);
        const filesData = filesResponse.ok ? await filesResponse.json() : { files: [] };

        // Fetch documents
        const documentsResponse = await fetch(`/api/products/${productId}/documents`);
        const documentsData = documentsResponse.ok ? await documentsResponse.json() : { documents: [] };

        // Fetch embedded products
        const embeddedResponse = await fetch(`/api/products/${productId}/embedded-products`);
        const embeddedData = embeddedResponse.ok ? await embeddedResponse.json() : { embeddedProducts: [] };

        return {
          files: filesData.files || [],
          documents: documentsData.documents || [],
          embeddedProducts: embeddedData.embeddedProducts || [],
        } as BreakdownData;
      } catch (error) {
        console.error("Error fetching pricing data:", error);
        return {
          files: [],
          documents: [],
          embeddedProducts: [],
        } as BreakdownData;
      }
    }
  );

  const totalFilesPrice = () => {
    const data = pricingData();
    if (!data) return 0;
    return data.files.reduce((sum, file) => sum + file.price_cents, 0);
  };

  const totalDocumentsPrice = () => {
    const data = pricingData();
    if (!data) return 0;
    return data.documents.reduce((sum, doc) => sum + doc.price_cents, 0);
  };

  const totalEmbeddedPrice = () => {
    const data = pricingData();
    if (!data) return 0;
    return data.embeddedProducts.reduce((sum, product) => sum + product.inherited_price_cents, 0);
  };

  const totalPrice = () => {
    return totalFilesPrice() + totalDocumentsPrice() + totalEmbeddedPrice();
  };

  return (
    <div class="price-breakdown">
      <Show when={pricingData.loading}>
        <div class="price-breakdown__loading">Loading pricing...</div>
      </Show>

      <Show when={!pricingData.loading && pricingData()}>
        <div class="price-breakdown__content">
          <Show when={pricingData()?.files && pricingData()!.files.length > 0}>
            <div class="price-breakdown__section">
              <h3 class="price-breakdown__section-title">Files</h3>
              <div class="price-breakdown__items">
                <For each={pricingData()!.files}>
                  {(file) => (
                    <div class="price-breakdown__item">
                      <span class="price-breakdown__item-icon">📄</span>
                      <span class="price-breakdown__item-name">{file.title}</span>
                      <span class="price-breakdown__item-price">{formatPrice(file.price_cents)}</span>
                    </div>
                  )}
                </For>
              </div>
              <Show when={pricingData()!.files.length > 1}>
                <div class="price-breakdown__subtotal">
                  <span class="price-breakdown__subtotal-label">Files Subtotal</span>
                  <span class="price-breakdown__subtotal-value">{formatPrice(totalFilesPrice())}</span>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={pricingData()?.documents && pricingData()!.documents.length > 0}>
            <div class="price-breakdown__section">
              <h3 class="price-breakdown__section-title">Documents</h3>
              <div class="price-breakdown__items">
                <For each={pricingData()!.documents}>
                  {(doc) => (
                    <div class="price-breakdown__item">
                      <span class="price-breakdown__item-icon">📝</span>
                      <span class="price-breakdown__item-name">{doc.title}</span>
                      <span class="price-breakdown__item-price">{formatPrice(doc.price_cents)}</span>
                    </div>
                  )}
                </For>
              </div>
              <Show when={pricingData()!.documents.length > 1}>
                <div class="price-breakdown__subtotal">
                  <span class="price-breakdown__subtotal-label">Documents Subtotal</span>
                  <span class="price-breakdown__subtotal-value">{formatPrice(totalDocumentsPrice())}</span>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={pricingData()?.embeddedProducts && pricingData()!.embeddedProducts.length > 0}>
            <div class="price-breakdown__section">
              <h3 class="price-breakdown__section-title">Embedded Products</h3>
              <div class="price-breakdown__items">
                <For each={pricingData()!.embeddedProducts}>
                  {(product) => (
                    <div class="price-breakdown__item">
                      <span class="price-breakdown__item-icon">📦</span>
                      <div class="price-breakdown__item-info">
                        <span class="price-breakdown__item-name">{product.title}</span>
                        <span class="price-breakdown__item-creator">by {product.creator_name}</span>
                      </div>
                      <span class="price-breakdown__item-price">{formatPrice(product.inherited_price_cents)}</span>
                    </div>
                  )}
                </For>
              </div>
              <Show when={pricingData()!.embeddedProducts.length > 1}>
                <div class="price-breakdown__subtotal">
                  <span class="price-breakdown__subtotal-label">Embedded Products Subtotal</span>
                  <span class="price-breakdown__subtotal-value">{formatPrice(totalEmbeddedPrice())}</span>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={totalPrice() > 0}>
            <div class="price-breakdown__total">
              <span class="price-breakdown__total-label">Total Price</span>
              <span class="price-breakdown__total-value">{formatPrice(totalPrice())}</span>
            </div>
          </Show>

          <Show when={totalPrice() === 0}>
            <div class="price-breakdown__empty">
              <span class="price-breakdown__empty-icon">💰</span>
              <p class="price-breakdown__empty-text">Free</p>
              <p class="price-breakdown__empty-hint">No price set for files, documents, or embedded products</p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
