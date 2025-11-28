import { createSignal, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./asset-status-editor.css";

export interface ProductStatusEditorProps {
  productId: string;
  currentStatus: "draft" | "published" | "archived";
  hasVariants: boolean;
}

export default function ProductStatusEditor(props: ProductStatusEditorProps) {
  const [status, setStatus] = createSignal(props.currentStatus);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const canPublish = () => props.hasVariants;

  const handleStatusChange = async (newStatus: "draft" | "published" | "archived") => {
    // Validate publish requirements
    if (newStatus === "published" && !canPublish()) {
      setError("Cannot publish product without at least one variant");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

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
      setSuccess("Status updated successfully!");
      setIsLoading(false);

      // Reload page after brief delay to update all status displays
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "draft":
        return "Draft";
      case "published":
        return "Published";
      case "archived":
        return "Archived";
      default:
        return s;
    }
  };

  const getStatusDescription = (s: string) => {
    switch (s) {
      case "draft":
        return "Only visible to you. Not available for purchase.";
      case "published":
        return "Visible in marketplace. Available for purchase by anyone.";
      case "archived":
        return "Hidden from marketplace. Not available for purchase.";
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

      <div class="status-editor__current">
        <h4 class="status-editor__label">Current Status</h4>
        <div class={`status-badge status-badge--${status()} status-badge--large`}>
          {getStatusLabel(status())}
        </div>
        <p class="status-editor__description">{getStatusDescription(status())}</p>
      </div>

      <div class="status-editor__actions">
        <h4 class="status-editor__label">Change Status</h4>

        <div class="status-editor__info">
          <p class="status-editor__info-text">
            💡 To publish, all linked assets must be <strong>Private</strong> (🔒) or <strong>Public</strong> (🌐).
            Draft or archived assets will prevent publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleStatusChange("draft")}
          disabled={status() === "draft" || isLoading()}
          class="status-editor__button"
          classList={{
            "status-editor__button--active": status() === "draft",
          }}
        >
          <div class="status-editor__button-content">
            <span class="status-badge status-badge--draft">Draft</span>
            <span class="status-editor__button-description">
              Work in progress (not for sale)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange("published")}
          disabled={status() === "published" || isLoading() || !canPublish()}
          class="status-editor__button"
          classList={{
            "status-editor__button--active": status() === "published",
          }}
          title={!canPublish() ? "Requires at least one variant" : ""}
        >
          <div class="status-editor__button-content">
            <span class="status-badge status-badge--published">Published</span>
            <span class="status-editor__button-description">
              {!canPublish() ? "⚠️ Requires variants" : "List for sale"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange("archived")}
          disabled={status() === "archived" || isLoading()}
          class="status-editor__button"
          classList={{
            "status-editor__button--active": status() === "archived",
          }}
        >
          <div class="status-editor__button-content">
            <span class="status-badge status-badge--archived">Archived</span>
            <span class="status-editor__button-description">
              Remove from sale
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
