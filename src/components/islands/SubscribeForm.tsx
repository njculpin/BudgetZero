import { createSignal } from "solid-js";
import "./subscribe-form.css";

export default function SubscribeForm() {
  const [email, setEmail] = createSignal<string>("");
  const [error, setError] = createSignal<string>("");
  const [success, setSuccess] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email());

      const response = await fetch("/api/subscribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to subscribe. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success
      setSuccess("Thanks for subscribing! Check your email to confirm.");
      setEmail("");
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div class="subscribe-card">
      <div class="subscribe-section">
        <h2>Stay Current</h2>
        <p>
          Subscribe to our newsletter to get up to date information on the
          development and progress of Game Loopers. Be the first to know about
          upcoming changes and features. We promise not to spam.
        </p>
      </div>

      <div class="subscribe-section">
        <form onSubmit={handleSubmit} class="subscribe-form">
          {error() && (
            <div class="subscribe-form__error" role="alert">
              {error()}
            </div>
          )}

          {success() && (
            <div class="subscribe-form__success" role="status">
              {success()}
            </div>
          )}

          <div class="subscribe-form__field">
            <label for="email" class="label">
              Email address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              class="input"
              value={email()}
              onInput={(e: InputEvent) =>
                setEmail((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="you@example.com"
              required
              disabled={isLoading()}
            />
          </div>

          <button
            type="submit"
            class="button button--primary button--md"
            disabled={isLoading()}
          >
            <span class="button__text">
              {isLoading() ? "Subscribing..." : "Sign Up"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
