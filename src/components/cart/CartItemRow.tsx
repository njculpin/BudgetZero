import { createSignal, Show } from "solid-js";
import { ErrorMessage, ConfirmDialog } from "@/components/interactive";
import CartItemBreakdown from "./CartItemBreakdown";
import "@/components/interactive/base.css";
import "./cart-item-row.css";
import type { CartItem, Product } from "@/types";

interface CartItemRowProps {
  item: CartItem & {
    product: Product | null;
  };
  onUpdate?: () => void;
  onRemove?: () => void;
}

export default function CartItemRow(props: CartItemRowProps) {
  const [quantity, setQuantity] = createSignal(props.item.quantity);
  const [isUpdating, setIsUpdating] = createSignal(false);
  const [isRemoving, setIsRemoving] = createSignal(false);
  const [error, setError] = createSignal("");
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const [liveMessage, setLiveMessage] = createSignal("");

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity === quantity()) return;

    setError("");
    setIsUpdating(true);

    // Store previous value for rollback
    const previousQuantity = quantity();

    // Optimistic update - update UI immediately
    setQuantity(newQuantity);

    try {
      const response = await fetch("/api/cart/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItemId: props.item.id,
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Rollback on error
        setQuantity(previousQuantity);
        setError(data.error || "Failed to update quantity");
        setIsUpdating(false);
        return;
      }

      setIsUpdating(false);

      // Announce change to screen readers
      const productName = props.item.product?.title || "Product";
      setLiveMessage(`${productName} quantity updated to ${newQuantity}`);
      setTimeout(() => setLiveMessage(""), 3000);

      // Notify parent to refresh cart
      if (props.onUpdate) {
        props.onUpdate();
      }
    } catch (err) {
      // Rollback on network error
      setQuantity(previousQuantity);
      setError("Network error - please try again");
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setShowDeleteDialog(false);
    setError("");
    setIsRemoving(true);

    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItemId: props.item.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to remove item");
        setIsRemoving(false);
        return;
      }

      // Announce removal to screen readers
      const productName = props.item.product?.title || "Product";
      setLiveMessage(`${productName} removed from cart`);

      // Notify parent to refresh cart
      if (props.onRemove) {
        props.onRemove();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsRemoving(false);
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return "FREE";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const unitPrice = () => {
    // Use price_cents from product
    return props.item.product?.price_cents || 0;
  };

  const totalPrice = () => {
    return unitPrice() * quantity();
  };

  return (
    <div class="cart-item-row">
      {/* Visually hidden live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        class="sr-only"
      >
        {liveMessage()}
      </div>

      {error() && (
        <div class="cart-item-row__error">
          <ErrorMessage
            message={error()}
            onDismiss={() => setError("")}
          />
        </div>
      )}

      <div class="cart-item-row__content">
        <div class="cart-item-row__info">
          <h3 class="cart-item-row__product-name">
            <a href={`/products/${props.item.product?.handle}`}>
              {props.item.product?.title || "Unknown Product"}
            </a>
          </h3>
          <p class="cart-item-row__price">
            {formatPrice(unitPrice())} each
          </p>
          <Show when={props.item.product?.id}>
            <CartItemBreakdown productId={props.item.product!.id} />
          </Show>
        </div>

        <div class="cart-item-row__actions">
          <div class="cart-item-row__quantity">
            <label for={`quantity-${props.item.id}`} class="cart-item-row__quantity-label">
              Qty:
            </label>
            <input
              type="number"
              id={`quantity-${props.item.id}`}
              class="cart-item-row__quantity-input"
              value={quantity()}
              min="1"
              disabled={isUpdating() || isRemoving()}
              onInput={(e) => {
                const value = parseInt(e.currentTarget.value);
                if (!isNaN(value) && value > 0) {
                  setQuantity(value);
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.currentTarget.value);
                if (!isNaN(value) && value > 0) {
                  handleQuantityChange(value);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const value = parseInt(e.currentTarget.value);
                  if (!isNaN(value) && value > 0) {
                    handleQuantityChange(value);
                  }
                }
              }}
            />
          </div>

          <button
            type="button"
            class="cart-item-row__remove-button button button--ghost button--sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isUpdating() || isRemoving()}
          >
            <span class="button__text">
              {isRemoving() ? "Removing..." : "Remove"}
            </span>
          </button>
        </div>

        <div class="cart-item-row__total">
          <p class="cart-item-row__total-price">
            {formatPrice(totalPrice())}
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog()}
        title="Remove Item"
        message={`Are you sure you want to remove "${props.item.product?.title}" from your cart?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
