import { createSignal, For, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
  FormField,
} from "./base";
import "./base/base.css";
import "./product-price-manager.css";

export interface ProductPriceManagerProps {
  variantId: string;
  variantTitle: string;
  existingPrices: Array<{
    id: string;
    currency: string;
    unit_amount: number;
    min_quantity: number;
    max_quantity: number | null;
  }>;
}

export default function ProductPriceManager(props: ProductPriceManagerProps) {
  const [isAdding, setIsAdding] = createSignal(false);
  const [currency, setCurrency] = createSignal("usd");
  const [amount, setAmount] = createSignal("");
  const [minQuantity, setMinQuantity] = createSignal("1");
  const [maxQuantity, setMaxQuantity] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [deletingPriceId, setDeletingPriceId] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleAddPrice = async (e: SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const unitAmount = Math.round(parseFloat(amount()) * 100);

      const response = await fetch("/api/products/variants/create-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
          currency: currency(),
          unitAmount: unitAmount,
          minQuantity: parseInt(minQuantity()),
          maxQuantity: maxQuantity() ? parseInt(maxQuantity()) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create price");
        setIsLoading(false);
        return;
      }

      setSuccess("Price added! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm("Are you sure you want to delete this price?")) {
      return;
    }

    setDeletingPriceId(priceId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/delete-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete price");
        setDeletingPriceId(null);
        return;
      }

      setSuccess("Price deleted! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setDeletingPriceId(null);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setAmount("");
    setMinQuantity("1");
    setMaxQuantity("");
    setError("");
  };

  return (
    <div class="price-manager">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="price-manager__header">
        <h4 class="price-manager__title">Pricing for {props.variantTitle}</h4>
      </div>

      <Show when={props.existingPrices.length > 0}>
        <div class="price-manager__list">
          <For each={props.existingPrices}>
            {(price) => (
              <div class="price-item">
                <div class="price-item__details">
                  <span class="price-item__amount">
                    {price.unit_amount === 0
                      ? "FREE"
                      : `${price.currency.toUpperCase()} $${(price.unit_amount / 100).toFixed(2)}`}
                  </span>
                  <span class="price-item__quantity">
                    {price.min_quantity > 1 && `Min: ${price.min_quantity}`}
                    {price.max_quantity && ` Max: ${price.max_quantity}`}
                    {price.min_quantity === 1 && !price.max_quantity && "Base price"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePrice(price.id)}
                  class="price-item__delete"
                  disabled={deletingPriceId() === price.id}
                >
                  {deletingPriceId() === price.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show
        when={isAdding()}
        fallback={
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            class="price-manager__add-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Price Tier
          </button>
        }
      >
        <form onSubmit={handleAddPrice} class="price-manager__form">
          <div class="price-manager__form-row">
            <div class="price-manager__form-field">
              <label for="currency" class="price-manager__label">Currency</label>
              <select
                id="currency"
                value={currency()}
                onInput={(e) => setCurrency(e.currentTarget.value)}
                class="price-manager__select"
                disabled={isLoading()}
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
                <option value="cad">CAD</option>
              </select>
            </div>

            <FormField
              label="Price"
              name="amount"
              type="number"
              value={amount()}
              onInput={(e) => setAmount(e.currentTarget.value)}
              placeholder="9.99"
              required
              disabled={isLoading()}
              step="0.01"
              min="0"
            />
          </div>

          <div class="price-manager__form-row">
            <FormField
              label="Min Quantity"
              name="minQuantity"
              type="number"
              value={minQuantity()}
              onInput={(e) => setMinQuantity(e.currentTarget.value)}
              placeholder="1"
              required
              disabled={isLoading()}
              min="1"
              helpText="Minimum quantity to get this price"
            />

            <FormField
              label="Max Quantity (Optional)"
              name="maxQuantity"
              type="number"
              value={maxQuantity()}
              onInput={(e) => setMaxQuantity(e.currentTarget.value)}
              placeholder="Leave empty for unlimited"
              disabled={isLoading()}
              min="1"
              helpText="Maximum quantity for this price tier"
            />
          </div>

          <div class="price-manager__form-actions">
            <LoadingButton
              type="submit"
              isLoading={isLoading()}
              loadingText="Adding..."
              variant="primary"
              size="sm"
            >
              Add Price
            </LoadingButton>
            <button
              type="button"
              onClick={handleCancel}
              class="price-manager__cancel"
              disabled={isLoading()}
            >
              Cancel
            </button>
          </div>
        </form>
      </Show>
    </div>
  );
}
