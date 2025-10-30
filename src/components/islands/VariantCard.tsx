import { createSignal, Show, For } from "solid-js";
import {
  FormField,
  TextAreaField,
  SelectField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
  ConfirmDialog,
} from "./base";
import type { Asset, ProductVariantPrice } from "@/types";

export interface VariantCardProps {
  variant: {
    id: string;
    title: string;
    description: string | null;
    sku: string;
    is_digital: boolean;
    linkedAssets: Asset[];
    prices: ProductVariantPrice[];
  };
  availableAssets: Asset[];
  onUpdate: () => void;
}

export default function VariantCard(props: VariantCardProps) {
  // Edit variant state
  const [showEditForm, setShowEditForm] = createSignal(false);
  const [editTitle, setEditTitle] = createSignal(props.variant.title);
  const [editDescription, setEditDescription] = createSignal(props.variant.description || "");
  const [isEditLoading, setIsEditLoading] = createSignal(false);

  // Delete variant state
  const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);
  const [isDeleteLoading, setIsDeleteLoading] = createSignal(false);

  // Link asset state
  const [selectedAssetId, setSelectedAssetId] = createSignal("");
  const [isLinkLoading, setIsLinkLoading] = createSignal(false);

  // Create price state
  const [showPriceForm, setShowPriceForm] = createSignal(false);
  const [priceAmount, setPriceAmount] = createSignal("");
  const [priceCurrency, setPriceCurrency] = createSignal("usd");
  const [priceMinQty, setPriceMinQty] = createSignal("1");
  const [priceMaxQty, setPriceMaxQty] = createSignal("");
  const [isPriceLoading, setIsPriceLoading] = createSignal(false);

  // General state
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleEditVariant = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsEditLoading(true);

    try {
      const response = await fetch("/api/products/variants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variant.id,
          title: editTitle(),
          description: editDescription() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update variant");
        setIsEditLoading(false);
        return;
      }

      setSuccess("Variant updated successfully!");
      setIsEditLoading(false);
      setShowEditForm(false);

      setTimeout(() => {
        props.onUpdate();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsEditLoading(false);
    }
  };

  const handleDeleteVariant = async () => {
    setError("");
    setSuccess("");
    setIsDeleteLoading(true);

    try {
      const response = await fetch("/api/products/variants/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variant.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete variant");
        setIsDeleteLoading(false);
        setShowDeleteDialog(false);
        return;
      }

      setSuccess("Variant deleted successfully!");
      setIsDeleteLoading(false);
      setShowDeleteDialog(false);

      setTimeout(() => {
        props.onUpdate();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleLinkAsset = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAssetId()) {
      setError("Please select an asset");
      return;
    }

    setIsLinkLoading(true);

    try {
      const response = await fetch("/api/products/variants/link-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variant.id,
          assetId: selectedAssetId(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to link asset");
        setIsLinkLoading(false);
        return;
      }

      setSuccess("Asset linked successfully!");
      setIsLinkLoading(false);
      setSelectedAssetId("");

      setTimeout(() => {
        props.onUpdate();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLinkLoading(false);
    }
  };

  const handleUnlinkAsset = async (assetId: string) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/unlink-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variant.id,
          assetId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to unlink asset");
        return;
      }

      setSuccess("Asset unlinked successfully!");

      setTimeout(() => {
        props.onUpdate();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleCreatePrice = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!priceAmount()) {
      setError("Please enter a price");
      return;
    }

    setIsPriceLoading(true);

    try {
      const unitAmountDollars = parseFloat(priceAmount());
      const unitAmount = Math.round(unitAmountDollars * 100); // Convert to cents

      const response = await fetch("/api/products/variants/create-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variant.id,
          currency: priceCurrency(),
          unitAmount,
          minQuantity: parseInt(priceMinQty()),
          maxQuantity: priceMaxQty() ? parseInt(priceMaxQty()) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create price");
        setIsPriceLoading(false);
        return;
      }

      setSuccess("Price created successfully!");
      setIsPriceLoading(false);
      setShowPriceForm(false);

      // Reset form
      setPriceAmount("");
      setPriceCurrency("usd");
      setPriceMinQty("1");
      setPriceMaxQty("");

      setTimeout(() => {
        props.onUpdate();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsPriceLoading(false);
    }
  };

  return (
    <div class="variant-card">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="variant-card__header">
        <h3 class="variant-card__title">{props.variant.title}</h3>
        <span class="variant-card__badge">Digital</span>
      </div>

      <Show when={props.variant.description}>
        <p class="variant-card__description">{props.variant.description}</p>
      </Show>

      <div class="variant-card__sku">
        SKU: <code>{props.variant.sku}</code>
      </div>

      {/* Linked Assets Section */}
      <div class="variant-card__section">
        <h4 class="variant-card__section-title">
          Linked Assets ({props.variant.linkedAssets.length})
        </h4>

        <Show
          when={props.variant.linkedAssets.length > 0}
          fallback={<p class="variant-card__empty">No assets linked yet.</p>}
        >
          <ul class="variant-card__asset-list">
            <For each={props.variant.linkedAssets}>
              {(asset) => (
                <li class="variant-card__asset-item">
                  <span>{asset.title}</span>
                  <LoadingButton
                    variant="ghost"
                    size="xs"
                    onClick={() => handleUnlinkAsset(asset.id)}
                  >
                    Remove
                  </LoadingButton>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <form onSubmit={handleLinkAsset} class="variant-card__asset-form">
          <SelectField
            label=""
            name="assetId"
            value={selectedAssetId()}
            onChange={(e) => setSelectedAssetId(e.currentTarget.value)}
            options={[
              { value: "", label: "Select an asset to link..." },
              ...props.availableAssets.map((asset) => ({
                value: asset.id,
                label: asset.title,
              })),
            ]}
            disabled={isLinkLoading()}
          />
          <LoadingButton
            type="submit"
            variant="outline"
            size="sm"
            isLoading={isLinkLoading()}
            loadingText="Linking..."
          >
            Link Asset
          </LoadingButton>
        </form>
      </div>

      {/* Pricing Section */}
      <div class="variant-card__section">
        <h4 class="variant-card__section-title">
          Pricing ({props.variant.prices.length})
        </h4>

        <Show
          when={props.variant.prices.length > 0}
          fallback={<p class="variant-card__empty">No pricing set yet.</p>}
        >
          <div class="variant-card__price-list">
            <For each={props.variant.prices}>
              {(price) => (
                <div class="variant-card__price-item">
                  <div class="variant-card__price-amount">
                    {price.default_currency?.toUpperCase() || "USD"}
                  </div>
                  <div class="variant-card__price-details">
                    {/* Price details display - waiting for migration update */}
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={!showPriceForm()}>
          <button
            type="button"
            onClick={() => setShowPriceForm(true)}
            class="variant-card__toggle-button"
          >
            Add Price
          </button>
        </Show>

        <Show when={showPriceForm()}>
          <form onSubmit={handleCreatePrice} class="variant-card__price-form">
            <div class="variant-card__price-row">
              <FormField
                label="Price"
                name="unitAmount"
                type="number"
                value={priceAmount()}
                onInput={(e) => setPriceAmount(e.currentTarget.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                disabled={isPriceLoading()}
                helpText="Enter price in dollars (e.g., 9.99 for $9.99). Use 0 for free."
              />

              <SelectField
                label="Currency"
                name="currency"
                value={priceCurrency()}
                onChange={(e) => setPriceCurrency(e.currentTarget.value)}
                options={[
                  { value: "usd", label: "USD ($)" },
                  { value: "eur", label: "EUR (€)" },
                  { value: "gbp", label: "GBP (£)" },
                  { value: "cad", label: "CAD ($)" },
                  { value: "aud", label: "AUD ($)" },
                ]}
                disabled={isPriceLoading()}
              />
            </div>

            <div class="variant-card__price-row">
              <FormField
                label="Min Quantity"
                name="minQuantity"
                type="number"
                value={priceMinQty()}
                onInput={(e) => setPriceMinQty(e.currentTarget.value)}
                placeholder="1"
                min="1"
                disabled={isPriceLoading()}
                helpText="Minimum quantity for this price tier"
              />

              <FormField
                label="Max Quantity"
                name="maxQuantity"
                type="number"
                value={priceMaxQty()}
                onInput={(e) => setPriceMaxQty(e.currentTarget.value)}
                placeholder="Optional"
                min="1"
                disabled={isPriceLoading()}
                helpText="Leave empty for no max"
              />
            </div>

            <div class="variant-card__form-actions">
              <LoadingButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isPriceLoading()}
                loadingText="Creating..."
              >
                Add Price
              </LoadingButton>
              <button
                type="button"
                onClick={() => setShowPriceForm(false)}
                class="button button--ghost button--sm"
                disabled={isPriceLoading()}
              >
                Cancel
              </button>
            </div>
          </form>
        </Show>
      </div>

      {/* Edit/Delete Actions */}
      <div class="variant-card__actions">
        <Show when={!showEditForm()}>
          <button
            type="button"
            onClick={() => setShowEditForm(true)}
            class="variant-card__toggle-button"
          >
            Edit Variant
          </button>
        </Show>

        <Show when={showEditForm()}>
          <form onSubmit={handleEditVariant} class="variant-card__edit-form">
            <FormField
              label="Name"
              name="title"
              type="text"
              value={editTitle()}
              onInput={(e) => setEditTitle(e.currentTarget.value)}
              required
              disabled={isEditLoading()}
            />

            <TextAreaField
              label="Description"
              name="description"
              value={editDescription()}
              onInput={(e) => setEditDescription(e.currentTarget.value)}
              rows={3}
              disabled={isEditLoading()}
            />

            <div class="variant-card__form-actions">
              <LoadingButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isEditLoading()}
                loadingText="Updating..."
              >
                Update Variant
              </LoadingButton>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                class="button button--ghost button--sm"
                disabled={isEditLoading()}
              >
                Cancel
              </button>
            </div>
          </form>
        </Show>

        <LoadingButton
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Variant
        </LoadingButton>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog()}
        title="Delete Variant"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteVariant}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleteLoading()}
      />
    </div>
  );
}
