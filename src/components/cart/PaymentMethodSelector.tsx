import { createSignal } from "solid-js";
import "./payment-method-selector.css";

interface Props {
  userCredits: number;
  initialMethod?: "stripe" | "credits";
}

export default function PaymentMethodSelector(props: Props) {
  const [selectedMethod, setSelectedMethod] = createSignal<"stripe" | "credits">(
    props.initialMethod || "stripe"
  );

  const handleMethodChange = (method: "stripe" | "credits") => {
    setSelectedMethod(method);
    // Redirect to cart with appropriate query param
    if (method === "credits") {
      window.location.href = "/cart?use_credits=true";
    } else {
      window.location.href = "/cart";
    }
  };

  return (
    <div class="payment-method-selector">
      <h3 class="payment-method-selector__title">Payment Method</h3>

      <div class="payment-method-selector__options">
        {/* Stripe Payment Option */}
        <label
          class={`payment-method-selector__option ${
            selectedMethod() === "stripe"
              ? "payment-method-selector__option--selected"
              : ""
          }`}
        >
          <input
            type="radio"
            name="payment-method"
            value="stripe"
            checked={selectedMethod() === "stripe"}
            onChange={() => handleMethodChange("stripe")}
            class="payment-method-selector__radio"
          />
          <div class="payment-method-selector__option-content">
            <div class="payment-method-selector__option-header">
              <span class="payment-method-selector__option-title">
                💳 Card Payment
              </span>
              <div class="payment-method-selector__badges">
                <span class="payment-method-selector__badge">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-label="Secure"
                  >
                    <path d="M8 0L2 3v4.5c0 4 3 7.5 6 8.5 3-1 6-4.5 6-8.5V3L8 0zm0 2l4 2v3.5c0 2.5-1.5 4.7-4 5.8-2.5-1.1-4-3.3-4-5.8V4l4-2z" />
                    <path d="M6.5 8L5 6.5 6 5.5l1.5 1.5L11 3.5 12 4.5z" />
                  </svg>
                  SSL Secured
                </span>
                <svg
                  class="payment-method-selector__stripe-logo"
                  width="40"
                  height="16"
                  viewBox="0 0 60 25"
                  fill="currentColor"
                  aria-label="Stripe"
                >
                  <path d="M59.6 8.9c0-3.8-1.8-6.8-5.4-6.8-3.6 0-5.8 3-5.8 6.7 0 4.4 2.5 6.7 6.1 6.7 1.8 0 3.1-.4 4.2-1v-3.1c-1.1.6-2.3.9-3.8.9-1.5 0-2.9-.5-3.1-2.3h7.7c0-.2.1-.8.1-1.1zm-7.8-1c0-1.7 1-2.4 2.2-2.4s2.1.7 2.1 2.4h-4.3zm-8.5-5.6c-1.5 0-2.5.7-3.1 1.2l-.2-1h-3.4v16.2l3.9-.8v-3.9c.6.4 1.4 1 2.8 1 2.8 0 5.4-2.3 5.4-6.8 0-4.3-2.5-6.8-5.4-6.8zm-.9 10.5c-.9 0-1.5-.3-1.9-.8V6.8c.4-.5 1-.8 1.9-.8 1.4 0 2.4 1.6 2.4 3.9s-1 3.9-2.4 3.9zM29.9 2.5l3.9-.8V-.5l-3.9.8v2.2zm0 .8h3.9v12.1h-3.9V3.3zm-5.2 1l-.2-.8h-3.4v12.1h3.9V7.3c.9-1.2 2.5-1 3-.8v-3.7c-.5-.2-2.3-.5-3.3 1.2zm-6.4-3.3l-3.7.8v11.9c0 2.3 1.7 4 4 4 1.3 0 2.2-.2 2.7-.5V13c-.5.2-2.9.9-2.9-1.4V6.4h2.9V3.3h-2.9V.2z" />
                </svg>
              </div>
            </div>
            <p class="payment-method-selector__option-description">
              Secure payment with credit or debit card
            </p>
          </div>
        </label>

        {/* Credits Payment Option */}
        <label
          class={`payment-method-selector__option ${
            selectedMethod() === "credits"
              ? "payment-method-selector__option--selected"
              : ""
          }`}
        >
          <input
            type="radio"
            name="payment-method"
            value="credits"
            checked={selectedMethod() === "credits"}
            onChange={() => handleMethodChange("credits")}
            class="payment-method-selector__radio"
          />
          <div class="payment-method-selector__option-content">
            <div class="payment-method-selector__option-header">
              <span class="payment-method-selector__option-title">
                🪙 Account Credits
              </span>
              <span class="payment-method-selector__credits-balance">
                {props.userCredits.toLocaleString()} available
              </span>
            </div>
            <p class="payment-method-selector__option-description">
              Use your account balance for instant checkout
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
