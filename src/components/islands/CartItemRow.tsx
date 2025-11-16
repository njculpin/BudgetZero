import { createSignal } from "solid-js";
import { ErrorMessage, ConfirmDialog } from "./base";
import "./base/base.css";
import "./cart-item-row.css";
import type { CartItem } from "@/types";
import type { Product, ProductVariant, ProductVariantPrice } from "@/types";

interface CartItemRowProps {
  item: CartItem & {
    product: Product | null;
    variant: ProductVariant | null;
    price: ProductVariantPrice | null;
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

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity === quantity()) return;

    setError("");
    setIsUpdating(true);

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
        setError(data.error || "Failed to update quantity");
        setIsUpdating(false);
        return;
      }

      setQuantity(newQuantity);
      setIsUpdating(false);

      // Notify parent to refresh cart
      if (props.onUpdate) {
        props.onUpdate();
      }
    } catch (err) {
      setError("An unexpected error occurred");
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

      // Notify parent to refresh cart
      if (props.onRemove) {
        props.onRemove();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsRemoving(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    if (cents === 0) return "FREE";
    return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
  };

  const totalPrice = () => {
    if (!props.item.price) return 0;
    return props.item.price.unit_amount * quantity();
  };

  return (
    <div class="cart-item-row">
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
          <p class="cart-item-row__variant-name">
            {props.item.variant?.title || ""}
          </p>
          {props.item.price && (
            <p class="cart-item-row__price">
              {formatPrice(props.item.price.unit_amount, props.item.price.currency)}
            </p>
          )}
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
          {props.item.price && (
            <p class="cart-item-row__total-price">
              {formatPrice(totalPrice(), props.item.price.currency)}
            </p>
          )}
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
