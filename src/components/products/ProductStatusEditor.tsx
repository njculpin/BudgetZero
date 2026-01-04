import { createSignal, Show } from "solid-js";
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

  const getStatusDescription = (s: string) => {
    switch (s) {
      case "draft":
        return "Continue editing without publishing";
      case "private":
        return "Share with select collaborators via link";
      case "public":
        return "Available for purchase in marketplace";
      case "archived":
        return "Hidden from public view";
      default:
        return "";
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

      {/* Status Dropdown */}
      <div class="status-editor__field">
        <select
          class="status-editor__select"
          onChange={(e) =>
            handleStatusChange(
              e.currentTarget.value as "draft" | "private" | "public" | "archived"
            )
          }
          disabled={isLoading()}
        >
          <option value="draft" selected={status() === "draft"}>
            Draft
          </option>
          <option value="private" selected={status() === "private"}>
            Private
          </option>
          <option value="public" selected={status() === "public"}>
            Public
          </option>
          <option value="archived" selected={status() === "archived"}>
            Archived
          </option>
        </select>
        <p class="status-editor__description">{getStatusDescription(status())}</p>
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
