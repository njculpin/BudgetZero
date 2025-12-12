import { createSignal, Show, onMount, onCleanup } from "solid-js";
import "./add-to-cart-button.css";

export interface AddToCartButtonProps {
  productId: string;
  productTitle: string;
  isAuthenticated: boolean;
}

export default function AddToCartButton(props: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [showSuccessModal, setShowSuccessModal] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  let modalRef: HTMLDivElement | undefined;
  let closeButtonRef: HTMLButtonElement | undefined;

  const handleAddToCart = async () => {
    // If not authenticated, redirect to sign in
    if (!props.isAuthenticated) {
      window.location.href = `/sign-in?redirect=/products/${props.productId}`;
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cart/add-to-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: props.productId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to cart");
      }

      // Show success modal
      setShowSuccessModal(true);

      // Focus the close button when modal opens
      setTimeout(() => {
        closeButtonRef?.focus();
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const handleViewCart = () => {
    window.location.href = "/cart";
  };

  // Handle escape key to close modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && showSuccessModal()) {
      handleCloseModal();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div class="add-to-cart">
      <button
        class="add-to-cart__button"
        onClick={handleAddToCart}
        disabled={isLoading()}
      >
        <Show
          when={!isLoading()}
          fallback={
            <span class="add-to-cart__loading">Adding to cart...</span>
          }
        >
          <svg
            class="add-to-cart__icon"
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
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span class="add-to-cart__text">
            {props.isAuthenticated ? "Add to Cart" : "Sign In to Purchase"}
          </span>
        </Show>
      </button>

      <Show when={error()}>
        <div class="add-to-cart__error">{error()}</div>
      </Show>

      {/* Success Modal */}
      <Show when={showSuccessModal()}>
        <div
          class="add-to-cart-modal__overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
        >
          <div
            ref={modalRef}
            class="add-to-cart-modal__content"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="add-to-cart-modal__header">
              <div class="add-to-cart-modal__icon-wrapper">
                <svg
                  class="add-to-cart-modal__icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 id="cart-modal-title" class="add-to-cart-modal__title">
                Added to Cart!
              </h3>
              <p class="add-to-cart-modal__description">
                "{props.productTitle}" has been added to your cart
              </p>
            </div>

            <div class="add-to-cart-modal__actions">
              <button
                type="button"
                onClick={handleViewCart}
                class="add-to-cart-modal__button add-to-cart-modal__button--primary"
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
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                View Cart
              </button>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleCloseModal}
                class="add-to-cart-modal__button add-to-cart-modal__button--secondary"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
