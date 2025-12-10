import { createSignal, Show, onMount } from "solid-js";
import "./first-time-user-onboarding.css";

export default function FirstTimeUserOnboarding() {
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isVisible, setIsVisible] = createSignal(true);

  // Check localStorage AFTER mount to avoid hydration mismatch
  onMount(() => {
    const hasSeenOnboarding = localStorage.getItem("onboarding_seen") === "true";
    if (hasSeenOnboarding) {
      setIsVisible(false);
    }
  });

  // Handler functions - defined before steps array so they can be referenced
  const handleComplete = () => {
    console.log("handleComplete called");
    // Set localStorage flag so this doesn't show again
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_seen", "true");
      console.log("localStorage set:", localStorage.getItem("onboarding_seen"));
    }
    setIsVisible(false);
    console.log("isVisible set to false");
  };

  const handleSkip = () => {
    console.log("handleSkip called");
    handleComplete();
  };

  const handleNext = () => {
    console.log("handleNext called, current step:", currentStep());
    if (currentStep() < steps.length - 1) {
      setCurrentStep(currentStep() + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep() > 0) {
      setCurrentStep(currentStep() - 1);
    }
  };

  const steps = [
    {
      title: "Welcome to Game Loopers!",
      description: "A marketplace where tabletop game creators collaborate, publish, and earn together.",
      emoji: "🎉",
      content: (
        <div class="onboarding__intro">
          <p class="onboarding__intro-text">
            Whether you're a designer, artist, or 3D modeler, Game Loopers helps you monetize your work and collaborate with others.
          </p>
        </div>
      ),
      primaryAction: "Get Started",
      secondaryAction: "Skip Tutorial"
    },
    {
      title: "How It Works",
      description: "Create, collaborate, and earn through our transparent marketplace.",
      emoji: "💡",
      content: (
        <div class="onboarding__workflow">
          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">1</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Create Products</h4>
              <p class="onboarding__workflow-description">
                Build complete game packages with multiple variants and pricing options
              </p>
            </div>
          </div>

          <div class="onboarding__workflow-arrow">↓</div>

          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">2</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Collaborate with Documents</h4>
              <p class="onboarding__workflow-description">
                Use collaborative documents to create rulebooks and game content
              </p>
            </div>
          </div>

          <div class="onboarding__workflow-arrow">↓</div>

          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">3</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Publish & Sell</h4>
              <p class="onboarding__workflow-description">
                List your products on the marketplace for customers to discover
              </p>
            </div>
          </div>

          <div class="onboarding__workflow-arrow">↓</div>

          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">4</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Earn Revenue</h4>
              <p class="onboarding__workflow-description">
                Get paid for your work through our integrated payment system
              </p>
            </div>
          </div>
        </div>
      ),
      primaryAction: "Next",
      secondaryAction: "Skip Tutorial"
    },
    {
      title: "Ready to Start?",
      description: "Choose how you'd like to begin your journey.",
      emoji: "🚀",
      content: (
        <div class="onboarding__cta">
          <div class="onboarding__option">
            <h4 class="onboarding__option-title">Create a Product</h4>
            <p class="onboarding__option-description">
              Start building your first game product with variants and pricing
            </p>
            <a href="/api/products/create-product" class="onboarding__option-button onboarding__option-button--primary">
              Create Product
            </a>
          </div>

          <div class="onboarding__divider">
            <span class="onboarding__divider-text">or</span>
          </div>

          <div class="onboarding__option">
            <h4 class="onboarding__option-title">Start a Document</h4>
            <p class="onboarding__option-description">
              Begin writing your rulebook or game content collaboratively
            </p>
            <a href="/api/documents/create-document" class="onboarding__option-button onboarding__option-button--primary">
              Create Document
            </a>
          </div>

          <div class="onboarding__divider">
            <span class="onboarding__divider-text">or</span>
          </div>

          <div class="onboarding__option">
            <h4 class="onboarding__option-title">Explore on Your Own</h4>
            <p class="onboarding__option-description">
              Browse the dashboard and discover features at your own pace
            </p>
            <button
              class="onboarding__option-button onboarding__option-button--secondary"
              onClick={handleComplete}
            >
              Explore Dashboard
            </button>
          </div>
        </div>
      ),
      primaryAction: null,
      secondaryAction: null
    }
  ];

  const step = () => steps[currentStep()];

  return (
    <Show when={isVisible()}>
      <div class="onboarding">
        <div class="onboarding__backdrop" onClick={handleSkip}></div>

        <div class="onboarding__modal" role="dialog" aria-labelledby="onboarding-title" aria-modal="true">
          {/* Progress Indicator */}
          <div class="onboarding__progress">
            {steps.map((_, index) => (
              <div
                class={`onboarding__progress-dot ${index === currentStep() ? "onboarding__progress-dot--active" : ""} ${index < currentStep() ? "onboarding__progress-dot--completed" : ""}`}
                aria-label={`Step ${index + 1} of ${steps.length}`}
              ></div>
            ))}
          </div>

          {/* Close Button */}
          <button
            class="onboarding__close"
            onClick={handleSkip}
            aria-label="Close onboarding"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Content */}
          <div class="onboarding__content">
            <div class="onboarding__emoji">{step().emoji}</div>
            <h2 class="onboarding__title" id="onboarding-title">{step().title}</h2>
            <p class="onboarding__description">{step().description}</p>

            <div class="onboarding__body">
              {step().content}
            </div>
          </div>

          {/* Actions */}
          <Show when={step().primaryAction || step().secondaryAction}>
            <div class="onboarding__actions">
              <Show when={currentStep() > 0}>
                <button
                  class="onboarding__button onboarding__button--ghost"
                  onClick={handlePrevious}
                >
                  Back
                </button>
              </Show>

              <div class="onboarding__actions-right">
                <Show when={step().secondaryAction}>
                  <button
                    class="onboarding__button onboarding__button--ghost"
                    onClick={handleSkip}
                  >
                    {step().secondaryAction}
                  </button>
                </Show>

                <Show when={step().primaryAction}>
                  <button
                    class="onboarding__button onboarding__button--primary"
                    onClick={handleNext}
                  >
                    {step().primaryAction}
                  </button>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
