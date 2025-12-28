import { createSignal } from "solid-js";
import { LoadingButton } from "@/components/interactive";
import "./register-form.css";

export default function RegisterForm() {
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

      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful sign-up - redirect to sign-in
      window.location.href = "/sign-in";
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div class="card auth-page__card">
      <div class="card-header">
        <h2 class="card-title">Create your account</h2>
        <p class="card-description">
          Join Game Loopers and start collaborating with creators
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
            loadingText="Creating account..."
          >
            Create account
          </LoadingButton>
        </form>
      </div>

      <div class="card-footer">
        <p class="auth-page__footer-text">
          Already have an account?{" "}
          <a href="/sign-in" class="auth-page__link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
