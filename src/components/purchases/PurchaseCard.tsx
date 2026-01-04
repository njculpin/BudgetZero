import { createSignal, Show, For } from "solid-js";
import type { Sale, SaleItem } from "@/types";
import "./purchase-card.css";

export interface PurchaseFile {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  price_cents: number;
  source_product_title?: string;
  is_document?: boolean;
}

export interface PurchaseItemWithDetails extends SaleItem {
  product: {
    id: string;
    title: string;
    description?: string;
  } | null;
  files: PurchaseFile[];
}

export interface PurchaseWithDetails extends Sale {
  items: PurchaseItemWithDetails[];
}

export interface PurchaseCardProps {
  purchase: PurchaseWithDetails;
  initialExpanded?: boolean;
}

export default function PurchaseCard(props: PurchaseCardProps) {
  const [isExpanded, setIsExpanded] = createSignal(props.initialExpanded ?? false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded());
  };

  // Calculate total counts
  const totalProducts = () => props.purchase.items.length;
  const totalFiles = () =>
    props.purchase.items.reduce((sum, item) => sum + (item.files?.length || 0), 0);

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format price
  const formatPrice = (): string => {
    return `${props.purchase.currency.toUpperCase()} ${(props.purchase.price_cents / 100).toFixed(2)}`;
  };

  return (
    <div class={`purchase-card ${isExpanded() ? 'purchase-card--expanded' : ''}`}>
      {/* Card Header - Always Visible */}
      <div class="purchase-card__header" onClick={toggleExpanded}>
        <div class="purchase-card__header-info">
          <h3 class="purchase-card__header-date">
            Order from {formatDate(props.purchase.created_at)}
          </h3>
          <p class="purchase-card__header-id">Order ID: {props.purchase.id}</p>
        </div>
        <div class="purchase-card__header-right">
          <span class="purchase-card__header-amount">{formatPrice()}</span>
          <button
            type="button"
            class="purchase-card__toggle"
            aria-label={isExpanded() ? "Collapse purchase" : "Expand purchase"}
            aria-expanded={isExpanded()}
          >
            <svg
              class={`purchase-card__toggle-icon ${isExpanded() ? 'purchase-card__toggle-icon--expanded' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Summary - Only When Collapsed */}
      <Show when={!isExpanded()}>
        <div class="purchase-card__summary">
          <span class="purchase-card__summary-badge">
            {totalProducts()} {totalProducts() === 1 ? 'product' : 'products'} • {totalFiles()} {totalFiles() === 1 ? 'file' : 'files'}
          </span>
        </div>
      </Show>

      {/* Expanded Content - Only When Expanded */}
      <Show when={isExpanded()}>
        <div class="purchase-card__content">
          <For each={props.purchase.items}>
            {(item) => (
              <div class="purchase-item">
                <div class="purchase-item__header">
                  <h4 class="purchase-item__title">
                    {item.product?.title || 'Unknown Product'}
                  </h4>
                  <Show when={item.product?.description}>
                    <p class="purchase-item__description">
                      {item.product!.description}
                    </p>
                  </Show>
                </div>

                <Show
                  when={item.files && item.files.length > 0}
                  fallback={
                    <p class="purchase-item__no-files">
                      No digital downloads available for this item
                    </p>
                  }
                >
                  <div class="purchase-item__files">
                    <h5 class="purchase-item__files-title">Available Downloads</h5>
                    <div class="purchase-item__files-list">
                      <For each={item.files}>
                        {(file) => (
                          <div class="file-item">
                            <div class="file-item__info">
                              <div class="file-item__name-row">
                                <span class="file-item__name">{file.title}</span>
                                <Show when={file.is_document}>
                                  <span class="file-item__badge">PDF</span>
                                </Show>
                              </div>
                              <Show when={file.source_product_title && file.source_product_title !== item.product?.title}>
                                <span class="file-item__source">
                                  From: {file.source_product_title}
                                </span>
                              </Show>
                              <Show when={file.description}>
                                <span class="file-item__description">{file.description}</span>
                              </Show>
                              <Show when={!file.is_document && file.file_size_bytes > 0}>
                                <span class="file-item__size">
                                  {(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </Show>
                            </div>
                            <div class="file-item__actions">
                              <Show
                                when={file.is_document}
                                fallback={
                                  <form method="POST" action="/api/download">
                                    <input type="hidden" name="file_id" value={file.id} />
                                    <input type="hidden" name="product_id" value={item.product_id} />
                                    <button type="submit" class="button button--outline button--sm">
                                      <span class="button__text">Download</span>
                                    </button>
                                  </form>
                                }
                              >
                                <a
                                  href={file.file_url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="button button--outline button--sm"
                                >
                                  <span class="button__text">Download PDF</span>
                                </a>
                              </Show>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
