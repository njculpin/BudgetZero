import { createSignal, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./asset-status-editor.css";

export interface AssetStatusEditorProps {
  assetId: string;
  currentStatus: "draft" | "private" | "public" | "archived";
  hasImages: boolean;
  hasFiles: boolean;
}

export default function AssetStatusEditor(props: AssetStatusEditorProps) {
  const [status, setStatus] = createSignal(props.currentStatus);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const canPublish = () => props.hasImages && props.hasFiles;

  const handleStatusChange = async (newStatus: "draft" | "private" | "public" | "archived") => {
    // Validate publish requirements for private and public statuses
    if ((newStatus === "private" || newStatus === "public") && !canPublish()) {
      setError("Cannot publish asset without at least one image and one file");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("assetId", props.assetId);
      formData.append("status", newStatus);

      const response = await fetch("/api/assets/update-asset", {
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
        return "✏️ Draft";
      case "private":
        return "🔒 Private";
      case "public":
        return "🌐 Public";
      case "archived":
        return "📦 Archived";
      default:
        return s;
    }
  };

  const getStatusDescription = (s: string) => {
    switch (s) {
      case "draft":
        return "Work in progress - only visible to you";
      case "private":
        return "Ready for your products - exclusive to you";
      case "public":
        return "Available in marketplace - anyone can use (you earn royalties)";
      case "archived":
        return "Hidden from all lists - can be recovered";
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
            <span class="status-badge status-badge--draft">✏️ Draft</span>
            <span class="status-editor__button-description">
              Work in progress
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange("private")}
          disabled={status() === "private" || isLoading() || !canPublish()}
          class="status-editor__button"
          classList={{
            "status-editor__button--active": status() === "private",
          }}
          title={!canPublish() ? "Requires at least one image and one file" : ""}
        >
          <div class="status-editor__button-content">
            <span class="status-badge status-badge--private">🔒 Private</span>
            <span class="status-editor__button-description">
              {!canPublish() ? "⚠️ Requires images & files" : "Exclusive to you"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange("public")}
          disabled={status() === "public" || isLoading() || !canPublish()}
          class="status-editor__button"
          classList={{
            "status-editor__button--active": status() === "public",
          }}
          title={!canPublish() ? "Requires at least one image and one file" : ""}
        >
          <div class="status-editor__button-content">
            <span class="status-badge status-badge--public">🌐 Public</span>
            <span class="status-editor__button-description">
              {!canPublish() ? "⚠️ Requires images & files" : "Available to all (earn royalties)"}
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
            <span class="status-badge status-badge--archived">📦 Archived</span>
            <span class="status-editor__button-description">
              Remove from lists
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
