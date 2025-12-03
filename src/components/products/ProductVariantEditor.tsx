import { createSignal, Show } from "solid-js";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import {
  ErrorMessage,
  FormField,
  TextAreaField,
} from "@/components/interactive";
import "@/components/interactive/base.css";
import "@/styles/save-status.css";
import "./product-variant-editor.css";

export interface ProductVariantEditorProps {
  variantId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialSku: string;
}

export default function ProductVariantEditor(props: ProductVariantEditorProps) {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [description, setDescription] = createSignal(props.initialDescription ?? "");
  const [sku, setSku] = createSignal(props.initialSku);
  const [error, setError] = createSignal("");

  // Auto-save handler
  const saveData = async () => {
    setError("");

    const response = await fetch("/api/products/variants/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: props.variantId,
        title: title(),
        description: description() || null,
        sku: sku(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error || "Failed to update variant";
      setError(errorMessage);

      // Throw error with status for retry logic
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = response.status;
      throw error;
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

  const handleSkuInput = (e: Event) => {
    setSku((e.currentTarget as HTMLInputElement).value);
    autoSave.triggerSave();
  };

  const handleDescriptionInput = (e: Event) => {
    setDescription((e.currentTarget as HTMLTextAreaElement).value);
    autoSave.triggerSave();
  };

  return (
    <div class="variant-editor">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      {/* Save Status Indicator */}
      <div class="variant-editor__save-status">
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

      <div class="variant-editor__form">
        <div class="variant-editor__form-row">
          <FormField
            label="Variant Title"
            name="title"
            type="text"
            value={title()}
            onInput={handleTitleInput}
            placeholder="e.g., Digital Download, Physical Edition"
            required
            disabled={false}
          />

          <FormField
            label="SKU"
            name="sku"
            type="text"
            value={sku()}
            onInput={handleSkuInput}
            placeholder="e.g., GAME-001-DIGITAL"
            required
            disabled={false}
            helpText="Unique identifier for this variant"
          />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          value={description()}
          onInput={handleDescriptionInput}
          placeholder="Describe what's included in this variant..."
          rows={3}
          disabled={false}
        />
      </div>
    </div>
  );
}
