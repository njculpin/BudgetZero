import { createSignal, Show } from "solid-js";
import {
  ErrorMessage,
  SuccessMessage,
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

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "draft": return "📝";
      case "private": return "🔒";
      case "public": return "🌐";
      case "archived": return "📦";
      default: return "📄";
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "draft": return "Draft";
      case "private": return "Private";
      case "public": return "Public";
      case "archived": return "Archived";
      default: return s;
    }
  };

  const getStatusDescription = (s: string) => {
    switch (s) {
      case "draft":
        return "Work in progress. Only you can see this product.";
      case "private":
        return "Unlisted. Only you and people with the link can view.";
      case "public":
        return "Live in marketplace. Anyone can discover and purchase.";
      case "archived":
        return "Hidden from marketplace. Not available for purchase.";
      default:
        return "";
    }
  };

  const getStatusActionDescription = (s: string) => {
    switch (s) {
      case "draft":
        return "Continue editing without publishing";
      case "private":
        return "Share with select collaborators via link";
      case "public":
        return "Make available for purchase in marketplace";
      case "archived":
        return "Hide from public view (preserve for reference)";
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

      {/* Current Status Banner */}
      <div class={`status-editor__banner status-editor__banner--${status()}`}>
        <div class="status-editor__banner-icon">{getStatusIcon(status())}</div>
        <div class="status-editor__banner-content">
          <div class="status-editor__banner-label">
            Current Status: <strong>{getStatusLabel(status())}</strong>
          </div>
          <div class="status-editor__banner-description">
            {getStatusDescription(status())}
          </div>
        </div>
      </div>

      {/* Status Options Grid */}
      <div class="status-editor__grid">
        {/* Draft */}
        <button
          type="button"
          onClick={() => handleStatusChange("draft")}
          disabled={status() === "draft" || isLoading()}
          class="status-editor__option"
          classList={{
            "status-editor__option--active": status() === "draft",
            "status-editor__option--disabled": status() === "draft" || isLoading(),
          }}
        >
          <div class="status-editor__option-icon">📝</div>
          <div class="status-editor__option-content">
            <div class="status-editor__option-title">Draft</div>
            <div class="status-editor__option-description">
              {getStatusActionDescription("draft")}
            </div>
          </div>
          <Show when={status() === "draft"}>
            <div class="status-editor__option-badge">Current</div>
          </Show>
        </button>

        {/* Private */}
        <button
          type="button"
          onClick={() => handleStatusChange("private")}
          disabled={status() === "private" || isLoading()}
          class="status-editor__option"
          classList={{
            "status-editor__option--active": status() === "private",
            "status-editor__option--disabled": status() === "private" || isLoading(),
          }}
        >
          <div class="status-editor__option-icon">🔒</div>
          <div class="status-editor__option-content">
            <div class="status-editor__option-title">Private</div>
            <div class="status-editor__option-description">
              {getStatusActionDescription("private")}
            </div>
          </div>
          <Show when={status() === "private"}>
            <div class="status-editor__option-badge">Current</div>
          </Show>
        </button>

        {/* Public */}
        <button
          type="button"
          onClick={() => handleStatusChange("public")}
          disabled={status() === "public" || isLoading()}
          class="status-editor__option status-editor__option--highlight"
          classList={{
            "status-editor__option--active": status() === "public",
            "status-editor__option--disabled": status() === "public" || isLoading(),
          }}
        >
          <div class="status-editor__option-icon">🌐</div>
          <div class="status-editor__option-content">
            <div class="status-editor__option-title">Public</div>
            <div class="status-editor__option-description">
              {getStatusActionDescription("public")}
            </div>
          </div>
          <Show when={status() === "public"}>
            <div class="status-editor__option-badge">Current</div>
          </Show>
        </button>

        {/* Archived */}
        <button
          type="button"
          onClick={() => handleStatusChange("archived")}
          disabled={status() === "archived" || isLoading()}
          class="status-editor__option"
          classList={{
            "status-editor__option--active": status() === "archived",
            "status-editor__option--disabled": status() === "archived" || isLoading(),
          }}
        >
          <div class="status-editor__option-icon">📦</div>
          <div class="status-editor__option-content">
            <div class="status-editor__option-title">Archived</div>
            <div class="status-editor__option-description">
              {getStatusActionDescription("archived")}
            </div>
          </div>
          <Show when={status() === "archived"}>
            <div class="status-editor__option-badge">Current</div>
          </Show>
        </button>
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
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                class="status-editor__modal-button status-editor__modal-button--cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatus("public")}
                class="status-editor__modal-button status-editor__modal-button--confirm"
                disabled={isLoading()}
              >
                {isLoading() ? "Publishing..." : "Publish Product"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
