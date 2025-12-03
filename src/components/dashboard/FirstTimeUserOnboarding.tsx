import { createSignal, Show } from "solid-js";
import "./first-time-user-onboarding.css";

export default function FirstTimeUserOnboarding() {
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isVisible, setIsVisible] = createSignal(true);

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
      description: "Create once, earn forever through our transparent royalty system.",
      emoji: "💡",
      content: (
        <div class="onboarding__workflow">
          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">1</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Create Assets</h4>
              <p class="onboarding__workflow-description">
                Upload your 3D models, rulebooks, art, or documents
              </p>
            </div>
          </div>

          <div class="onboarding__workflow-arrow">↓</div>

          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">2</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Set Royalties</h4>
              <p class="onboarding__workflow-description">
                Define how much you earn when others use your assets
              </p>
            </div>
          </div>

          <div class="onboarding__workflow-arrow">↓</div>

          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">3</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Bundle into Products</h4>
              <p class="onboarding__workflow-description">
                Combine assets into complete game packages
              </p>
            </div>
          </div>

          <div class="onboarding__workflow-arrow">↓</div>

          <div class="onboarding__workflow-step">
            <div class="onboarding__workflow-number">4</div>
            <div class="onboarding__workflow-content">
              <h4 class="onboarding__workflow-title">Publish & Earn</h4>
              <p class="onboarding__workflow-description">
                Sales automatically split among all contributors
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
      description: "Let's create your first asset together.",
      emoji: "🚀",
      content: (
        <div class="onboarding__cta">
          <div class="onboarding__option">
            <h4 class="onboarding__option-title">Quick Start Wizard</h4>
            <p class="onboarding__option-description">
              Follow a guided process to create and publish your first asset
            </p>
            <a href="/api/assets/create-asset" class="onboarding__option-button onboarding__option-button--primary">
              Create First Asset
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

  const handleComplete = () => {
    // Set localStorage flag so this doesn't show again
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_seen", "true");
    }
    setIsVisible(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
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
