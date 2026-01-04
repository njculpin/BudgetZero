import { createSignal, Show } from "solid-js";
import { LoadingButton } from "@/components/interactive";
import Modal, { ModalHeader, ModalFooter } from "@/components/Modal";

export interface PurchaseActionsProps {
  productId: string;
  productTitle: string;
  isAuthenticated: boolean;
}

export default function PurchaseActions(props: PurchaseActionsProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [showSuccessModal, setShowSuccessModal] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleAddToCart = async () => {
    if (!props.isAuthenticated) {
      window.location.href = `/sign-in?redirect=/products/${props.productId}`;
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cart/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
          quantity: 1,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add to cart");

      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => setShowSuccessModal(false);
  const handleViewCart = () => {
    window.location.href = "/cart";
  };

  return (
    <div class="purchase-actions">
      <LoadingButton
        type="button"
        variant="primary"
        size="lg"
        onClick={handleAddToCart}
        isLoading={isLoading()}
        loadingText="Adding to cart..."
        class="purchase-actions__button"
      >
        <svg
          class="purchase-actions__button-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="margin-right: 0.5rem"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {props.isAuthenticated ? "Add to Cart" : "Sign In to Purchase"}
      </LoadingButton>

      <Show when={error()}>
        <div class="purchase-actions__error">{error()}</div>
      </Show>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal()}
        onClose={handleCloseModal}
        size="sm"
        showCloseButton={false}
      >
        <ModalHeader
          centered
          icon={
            <svg
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
          }
        >
          <h3 class="purchase-actions__success-title">Added to Cart!</h3>
          <p class="purchase-actions__success-description">
            "{props.productTitle}" has been added to your cart
          </p>
        </ModalHeader>

        <ModalFooter justify="center">
          <LoadingButton
            type="button"
            variant="primary"
            size="md"
            onClick={handleViewCart}
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
              style="margin-right: 0.5rem"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            View Cart
          </LoadingButton>
          <LoadingButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleCloseModal}
          >
            Continue Shopping
          </LoadingButton>
        </ModalFooter>
      </Modal>
    </div>
  );
}
