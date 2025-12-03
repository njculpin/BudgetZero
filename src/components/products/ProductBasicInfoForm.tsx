import { createSignal, createEffect, Show } from "solid-js";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import {
  FormField,
  TextAreaField,
  ErrorMessage,
} from "@/components/interactive";
import "@/components/interactive/base.css";
import "@/styles/save-status.css";

export interface ProductBasicInfoFormProps {
  productId: string;
  initialData: {
    title: string;
    description: string | null;
  };
}

export default function ProductBasicInfoForm(props: ProductBasicInfoFormProps) {
  const [title, setTitle] = createSignal(props.initialData.title);
  const [description, setDescription] = createSignal(props.initialData.description || "");
  const [error, setError] = createSignal("");

  // Update signals when initialData changes
  createEffect(() => {
    setTitle(props.initialData.title);
    setDescription(props.initialData.description || "");
  });

  // Auto-save handler
  const saveData = async () => {
    setError("");

    const formData = new FormData();
    formData.append("productId", props.productId);
    formData.append("title", title());
    formData.append("description", description());

    const response = await fetch("/api/products/update-product", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error || "Failed to save";
      setError(errorMessage);

      // Throw error with status for retry logic
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    const newHandle = data.product?.handle;
    const currentPath = window.location.pathname;
    const currentHandle = currentPath.split("/products/")[1]?.split("?")[0];

    // Update URL if handle changed (without page reload)
    if (newHandle && currentHandle && newHandle !== currentHandle) {
      const currentMode = new URLSearchParams(window.location.search).get("mode");
      const newUrl = currentMode
        ? `/products/${newHandle}?mode=${currentMode}`
        : `/products/${newHandle}`;

      // Use pushState for seamless URL update without reload
      window.history.pushState({}, '', newUrl);
    }
  };

  const autoSave = useAutoSave({
    debounceMs: 1000,
    onSave: saveData,
  });

  const handleTitleInput = (e: Event) => {
    setTitle((e.currentTarget as HTMLInputElement).value);
    autoSave.triggerSave();
  };

  const handleDescriptionInput = (e: Event) => {
    setDescription((e.currentTarget as HTMLTextAreaElement).value);
    autoSave.triggerSave();
  };

  return (
    <div class="product-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      {/* Save Status Indicator */}
      <div class="product-form__save-status">
        <Show when={autoSave.saveStatus() === "saving"}>
          <span
            class="save-status save-status--saving"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span class="save-status__spinner" aria-hidden="true"></span>
            Saving...
          </span>
        </Show>
        <Show when={autoSave.saveStatus() === "saved"}>
          <span
            class="save-status save-status--saved"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            ✓ Saved
          </span>
        </Show>
        <Show when={autoSave.saveStatus() === "error"}>
          <span
            class="save-status save-status--error"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            ✗ Save failed
          </span>
        </Show>
      </div>

      <FormField
        label="Title"
        name="title"
        type="text"
        value={title()}
        onInput={handleTitleInput}
        placeholder="Enter product title"
        required
        disabled={false}
        helpText="A descriptive title for your product. The URL handle will update based on this."
      />

      <TextAreaField
        label="Description"
        name="description"
        value={description()}
        onInput={handleDescriptionInput}
        placeholder="Describe your product - what it includes, how it can be used, etc."
        rows={6}
        disabled={false}
      />
    </div>
  );
}
