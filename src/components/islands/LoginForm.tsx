import { createSignal } from "solid-js";
import "./LoginForm.css";

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
      window.location.href = "/dashboard";
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
            <label for="email" class="label">
              Email
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
              placeholder="your@email.com"
              required
              disabled={isLoading()}
            />
          </div>

          <div class="auth-form__field">
            <label for="password" class="label">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              class="input"
              value={password()}
              onInput={(e: InputEvent) =>
                setPassword((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="••••••••"
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
              {isLoading() ? "Signing in..." : "Sign in"}
            </span>
          </button>
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
