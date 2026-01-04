import { createSignal, createEffect, Show, For } from "solid-js";
import { LoadingButton, ErrorMessage } from "@/components/interactive";
import type { ShippingAddress } from "@/types";
import "@/components/interactive/base.css";
import "./credits-checkout.css";

interface CreditsCheckoutProps {
  userCredits: number;
  totalCents: number;
  hasServiceProducts: boolean;
}

export default function CreditsCheckoutComponent(props: CreditsCheckoutProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [showShippingForm, setShowShippingForm] = createSignal(false);

  // Shipping address form fields
  const [name, setName] = createSignal("");
  const [address1, setAddress1] = createSignal("");
  const [address2, setAddress2] = createSignal("");
  const [city, setCity] = createSignal("");
  const [state, setState] = createSignal("");
  const [postalCode, setPostalCode] = createSignal("");
  const [country, setCountry] = createSignal("United States");
  const [orderNotes, setOrderNotes] = createSignal("");

  // Calculate if user has enough credits
  const hasEnoughCredits = () => props.userCredits >= props.totalCents;
  const creditsShortfall = () => props.totalCents - props.userCredits;

  const handleCreditsCheckout = async (e: Event) => {
    e.preventDefault();
    setError("");

    // If service products exist and shipping form not shown, show it first
    if (props.hasServiceProducts && !showShippingForm()) {
      setShowShippingForm(true);
      return;
    }

    // Validate shipping address if required
    if (props.hasServiceProducts) {
      if (!name() || !address1() || !city() || !state() || !postalCode()) {
        setError("Please fill in all required shipping fields");
        return;
      }
    }

    setIsLoading(true);

    try {
      const shippingAddress: ShippingAddress | null = props.hasServiceProducts ? {
        name: name(),
        address1: address1(),
        address2: address2() || undefined,
        city: city(),
        state: state(),
        postal_code: postalCode(),
        country: country(),
      } : null;

      const response = await fetch("/api/checkout/credits-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipping_address: shippingAddress,
          order_notes: orderNotes() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to process credits checkout");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Redirect to success page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div class="credits-checkout">
      <div class="credits-checkout__balance">
        <div class="credits-checkout__balance-label">Your Credits Balance:</div>
        <div class="credits-checkout__balance-value">
          {props.userCredits.toLocaleString()} credits
          <span class="credits-checkout__balance-usd">
            (${(props.userCredits / 100).toFixed(2)})
          </span>
        </div>
      </div>

      <div class="credits-checkout__cost">
        <div class="credits-checkout__cost-label">Order Total:</div>
        <div class="credits-checkout__cost-value">
          {props.totalCents.toLocaleString()} credits
          <span class="credits-checkout__cost-usd">
            (${(props.totalCents / 100).toFixed(2)})
          </span>
        </div>
      </div>

      <Show when={!hasEnoughCredits()}>
        <div class="credits-checkout__insufficient">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>
            Insufficient credits. You need {creditsShortfall().toLocaleString()} more credits
            (${(creditsShortfall() / 100).toFixed(2)}).
          </span>
        </div>
      </Show>

      <Show when={props.hasServiceProducts}>
        <div class="credits-checkout__service-notice">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>Your cart contains service products. Shipping address required.</span>
        </div>
      </Show>

      <Show when={showShippingForm()}>
        <form class="shipping-form" onSubmit={handleCreditsCheckout}>
          <h3 class="shipping-form__title">Shipping Address</h3>

          <div class="shipping-form__field">
            <label class="shipping-form__label" for="shipping-name">
              Full Name <span class="shipping-form__required">*</span>
            </label>
            <input
              id="shipping-name"
              type="text"
              class="shipping-form__input"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              required
            />
          </div>

          <div class="shipping-form__field">
            <label class="shipping-form__label" for="shipping-address1">
              Address Line 1 <span class="shipping-form__required">*</span>
            </label>
            <input
              id="shipping-address1"
              type="text"
              class="shipping-form__input"
              value={address1()}
              onInput={(e) => setAddress1(e.currentTarget.value)}
              required
            />
          </div>

          <div class="shipping-form__field">
            <label class="shipping-form__label" for="shipping-address2">
              Address Line 2
            </label>
            <input
              id="shipping-address2"
              type="text"
              class="shipping-form__input"
              value={address2()}
              onInput={(e) => setAddress2(e.currentTarget.value)}
            />
          </div>

          <div class="shipping-form__row">
            <div class="shipping-form__field">
              <label class="shipping-form__label" for="shipping-city">
                City <span class="shipping-form__required">*</span>
              </label>
              <input
                id="shipping-city"
                type="text"
                class="shipping-form__input"
                value={city()}
                onInput={(e) => setCity(e.currentTarget.value)}
                required
              />
            </div>

            <div class="shipping-form__field">
              <label class="shipping-form__label" for="shipping-state">
                State/Province <span class="shipping-form__required">*</span>
              </label>
              <input
                id="shipping-state"
                type="text"
                class="shipping-form__input"
                value={state()}
                onInput={(e) => setState(e.currentTarget.value)}
                required
              />
            </div>
          </div>

          <div class="shipping-form__row">
            <div class="shipping-form__field">
              <label class="shipping-form__label" for="shipping-postal">
                Postal Code <span class="shipping-form__required">*</span>
              </label>
              <input
                id="shipping-postal"
                type="text"
                class="shipping-form__input"
                value={postalCode()}
                onInput={(e) => setPostalCode(e.currentTarget.value)}
                required
              />
            </div>

            <div class="shipping-form__field">
              <label class="shipping-form__label" for="shipping-country">
                Country <span class="shipping-form__required">*</span>
              </label>
              <select
                id="shipping-country"
                class="shipping-form__select"
                value={country()}
                onChange={(e) => setCountry(e.currentTarget.value)}
                required
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
              </select>
            </div>
          </div>

          <div class="shipping-form__field">
            <label class="shipping-form__label" for="order-notes">
              Order Notes (Optional)
            </label>
            <textarea
              id="order-notes"
              class="shipping-form__textarea"
              placeholder="Add special instructions for the service provider (e.g., color preferences, materials, etc.)"
              value={orderNotes()}
              onInput={(e) => setOrderNotes(e.currentTarget.value)}
              rows={3}
            />
          </div>
        </form>
      </Show>

      <Show when={error()}>
        <ErrorMessage
          message={error()}
          onDismiss={() => setError("")}
        />
      </Show>

      <LoadingButton
        type="button"
        variant="primary"
        size="lg"
        isLoading={isLoading()}
        loadingText="Processing..."
        onClick={handleCreditsCheckout}
        disabled={!hasEnoughCredits()}
      >
        {showShippingForm()
          ? "Complete Order"
          : props.hasServiceProducts
            ? "Continue to Shipping"
            : "Pay with Credits"
        }
      </LoadingButton>

      <div class="credits-checkout__notice">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="8"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Credits are for testing only. Real payments use Stripe.</span>
      </div>
    </div>
  );
}
