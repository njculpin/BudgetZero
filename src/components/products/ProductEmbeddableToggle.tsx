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
  embeddingRoyaltyCents: number | undefined | null;
}

export default function ProductEmbeddableToggle(props: ProductEmbeddableToggleProps) {
  const [isEmbeddable, setIsEmbeddable] = createSignal(props.isEmbeddable);
  const [royaltyCents, setRoyaltyCents] = createSignal(props.embeddingRoyaltyCents || 0);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const isPublic = () => props.productStatus === 'public';

  const royaltyDollars = () => (royaltyCents() / 100).toFixed(2);

  const handleRoyaltyChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const dollars = parseFloat(input.value) || 0;
    setRoyaltyCents(Math.round(dollars * 100));
  };

  const handleToggle = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    const newValue = !isEmbeddable();

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("isEmbeddable", newValue.toString());
      formData.append("embeddingRoyaltyCents", royaltyCents().toString());

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

  const handleSaveRoyalty = async () => {
    if (!isEmbeddable()) {
      setError("Enable embedding first to set royalty rate");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("embeddingRoyaltyCents", royaltyCents().toString());

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update royalty rate");
        setIsLoading(false);
        return;
      }

      setSuccess("Royalty rate updated successfully!");
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

      <Show when={isEmbeddable()}>
        <div class="embeddable-toggle__royalty">
          <div class="embeddable-toggle__royalty-info">
            <h4 class="embeddable-toggle__royalty-label">Embedding Royalty Rate</h4>
            <p class="embeddable-toggle__royalty-description">
              Set how much you earn when this product is embedded in another product. This amount is added to the buyer's total when someone purchases a product that includes yours.
            </p>
          </div>

          <div class="embeddable-toggle__royalty-input">
            <label for="royalty-input" class="embeddable-toggle__royalty-input-label">
              Royalty per sale
            </label>
            <div class="embeddable-toggle__royalty-input-wrapper">
              <span class="embeddable-toggle__royalty-input-prefix">$</span>
              <input
                id="royalty-input"
                type="number"
                min="0"
                step="0.01"
                value={royaltyDollars()}
                onInput={handleRoyaltyChange}
                class="embeddable-toggle__royalty-input-field"
                placeholder="0.00"
                disabled={isLoading()}
              />
              <LoadingButton
                onClick={handleSaveRoyalty}
                isLoading={isLoading()}
                variant="primary"
                size="md"
              >
                Save Rate
              </LoadingButton>
            </div>
            <p class="embeddable-toggle__royalty-input-hint">
              You'll earn ${royaltyDollars()} each time someone purchases a product containing this one
            </p>
          </div>
        </div>
      </Show>
    </div>
  );
}
