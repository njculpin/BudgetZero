import { createSignal, Show } from "solid-js";
import {
  FormField,
  TextAreaField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import "@/components/interactive/base.css";

export interface VariantCreateFormProps {
  productId: string;
  onSuccess: () => void;
}

export default function VariantCreateForm(props: VariantCreateFormProps) {
  const [title, setTitle] = createSignal("");
  const [sku, setSku] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [isDigital, setIsDigital] = createSignal(true);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/products/variants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
          title: title(),
          sku: sku() || undefined,
          description: description() || undefined,
          isDigital: isDigital(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create variant");
        setIsLoading(false);
        return;
      }

      setSuccess("Variant created successfully!");
      setIsLoading(false);

      // Reset form
      setTitle("");
      setSku("");
      setDescription("");
      setIsDigital(true);

      // Trigger callback after short delay
      setTimeout(() => {
        if (props.onSuccess) {
          props.onSuccess();
        }
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="variant-create-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <FormField
        label="Variant Name"
        name="title"
        type="text"
        value={title()}
        onInput={(e) => setTitle(e.currentTarget.value)}
        placeholder="e.g., PDF Only, PDF + STL Files"
        required
        disabled={isLoading()}
      />

      <FormField
        label="SKU"
        name="sku"
        type="text"
        value={sku()}
        onInput={(e) => setSku(e.currentTarget.value)}
        placeholder="e.g., GAME-001-PDF (optional - will be auto-generated)"
        disabled={isLoading()}
        helpText="Leave empty to auto-generate from product handle and variant name"
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

      <div class="form-field">
        <label class="form-field__checkbox-label">
          <input
            type="checkbox"
            checked={isDigital()}
            onChange={(e) => setIsDigital(e.currentTarget.checked)}
            disabled={isLoading()}
          />
          <span>Digital Product</span>
        </label>
      </div>

      <div class="variant-create-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Creating..."
        >
          Create Variant
        </LoadingButton>
      </div>
    </form>
  );
}
