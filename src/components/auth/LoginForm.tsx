import { createSignal } from "solid-js";
import { LoadingButton } from "@/components/interactive";
import "./login-form.css";

export default function LoginForm() {
  const [email, setEmail] = createSignal<string>("");
  const [password, setPassword] = createSignal<string>("");
  const [error, setError] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email());
      formData.append("password", password());

      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to sign in. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful sign-in - redirect will happen from server
      window.location.href = "/products";
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div class="card auth-page__card">
      <div class="card-header">
        <h2 class="card-title">Sign in to Game Loopers</h2>
        <p class="card-description">
          Enter your email and password to access your account
        </p>
      </div>

      <div class="card-content">
        <form onSubmit={handleSubmit} class="auth-form">
          {error() && (
            <div class="auth-form__error" role="alert">
              {error()}
            </div>
          )}

          <div class="auth-form__field">
            <label for="email" class="auth-form__label">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              class="auth-form__input"
              value={email()}
              onInput={(e: InputEvent) =>
                setEmail((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="your@email.com"
              required
              disabled={isLoading()}
            />
          </div>

          <div class="auth-form__field">
            <label for="password" class="auth-form__label">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              class="auth-form__input"
              value={password()}
              onInput={(e: InputEvent) =>
                setPassword((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="••••••••"
              required
              disabled={isLoading()}
            />
          </div>

          <LoadingButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading()}
            loadingText="Signing in..."
          >
            Sign in
          </LoadingButton>
        </form>
      </div>

      <div class="card-footer">
        <p class="auth-page__footer-text">
          New here?{" "}
          <a href="/sign-up" class="auth-page__link">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
