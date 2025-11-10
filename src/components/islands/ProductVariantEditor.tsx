import { createSignal, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
  FormField,
  TextAreaField,
} from "./base";
import "./base/base.css";
import "./product-variant-editor.css";

export interface ProductVariantEditorProps {
  variantId: string;
  initialTitle: string;
  initialDescription: string | null;
}

export default function ProductVariantEditor(props: ProductVariantEditorProps) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [title, setTitle] = createSignal(props.initialTitle);
  const [description, setDescription] = createSignal(props.initialDescription || "");
  const [isLoading, setIsLoading] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
          title: title(),
          description: description() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update variant");
        setIsLoading(false);
        return;
      }

      setSuccess("Variant updated! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this variant? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete variant");
        setIsDeleting(false);
        return;
      }

      setSuccess("Variant deleted! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setTitle(props.initialTitle);
    setDescription(props.initialDescription || "");
    setIsEditing(false);
    setError("");
  };

  return (
    <div class="variant-editor">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <Show
        when={isEditing()}
        fallback={
          <div class="variant-editor__view">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              class="variant-editor__edit-button"
              disabled={isDeleting()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Details
            </button>
            <button
              type="button"
              onClick={handleDelete}
              class="variant-editor__delete-button"
              disabled={isDeleting()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              {isDeleting() ? "Deleting..." : "Delete"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} class="variant-editor__form">
          <FormField
            label="Variant Title"
            name="title"
            type="text"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="e.g., Digital Download, Physical Edition"
            required
            disabled={isLoading()}
          />

          <TextAreaField
            label="Description"
            name="description"
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="Describe what's included in this variant..."
            rows={3}
            disabled={isLoading()}
          />

          <div class="variant-editor__actions">
            <LoadingButton
              type="submit"
              isLoading={isLoading()}
              loadingText="Saving..."
              variant="primary"
              size="sm"
            >
              Save Changes
            </LoadingButton>
            <button
              type="button"
              onClick={handleCancel}
              class="variant-editor__cancel"
              disabled={isLoading()}
            >
              Cancel
            </button>
          </div>
        </form>
      </Show>
    </div>
  );
}
