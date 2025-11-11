import { createSignal, createResource, For, Show, onMount } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";
import "./variant-asset-picker.css";

export interface VariantAssetPickerProps {
  variantId: string;
  userId: string;
}

interface Asset {
  id: string;
  title: string;
  handle: string;
  cover_image_url?: string;
  description?: string;
}

export default function VariantAssetPicker(props: VariantAssetPickerProps) {
  const [isSelectingAsset, setIsSelectingAsset] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedAssetId, setSelectedAssetId] = createSignal<string | null>(null);
  const [isLinking, setIsLinking] = createSignal(false);
  const [unlinkingAssetId, setUnlinkingAssetId] = createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
  });

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

  // Fetch available assets for the user - only run on client after mount
  const [availableAssets] = createResource(
    () => mounted() && props.userId,
    async (userId) => {
      const response = await fetch(`/api/assets/available/${userId}`);
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

  const filteredAvailableAssets = () => {
    const assets = availableAssets() || [];
    const linked = linkedAssets() || [];
    const linkedIds = new Set(linked.map((a: Asset) => a.id));

    // Filter out already linked assets
    let filtered = assets.filter((a: Asset) => !linkedIds.has(a.id));

    // Apply search filter
    const query = searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter((a: Asset) =>
        a.title.toLowerCase().includes(query) ||
        a.handle.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const handleLinkAsset = async () => {
    const assetId = selectedAssetId();
    if (!assetId) return;

    setIsLinking(true);
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
        setIsLinking(false);
        return;
      }

      setSuccess("Asset linked successfully!");
      setSelectedAssetId(null);
      setSearchQuery("");
      setIsSelectingAsset(false);

      // Refetch data
      await refetchLinkedAssets();
      await refetchRoyaltyTotal();

      setIsLinking(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLinking(false);
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

      <Show
        when={isSelectingAsset()}
        fallback={
          <button
            type="button"
            onClick={() => setIsSelectingAsset(true)}
            class="asset-picker__add-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Asset
          </button>
        }
      >
        <div class="asset-picker__selector">
          <div class="asset-picker__selector-header">
            <h6 class="asset-picker__selector-title">Select an Asset</h6>
            <button
              type="button"
              onClick={() => {
                setIsSelectingAsset(false);
                setSelectedAssetId(null);
                setSearchQuery("");
              }}
              class="asset-picker__selector-close"
              aria-label="Close asset selector"
            >
              ×
            </button>
          </div>

          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="asset-picker__search"
          />

          <Show when={!availableAssets.loading}>
            <Show
              when={filteredAvailableAssets().length > 0}
              fallback={
                <div class="asset-picker__no-results">
                  <p>No available assets found</p>
                  {searchQuery() && <p class="asset-picker__no-results-hint">Try a different search term</p>}
                </div>
              }
            >
              <div class="asset-picker__options">
                <For each={filteredAvailableAssets()}>
                  {(asset: Asset) => (
                    <label class={`asset-picker__option ${selectedAssetId() === asset.id ? 'asset-picker__option--selected' : ''}`}>
                      <input
                        type="radio"
                        name="asset-selection"
                        value={asset.id}
                        checked={selectedAssetId() === asset.id}
                        onChange={() => setSelectedAssetId(asset.id)}
                        class="asset-picker__option-radio"
                      />
                      <div class="asset-picker__option-image-container">
                        {asset.cover_image_url ? (
                          <img
                            src={asset.cover_image_url}
                            alt={asset.title}
                            class="asset-picker__option-image"
                          />
                        ) : (
                          <div class="asset-picker__option-image-placeholder">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div class="asset-picker__option-info">
                        <h6 class="asset-picker__option-title">{asset.title}</h6>
                        <p class="asset-picker__option-handle">@{asset.handle}</p>
                      </div>
                      <div class="asset-picker__option-check">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    </label>
                  )}
                </For>
              </div>

              <div class="asset-picker__selector-actions">
                <LoadingButton
                  type="button"
                  onClick={handleLinkAsset}
                  isLoading={isLinking()}
                  loadingText="Linking..."
                  variant="primary"
                  size="sm"
                  disabled={!selectedAssetId()}
                >
                  Link Selected Asset
                </LoadingButton>
                <button
                  type="button"
                  onClick={() => {
                    setIsSelectingAsset(false);
                    setSelectedAssetId(null);
                    setSearchQuery("");
                  }}
                  class="asset-picker__selector-cancel"
                >
                  Cancel
                </button>
              </div>
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  );
}
