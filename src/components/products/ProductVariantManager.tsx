import { createSignal, For, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
  FormField,
  TextAreaField,
} from "@/components/interactive";
import "@/components/interactive/base.css";
import "./product-variant-manager.css";

export interface ProductVariantManagerProps {
  productId: string;
}

interface Variant {
  id: string;
  title: string;
  description: string | null;
  is_digital: boolean;
  prices: Array<{
    id: string;
    currency: string;
    unit_amount: number;
    min_quantity: number;
    max_quantity: number | null;
  }>;
}

export default function ProductVariantManager(props: ProductVariantManagerProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleAddVariant = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create variant");
        setIsLoading(false);
        return;
      }

      setSuccess("Variant created! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div class="variant-manager">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="variant-manager__actions">
        <LoadingButton
          type="button"
          onClick={handleAddVariant}
          isLoading={isLoading()}
          loadingText="Creating..."
          variant="primary"
          size="md"
        >
          Add Variant
        </LoadingButton>
        <p class="variant-manager__help">
          Create a new variant to offer different options or pricing for this product.
        </p>
      </div>
    </div>
  );
}
