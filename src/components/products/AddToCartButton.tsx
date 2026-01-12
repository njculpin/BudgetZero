import { createSignal, Show } from "solid-js";
import type { Product } from "@/types";
import "./add-to-cart-button.css";

interface AddToCartButtonProps {
  productId: string;
  productTitle: string;
  priceCents: number | null;
  status: Product["status"];
  isOwner: boolean;
  isAuthenticated: boolean;
}

export default function AddToCartButton(props: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const canPurchase = () => {
    return (
      !props.isOwner &&
      props.isAuthenticated &&
      (props.status === "public" || props.status === "private") &&
      props.priceCents !== null
    );
  };

  const handleAddToCart = async () => {
    if (!canPurchase()) return;

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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add to cart");
      }

      setSuccess(true);

      // Redirect to cart after brief success message
      setTimeout(() => {
        window.location.href = "/cart";
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart");
      setIsLoading(false);
    }
  };

  return (
    <div class="add-to-cart">
      {/* Price Display */}
      <Show when={props.priceCents !== null}>
        <div class="add-to-cart__price-section">
          <span class="add-to-cart__price-label">Price</span>
          <span class="add-to-cart__price">
            {formatPrice(props.priceCents!)}
          </span>
        </div>
      </Show>

      {/* Owner Message */}
      <Show when={props.isOwner}>
        <div class="add-to-cart__message add-to-cart__message--info">
          <p>This is your product. You cannot purchase it.</p>
        </div>
      </Show>

      {/* Not Authenticated Message */}
      <Show when={!props.isAuthenticated && !props.isOwner}>
        <div class="add-to-cart__message add-to-cart__message--warning">
          <p>Please sign in to purchase this product.</p>
          <a href="/sign-in" class="add-to-cart__sign-in-link">
            Sign In
          </a>
        </div>
      </Show>

      {/* Status Message */}
      <Show
        when={
          props.isAuthenticated &&
          !props.isOwner &&
          props.status !== "public" &&
          props.status !== "private"
        }
      >
        <div class="add-to-cart__message add-to-cart__message--warning">
          <p>This product is not available for purchase.</p>
          <p class="add-to-cart__status-detail">
            Current status: <strong>{props.status}</strong>
          </p>
        </div>
      </Show>

      {/* Add to Cart Button */}
      <Show when={canPurchase()}>
        <button
          class="add-to-cart__button"
          onClick={handleAddToCart}
          disabled={isLoading() || success()}
          type="button"
        >
          <Show when={isLoading()}>
            <span class="add-to-cart__button-spinner" />
          </Show>
          <Show when={success()}>
            <span class="add-to-cart__button-icon">✓</span>
          </Show>
          <span class="add-to-cart__button-text">
            {success() ? "Added to Cart!" : "Add to Cart"}
          </span>
        </button>
      </Show>

      {/* Error Message */}
      <Show when={error()}>
        <div class="add-to-cart__error" role="alert">
          <p>{error()}</p>
          <button
            class="add-to-cart__error-dismiss"
            onClick={() => setError(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      </Show>

      {/* Success Message */}
      <Show when={success()}>
        <div class="add-to-cart__success" role="status">
          <p>
            <strong>{props.productTitle}</strong> added to cart. Redirecting...
          </p>
        </div>
      </Show>
    </div>
  );
}
