import { createSignal, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import "./product-embeddable-toggle.css";

export interface ProductEmbeddableToggleProps {
  productId: string;
  isEmbeddable: boolean;
  productStatus: string;
}

export default function ProductEmbeddableToggle(props: ProductEmbeddableToggleProps) {
  const [isEmbeddable, setIsEmbeddable] = createSignal(props.isEmbeddable);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const isPublic = () => props.productStatus === 'public';

  const handleToggle = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    const newValue = !isEmbeddable();

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("isEmbeddable", newValue.toString());

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update embeddable setting");
        setIsLoading(false);
        return;
      }

      setIsEmbeddable(newValue);
      setSuccess("Embeddable setting updated successfully!");
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

  return (
    <div class="embeddable-toggle">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="embeddable-toggle__content">
        <div class="embeddable-toggle__info">
          <h4 class="embeddable-toggle__label">Allow Embedding in Other Products</h4>
          <p class="embeddable-toggle__description">
            {isEmbeddable() ? (
              isPublic() ? (
                "This product can be embedded by anyone in their products. Creators who embed it will pay you royalties based on your configured rate."
              ) : (
                "This product is embeddable, but only visible to you (private status). Make it public to allow others to embed it and pay you royalties."
              )
            ) : (
              "This product cannot be embedded in other products. It can only be sold as a standalone item."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading()}
          class="embeddable-toggle__switch"
          classList={{
            "embeddable-toggle__switch--active": isEmbeddable(),
            "embeddable-toggle__switch--loading": isLoading(),
          }}
          aria-label={isEmbeddable() ? "Disable embedding" : "Enable embedding"}
        >
          <span class="embeddable-toggle__switch-track">
            <span class="embeddable-toggle__switch-thumb" />
          </span>
          <span class="embeddable-toggle__switch-label">
            {isEmbeddable() ? "Enabled" : "Disabled"}
          </span>
        </button>
      </div>
    </div>
  );
}
