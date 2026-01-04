import { createMemo, For, Show } from "solid-js";
import type { ProductFile } from "@/types";
import type { ProductDocumentRelation } from "./ProductContentManager/ContentItem";
import PurchaseActions from "./ProductContentManager/PurchaseActions";
import "./product-content-viewer.css";

export interface ProductContentViewerProps {
  productId: string;
  productTitle: string;
  isAuthenticated: boolean;

  files: ProductFile[];
  documents: ProductDocumentRelation[];
  embeddedProducts: Array<{
    id: string;
    title: string;
    handle: string;
    inherited_price_cents: number;
    creator_name: string;
  }>;
}

interface ContentViewItem {
  id: string;
  type: "file" | "document" | "embedded";
  name: string;
  price: number;
  creatorInfo?: string;
}

export default function ProductContentViewer(props: ProductContentViewerProps) {
  // Combine all content into unified list
  const contentItems = createMemo<ContentViewItem[]>(() => {
    const fileItems: ContentViewItem[] = props.files.map((f) => ({
      id: f.id,
      type: "file",
      name: f.title,
      price: f.price_cents,
    }));

    const docItems: ContentViewItem[] = props.documents.map((d) => ({
      id: d.id,
      type: "document",
      name: d.document.title,
      price: d.price_cents,
    }));

    const embeddedItems: ContentViewItem[] = props.embeddedProducts.map((p) => ({
      id: p.id,
      type: "embedded",
      name: p.title,
      price: p.inherited_price_cents,
      creatorInfo: `by ${p.creator_name}`,
    }));

    return [...fileItems, ...docItems, ...embeddedItems];
  });

  const totalPrice = createMemo(() =>
    contentItems().reduce((sum, item) => sum + item.price, 0)
  );

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTypeIcon = (type: "file" | "document" | "embedded"): string => {
    switch (type) {
      case "file":
        return "📁";
      case "document":
        return "📄";
      case "embedded":
        return "📦";
    }
  };

  const getTypeName = (type: "file" | "document" | "embedded"): string => {
    switch (type) {
      case "file":
        return "File";
      case "document":
        return "Document";
      case "embedded":
        return "Product";
    }
  };

  return (
    <div class="product-content-viewer">
      {/* Content List */}
      <div class="product-content-viewer__list">
        <Show
          when={contentItems().length > 0}
          fallback={
            <div class="product-content-viewer__empty">
              <p class="product-content-viewer__empty-text">
                No content available yet
              </p>
            </div>
          }
        >
          <For each={contentItems()}>
            {(item) => (
              <div class="product-content-viewer__item">
                <div class="product-content-viewer__item-badge">
                  <span class="product-content-viewer__item-icon">
                    {getTypeIcon(item.type)}
                  </span>
                  <span class="product-content-viewer__item-type">
                    {getTypeName(item.type)}
                  </span>
                </div>
                <div class="product-content-viewer__item-info">
                  <div class="product-content-viewer__item-name">{item.name}</div>
                  <Show when={item.creatorInfo}>
                    <div class="product-content-viewer__item-creator">
                      {item.creatorInfo}
                    </div>
                  </Show>
                </div>
                <div class="product-content-viewer__item-price">
                  {formatPrice(item.price)}
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>

      {/* Total Price */}
      <div class="product-content-viewer__total">
        <span class="product-content-viewer__total-label">Total</span>
        <span class="product-content-viewer__total-price">
          {formatPrice(totalPrice())}
        </span>
      </div>

      {/* Purchase Actions */}
      <PurchaseActions
        productId={props.productId}
        productTitle={props.productTitle}
        isAuthenticated={props.isAuthenticated}
      />
    </div>
  );
}
