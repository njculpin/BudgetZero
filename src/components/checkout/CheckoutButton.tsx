import { createSignal } from "solid-js";
import { LoadingButton, ErrorMessage } from "@/components/interactive";
import "@/components/interactive/base.css";
import "./checkout-button.css";

interface CheckoutButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children?: string;
}

export default function CheckoutButton(props: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleCheckout = async (e: MouseEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Always use create-session endpoint
      // Mocking is handled server-side via USE_MOCK_STRIPE environment variable
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to start checkout");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Handle Stripe checkout response (or mock response)
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No checkout URL returned");
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div class="checkout-button">
      {error() && (
        <ErrorMessage
          message={error()}
          onDismiss={() => setError("")}
        />
      )}

      <LoadingButton
        type="button"
        variant={props.variant || "primary"}
        size={props.size || "lg"}
        isLoading={isLoading()}
        loadingText="Processing..."
        onClick={handleCheckout}
      >
        {props.children || "Proceed to Checkout"}
      </LoadingButton>
    </div>
  );
}
