import { createSignal, Show, For } from "solid-js";
import {
  ErrorMessage,
  SuccessMessage,
  LoadingButton,
} from "@/components/interactive";
import "./product-status-editor.css";

export interface ProductStatusEditorProps {
  productId: string;
  currentStatus: "draft" | "private" | "public" | "archived";
}

type StatusOption = {
  value: "draft" | "private" | "public" | "archived";
  label: string;
  icon: string;
  description: string;
  color: "muted" | "info" | "success" | "warning";
};

const statusOptions: StatusOption[] = [
  {
    value: "draft",
    label: "Draft",
    icon: "📝",
    description: "Continue editing without publishing",
    color: "muted",
  },
  {
    value: "private",
    label: "Private",
    icon: "🔒",
    description: "Share with select collaborators via link",
    color: "info",
  },
  {
    value: "public",
    label: "Public",
    icon: "🌐",
    description: "Available for purchase in marketplace",
    color: "success",
  },
  {
    value: "archived",
    label: "Archived",
    icon: "📦",
    description: "Hidden from public view",
    color: "warning",
  },
];

export default function ProductStatusEditor(props: ProductStatusEditorProps) {
  const [status, setStatus] = createSignal(props.currentStatus);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [showPublishConfirm, setShowPublishConfirm] = createSignal(false);

  const handleStatusChange = async (newStatus: "draft" | "private" | "public" | "archived") => {
    // Show confirmation dialog for publishing
    if (newStatus === "public" && status() !== "public") {
      setShowPublishConfirm(true);
      return;
    }

    await updateStatus(newStatus);
  };

  const updateStatus = async (newStatus: "draft" | "private" | "public" | "archived") => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    setShowPublishConfirm(false);

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("status", newStatus);

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update status");
        setIsLoading(false);
        return;
      }

      setStatus(newStatus);
      setSuccess(`Product status changed to ${newStatus}!`);
      setIsLoading(false);

      // Reload page after brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div class="status-editor">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      {/* Status Options Grid */}
      <div class="status-editor__grid">
        <For each={statusOptions}>
          {(option) => (
            <button
              type="button"
              class={`status-editor__option status-editor__option--${option.color} ${
                status() === option.value ? "status-editor__option--active" : ""
              }`}
              onClick={() => handleStatusChange(option.value)}
              disabled={isLoading()}
            >
              <div class="status-editor__option-header">
                <span class="status-editor__option-icon">{option.icon}</span>
                <span class="status-editor__option-label">{option.label}</span>
                {status() === option.value && (
                  <span class="status-editor__option-badge">Current</span>
                )}
              </div>
              <p class="status-editor__option-description">{option.description}</p>
            </button>
          )}
        </For>
      </div>

      {/* Publish Confirmation Dialog */}
      <Show when={showPublishConfirm()}>
        <div class="status-editor__modal-overlay" onClick={() => setShowPublishConfirm(false)}>
          <div class="status-editor__modal" onClick={(e) => e.stopPropagation()}>
            <div class="status-editor__modal-icon">🌐</div>
            <h3 class="status-editor__modal-title">Publish Product?</h3>
            <p class="status-editor__modal-description">
              Your product will be visible in the marketplace and available for purchase by anyone.
              Make sure you've completed all requirements before publishing.
            </p>
            <div class="status-editor__modal-actions">
              <LoadingButton
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowPublishConfirm(false)}
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                type="button"
                variant="primary"
                size="md"
                onClick={() => updateStatus("public")}
                isLoading={isLoading()}
                loadingText="Publishing..."
              >
                Publish Product
              </LoadingButton>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
