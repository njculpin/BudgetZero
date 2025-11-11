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
  initialSku: string;
}

export default function ProductVariantEditor(props: ProductVariantEditorProps) {
  const [title, setTitle] = createSignal(props.initialTitle);
  const [description, setDescription] = createSignal(props.initialDescription ?? "");
  const [sku, setSku] = createSignal(props.initialSku);
  const [isLoading, setIsLoading] = createSignal(false);
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
          sku: sku(),
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

  return (
    <div class="variant-editor">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <form onSubmit={handleSave} class="variant-editor__form">
        <div class="variant-editor__form-row">
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

          <FormField
            label="SKU"
            name="sku"
            type="text"
            value={sku()}
            onInput={(e) => setSku(e.currentTarget.value)}
            placeholder="e.g., GAME-001-DIGITAL"
            required
            disabled={isLoading()}
            helpText="Unique identifier for this variant"
          />
        </div>

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
        </div>
      </form>
    </div>
  );
}
