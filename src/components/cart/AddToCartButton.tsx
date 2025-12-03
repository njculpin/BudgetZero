import { createSignal } from "solid-js";
import { LoadingButton, ErrorMessage } from "@/components/interactive";
import "@/components/interactive/base.css";

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  quantity?: number;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children?: string;
}

export default function AddToCartButton(props: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleAddToCart = async (e: MouseEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: props.productId,
          variantId: props.variantId,
          quantity: props.quantity || 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add to cart");
        setIsLoading(false);
        return;
      }

      // Success - redirect to cart
      window.location.href = "/cart?added=true";
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div class="add-to-cart">
      {error() && (
        <ErrorMessage
          message={error()}
          onDismiss={() => setError("")}
        />
      )}

      <LoadingButton
        type="button"
        variant={props.variant || "primary"}
        size={props.size || "md"}
        isLoading={isLoading()}
        loadingText="Adding..."
        onClick={handleAddToCart}
      >
        {props.children || "Add to Cart"}
      </LoadingButton>
    </div>
  );
}
