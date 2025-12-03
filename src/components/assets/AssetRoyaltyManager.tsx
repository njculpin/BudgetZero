import { createSignal, For, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
  FormField,
} from "@/components/interactive";
import "@/components/interactive/base.css";
import "./asset-royalty-manager.css";

export interface AssetRoyaltyManagerProps {
  assetId: string;
  existingRoyalties: Array<{
    id: string;
    user_id: string;
    user_name?: string;
    user_handle?: string;
    royalty_value: number;
  }>;
  totalRoyalty: number;
}

export default function AssetRoyaltyManager(props: AssetRoyaltyManagerProps) {
  const [editingRoyaltyId, setEditingRoyaltyId] = createSignal<string | null>(null);
  const [editValue, setEditValue] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [deletingRoyaltyId, setDeletingRoyaltyId] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleEdit = (royaltyId: string, currentValue: number) => {
    setEditingRoyaltyId(royaltyId);
    setEditValue((currentValue / 100).toFixed(2));
  };

  const handleSave = async (royaltyId: string) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const royaltyValue = Math.round(parseFloat(editValue()) * 100);

      const response = await fetch("/api/assets/royalties/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          royaltyId: royaltyId,
          royaltyValue: royaltyValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update royalty");
        setIsLoading(false);
        return;
      }

      setSuccess("Royalty updated! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingRoyaltyId(null);
    setEditValue("");
  };

  const handleDelete = async (royaltyId: string) => {
    if (!confirm("Are you sure you want to delete this royalty split?")) {
      return;
    }

    setDeletingRoyaltyId(royaltyId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/assets/royalties/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ royaltyId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete royalty");
        setDeletingRoyaltyId(null);
        return;
      }

      setSuccess("Royalty deleted! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setDeletingRoyaltyId(null);
    }
  };

  return (
    <div class="royalty-manager">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="royalty-manager__header">
        <div class="royalty-manager__total">
          <span class="royalty-manager__total-label">Total Cost per Use:</span>
          <span class="royalty-manager__total-value">
            ${(props.totalRoyalty / 100).toFixed(2)}
          </span>
        </div>
      </div>

      <Show when={props.existingRoyalties.length > 0}>
        <div class="royalty-manager__list">
          <For each={props.existingRoyalties}>
            {(royalty) => (
              <div class="royalty-item">
                <div class="royalty-item__info">
                  <span class="royalty-item__name">
                    {royalty.user_name || royalty.user_handle || "Unknown"}
                  </span>
                  <span class="royalty-item__handle">
                    @{royalty.user_handle}
                  </span>
                </div>

                <Show
                  when={editingRoyaltyId() === royalty.id}
                  fallback={
                    <div class="royalty-item__actions">
                      <span class="royalty-item__amount">
                        ${(royalty.royalty_value / 100).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(royalty.id, royalty.royalty_value)}
                        class="royalty-item__edit"
                        disabled={isLoading() || deletingRoyaltyId() === royalty.id}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(royalty.id)}
                        class="royalty-item__delete"
                        disabled={isLoading() || deletingRoyaltyId() === royalty.id}
                      >
                        {deletingRoyaltyId() === royalty.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  }
                >
                  <div class="royalty-item__edit-form">
                    <FormField
                      label=""
                      name="royalty-value"
                      type="number"
                      value={editValue()}
                      onInput={(e) => setEditValue(e.currentTarget.value)}
                      placeholder="0.00"
                      required
                      disabled={isLoading()}
                      step="0.01"
                      min="0"
                    />
                    <div class="royalty-item__edit-actions">
                      <LoadingButton
                        type="button"
                        onClick={() => handleSave(royalty.id)}
                        isLoading={isLoading()}
                        loadingText="Saving..."
                        variant="primary"
                        size="sm"
                      >
                        Save
                      </LoadingButton>
                      <button
                        type="button"
                        onClick={handleCancel}
                        class="royalty-item__edit-cancel"
                        disabled={isLoading()}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="royalty-manager__help">
        <p class="royalty-manager__help-text">
          Royalty splits determine how revenue is distributed when this asset is used in a product.
          The total cost shown above is what creators pay when including this asset.
        </p>
      </div>
    </div>
  );
}
