import { createSignal, createResource, For, Show, onMount } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import ProductComponentSearchModal from "./ProductComponentSearchModal";
import "@/components/interactive/base.css";
import "./variant-component-picker.css";

export interface VariantComponentPickerProps {
  variantId: string;
  userId: string;
  variantTitle?: string;
}

interface ProductComponent {
  id: string;
  title: string;
  handle: string;
  status: "draft" | "private" | "public" | "archived";
  royalty_amount_cents: number;
  file_count: number;
  description?: string;
}

export default function VariantComponentPicker(props: VariantComponentPickerProps) {
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [unlinkingComponentId, setUnlinkingComponentId] = createSignal<string | null>(null);
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

  // Fetch linked components for this variant - only run on client after mount
  const [linkedComponents, { refetch: refetchLinkedComponents }] = createResource(
    () => mounted() && props.variantId,
    async (variantId) => {
      const response = await fetch(`/api/products/variants/${variantId}/components`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.components || [];
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

  const handleProductSelect = async (productId: string, royaltyAmountCents: number) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/link-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
          productId: productId,
          royaltyAmountCents: royaltyAmountCents,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to link component");
        return;
      }

      setSuccess("Component linked successfully!");

      // Refetch data
      await refetchLinkedComponents();
      await refetchRoyaltyTotal();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleUnlinkComponent = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this component from this variant?")) {
      return;
    }

    setUnlinkingComponentId(productId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/unlink-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
          productId: productId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to unlink component");
        setUnlinkingComponentId(null);
        return;
      }

      setSuccess("Component removed successfully!");

      // Refetch data
      await refetchLinkedComponents();
      await refetchRoyaltyTotal();

      setUnlinkingComponentId(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
      setUnlinkingComponentId(null);
    }
  };

  return (
    <div class="component-picker">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="component-picker__header">
        <div class="component-picker__title-group">
          <h5 class="component-picker__title">Included Components</h5>
          <span class="component-picker__count">
            {linkedComponents.loading ? "..." : `${linkedComponents()?.length || 0} component${linkedComponents()?.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <Show when={!royaltyTotal.loading && royaltyTotal() !== undefined}>
          <div class="component-picker__royalty-total">
            <span class="component-picker__royalty-label">Total Royalties:</span>
            <span class="component-picker__royalty-value">
              ${((royaltyTotal() || 0) / 100).toFixed(2)}
            </span>
          </div>
        </Show>
      </div>

      <Show
        when={!linkedComponents.loading && linkedComponents() && linkedComponents()!.length > 0}
        fallback={
          <div class="component-picker__empty">
            <div class="component-picker__empty-icon">🧩</div>
            <p class="component-picker__empty-text">
              No components linked to this variant yet. Click "Add Component" below to get started.
            </p>
          </div>
        }
      >
        <div class="component-picker__list">
          <For each={linkedComponents()}>
            {(component: ProductComponent) => (
              <div class="component-picker__item">
                <a href={`/products/${component.handle}`} class="component-picker__item-link">
                  <div class="component-picker__item-image-container">
                    <div class="component-picker__item-image-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  </div>
                  <div class="component-picker__item-info">
                    <h6 class="component-picker__item-title">{component.title}</h6>
                    <p class="component-picker__item-handle">@{component.handle}</p>
                    <div class="component-picker__item-meta">
                      <span class={`status-badge status-badge--${component.status}`}>
                        {getStatusLabel(component.status)}
                      </span>
                      <span class="component-picker__item-royalty">
                        ${(component.royalty_amount_cents / 100).toFixed(2)} royalty
                      </span>
                      <Show when={component.file_count > 0}>
                        <span class="component-picker__item-files">
                          {component.file_count} {component.file_count === 1 ? 'file' : 'files'}
                        </span>
                      </Show>
                    </div>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={() => handleUnlinkComponent(component.id)}
                  class="component-picker__item-remove"
                  disabled={unlinkingComponentId() === component.id}
                >
                  {unlinkingComponentId() === component.id ? "Removing..." : "Remove"}
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        class="component-picker__add-button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Component
      </button>

      <ProductComponentSearchModal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        onProductSelect={handleProductSelect}
        variantTitle={props.variantTitle}
      />
    </div>
  );
}
