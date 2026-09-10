import { createSignal, createResource, Show, For, onMount } from "solid-js";
import "./cart-item-breakdown.css";

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

export interface CartItemBreakdownProps {
  productId: string;
}

interface BreakdownData {
  files: ProductFile[];
  documents: ProductDocument[];
  embeddedProducts: EmbeddedProduct[];
}

export default function CartItemBreakdown(props: CartItemBreakdownProps) {
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  const formatPrice = (cents: number): string => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Fetch breakdown data
  const [breakdownData] = createResource(
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
        console.error("Error fetching breakdown data:", error);
        return {
          files: [],
          documents: [],
          embeddedProducts: [],
        } as BreakdownData;
      }
    }
  );

  const hasContent = () => {
    const data = breakdownData();
    if (!data) return false;
    return data.files.length > 0 || data.documents.length > 0 || data.embeddedProducts.length > 0;
  };

  return (
    <Show when={!breakdownData.loading && hasContent()}>
      <div class="cart-item-breakdown">
        <div class="cart-item-breakdown__header">
          <span class="cart-item-breakdown__title">Includes:</span>
        </div>

        <div class="cart-item-breakdown__content">
          {/* Files */}
          <Show when={breakdownData()?.files && breakdownData()!.files.length > 0}>
            <div class="cart-item-breakdown__section">
              <For each={breakdownData()!.files}>
                {(file) => (
                  <div class="cart-item-breakdown__item">
                    <span class="cart-item-breakdown__icon">📄</span>
                    <span class="cart-item-breakdown__name">{file.title}</span>
                    <Show when={file.price_cents > 0}>
                      <span class="cart-item-breakdown__price">{formatPrice(file.price_cents)}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Documents */}
          <Show when={breakdownData()?.documents && breakdownData()!.documents.length > 0}>
            <div class="cart-item-breakdown__section">
              <For each={breakdownData()!.documents}>
                {(doc) => (
                  <div class="cart-item-breakdown__item">
                    <span class="cart-item-breakdown__icon">📝</span>
                    <span class="cart-item-breakdown__name">{doc.title}</span>
                    <Show when={doc.price_cents > 0}>
                      <span class="cart-item-breakdown__price">{formatPrice(doc.price_cents)}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Embedded Products */}
          <Show when={breakdownData()?.embeddedProducts && breakdownData()!.embeddedProducts.length > 0}>
            <div class="cart-item-breakdown__section">
              <For each={breakdownData()!.embeddedProducts}>
                {(product) => (
                  <div class="cart-item-breakdown__item">
                    <span class="cart-item-breakdown__icon">📦</span>
                    <div class="cart-item-breakdown__product-info">
                      <span class="cart-item-breakdown__name">{product.title}</span>
                      <span class="cart-item-breakdown__creator">by {product.creator_name}</span>
                    </div>
                    <Show when={product.inherited_price_cents > 0}>
                      <span class="cart-item-breakdown__price">{formatPrice(product.inherited_price_cents)}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
