import { createSignal, createResource, For, Show, onMount } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import AssetSearchModal from "./AssetSearchModal";
import "@/components/interactive/base.css";
import "./variant-asset-picker.css";
import "@/components/assets/asset-status-editor.css"

export interface VariantAssetPickerProps {
  variantId: string;
  userId: string;
  variantTitle?: string;
}

interface Asset {
  id: string;
  title: string;
  handle: string;
  status: "draft" | "private" | "public" | "archived";
  cover_image_url?: string;
  description?: string;
}

export default function VariantAssetPicker(props: VariantAssetPickerProps) {
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [unlinkingAssetId, setUnlinkingAssetId] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "✏️ Draft";
      case "private": return "🔒 Private";
      case "public": return "🌐 Public";
      case "archived": return "📦 Archived";
      default: return status;
    }
  };

  // Fetch linked assets for this variant - only run on client after mount
  const [linkedAssets, { refetch: refetchLinkedAssets }] = createResource(
    () => mounted() && props.variantId,
    async (variantId) => {
      const response = await fetch(`/api/products/variants/${variantId}/assets`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.assets || [];
    }
  );

  // Calculate total royalty cost - only run on client after mount
  const [royaltyTotal, { refetch: refetchRoyaltyTotal }] = createResource(
    () => mounted() && props.variantId,
    async (variantId) => {
      const response = await fetch(`/api/products/variants/${variantId}/royalty-total`);
      if (!response.ok) return 0;
      const data = await response.json();
      return data.total || 0;
    }
  );

  const handleAssetSelect = async (assetId: string) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/link-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
          assetId: assetId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to link asset");
        return;
      }

      setSuccess("Asset linked successfully!");

      // Refetch data
      await refetchLinkedAssets();
      await refetchRoyaltyTotal();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleUnlinkAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to remove this asset from this variant?")) {
      return;
    }

    setUnlinkingAssetId(assetId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/unlink-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
          assetId: assetId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to unlink asset");
        setUnlinkingAssetId(null);
        return;
      }

      setSuccess("Asset removed successfully!");

      // Refetch data
      await refetchLinkedAssets();
      await refetchRoyaltyTotal();

      setUnlinkingAssetId(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
      setUnlinkingAssetId(null);
    }
  };

  return (
    <div class="asset-picker">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="asset-picker__header">
        <div class="asset-picker__title-group">
          <h5 class="asset-picker__title">Included Assets</h5>
          <span class="asset-picker__count">
            {linkedAssets.loading ? "..." : `${linkedAssets()?.length || 0} asset${linkedAssets()?.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Show when={!royaltyTotal.loading && royaltyTotal() !== undefined}>
          <div class="asset-picker__royalty-total">
            <span class="asset-picker__royalty-label">Total Royalties:</span>
            <span class="asset-picker__royalty-value">
              ${((royaltyTotal() || 0) / 100).toFixed(2)}
            </span>
          </div>
        </Show>
      </div>

      <Show
        when={!linkedAssets.loading && linkedAssets() && linkedAssets()!.length > 0}
        fallback={
          <div class="asset-picker__empty">
            <div class="asset-picker__empty-icon">📦</div>
            <p class="asset-picker__empty-text">
              No assets linked to this variant yet. Click "Add Asset" below to get started.
            </p>
          </div>
        }
      >
        <div class="asset-picker__list">
          <For each={linkedAssets()}>
            {(asset: Asset) => (
              <div class="asset-picker__item">
                <div class="asset-picker__item-image-container">
                  {asset.cover_image_url ? (
                    <img
                      src={asset.cover_image_url}
                      alt={asset.title}
                      class="asset-picker__item-image"
                    />
                  ) : (
                    <div class="asset-picker__item-image-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div class="asset-picker__item-info">
                  <h6 class="asset-picker__item-title">{asset.title}</h6>
                  <p class="asset-picker__item-handle">@{asset.handle}</p>
                  <span class={`status-badge status-badge--${asset.status}`}>
                    {getStatusLabel(asset.status)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnlinkAsset(asset.id)}
                  class="asset-picker__item-remove"
                  disabled={unlinkingAssetId() === asset.id}
                >
                  {unlinkingAssetId() === asset.id ? "Removing..." : "Remove"}
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        class="asset-picker__add-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Asset
      </button>

      <AssetSearchModal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        onAssetSelect={handleAssetSelect}
        variantTitle={props.variantTitle}
      />
    </div>
  );
}
