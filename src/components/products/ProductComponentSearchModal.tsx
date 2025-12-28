import { createSignal, Show, For, createEffect, onCleanup } from "solid-js";
import type { Product } from "@/types";
import "./product-component-search-modal.css";

export interface ProductComponentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (productId: string, royaltyAmountCents: number) => void;
  variantTitle?: string;
}

export default function ProductComponentSearchModal(props: ProductComponentSearchModalProps) {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [products, setProducts] = createSignal<Product[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [selectedProduct, setSelectedProduct] = createSignal<Product | null>(null);

  // Modal ref for focus trap
  let modalRef: HTMLDivElement | undefined;

  // Fetch user's embeddable products
  const fetchEmbeddableProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/embeddable');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching embeddable products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search/filter products
  const filteredProducts = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return products();
    return products().filter(product =>
      product.title.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
  };

  // Format royalty amount for display
  const formatRoyalty = (product: Product): string => {
    if (product.embedding_royalty_cents) {
      return `$${(product.embedding_royalty_cents / 100).toFixed(2)} per sale`;
    }
    return 'No royalty set';
  };

  // Handle product selection
  const handleSelectProduct = () => {
    const product = selectedProduct();
    if (product) {
      const royaltyAmount = product.embedding_royalty_cents || 0;
      props.onProductSelect(product.id, royaltyAmount);
      props.onClose();
    }
  };

  // Fetch products when modal opens
  createEffect(() => {
    if (props.isOpen) {
      fetchEmbeddableProducts();
    }
  });

  // Focus trap implementation
  createEffect(() => {
    if (!props.isOpen || !modalRef) return;

    // Get all focusable elements within the modal
    const getFocusableElements = (): HTMLElement[] => {
      if (!modalRef) return [];

      const selectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];

      return Array.from(modalRef.querySelectorAll(selectors.join(', ')));
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        props.onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        // Shift + Tab (backwards)
        if (e.shiftKey) {
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        }
        // Tab (forwards)
        else {
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Focus first element when modal opens
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        focusableElements[0].focus();
      }, 50);
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on close
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <Show when={props.isOpen}>
      <div class="product-component-modal-backdrop" onClick={props.onClose}>
        <div
          ref={modalRef}
          class="product-component-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-component-modal-title"
        >
          {/* Header */}
          <div class="product-component-modal__header">
            <h2 id="product-component-modal-title" class="product-component-modal__title">
              Add Component{props.variantTitle ? ` to ${props.variantTitle}` : ''}
            </h2>
            <button
              class="product-component-modal__close"
              onClick={props.onClose}
              aria-label="Close modal"
            >
              <svg
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="product-component-modal__body">
            <div class="product-component-search">
              {/* Search Bar */}
              <div class="product-component-search__header">
                <input
                  type="text"
                  class="product-component-search__input"
                  placeholder="Search embeddable products..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                />
              </div>

              {/* Products Grid */}
              <Show
                when={!loading()}
                fallback={
                  <div class="product-component-search__loading">
                    <p>Loading products...</p>
                  </div>
                }
              >
                <Show
                  when={filteredProducts().length > 0}
                  fallback={
                    <div class="product-component-search__empty">
                      <svg
                        class="product-component-search__empty-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <p class="product-component-search__empty-title">No embeddable products found</p>
                      <p class="product-component-search__empty-text">
                        Create products and mark them as embeddable to use as components
                      </p>
                    </div>
                  }
                >
                  <div class="product-component-search__grid">
                    <For each={filteredProducts()}>
                      {(product) => (
                        <button
                          class={`product-component-card ${selectedProduct()?.id === product.id ? 'product-component-card--selected' : ''}`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div class="product-component-card__thumbnail">
                            <div class="product-component-card__placeholder">
                              {product.title.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div class="product-component-card__content">
                            <h3 class="product-component-card__title">{product.title}</h3>
                            <span class="product-component-card__royalty">
                              {formatRoyalty(product)}
                            </span>
                            <Show when={product.file_count && product.file_count > 0}>
                              <span class="product-component-card__files">
                                {product.file_count} {product.file_count === 1 ? 'file' : 'files'}
                              </span>
                            </Show>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </Show>
            </div>
          </div>

          {/* Footer */}
          <div class="product-component-modal__footer">
            <button
              class="product-component-modal__button product-component-modal__button--secondary"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <button
              class="product-component-modal__button product-component-modal__button--primary"
              onClick={handleSelectProduct}
              disabled={!selectedProduct()}
            >
              Add Component
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
