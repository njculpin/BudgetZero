import { createSignal, onMount } from "solid-js";
import { LoadingButton, ErrorMessage } from "@/components/interactive";
import "@/components/interactive/base.css";
import "./checkout-button.css";

interface CheckoutButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children?: string;
  useMockCheckout?: boolean;
}

export default function CheckoutButton(props: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [isMockMode, setIsMockMode] = createSignal(false);

  onMount(() => {
    // Check if mock_checkout parameter is present in URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mockCheckout = urlParams.get("mock_checkout") === "true" || props.useMockCheckout;
      setIsMockMode(mockCheckout);
    }
  });

  const handleCheckout = async (e: MouseEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Use mock checkout if enabled
      const endpoint = isMockMode()
        ? "/api/checkout/mock-checkout"
        : "/api/checkout/create-session";

      const response = await fetch(endpoint, {
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

      // Handle mock checkout response
      if (isMockMode() && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Handle Stripe checkout response
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
      {isMockMode() && (
        <div class="checkout-button__mock-notice">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Mock checkout mode - no payment required</span>
        </div>
      )}

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
        loadingText={isMockMode() ? "Processing mock checkout..." : "Processing..."}
        onClick={handleCheckout}
      >
        {isMockMode()
          ? "Complete Mock Checkout"
          : (props.children || "Proceed to Checkout")
        }
      </LoadingButton>
    </div>
  );
}
