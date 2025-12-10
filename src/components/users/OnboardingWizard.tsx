import { createSignal, Show, For } from "solid-js";
import "./onboarding-wizard.css";

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
  cta?: {
    label: string;
    action: () => void;
  };
}

interface Props {
  userType: "creator" | "consumer";
}

export default function OnboardingWizard(props: Props) {
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isVisible, setIsVisible] = createSignal(true);

  const creatorSteps: OnboardingStep[] = [
    {
      title: "Welcome to Game Loopers! 🎮",
      description:
        "You're joining a community of tabletop game creators who collaborate, publish products, and earn together.",
      icon: "👋",
    },
    {
      title: "Create Documents",
      description:
        "Start with collaborative documents to write rulebooks, design content, and build your game materials with your team.",
      icon: "📝",
      cta: {
        label: "Create Your First Document",
        action: () => {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "/api/documents/create-document";
          document.body.appendChild(form);
          form.submit();
        },
      },
    },
    {
      title: "Build Products",
      description:
        "Package your content into complete game products with variants and pricing. Sell digital downloads directly to customers.",
      icon: "📦",
      cta: {
        label: "Create Your First Product",
        action: () => {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "/api/products/create-product";
          document.body.appendChild(form);
          form.submit();
        },
      },
    },
    {
      title: "Pro Tips for Success",
      description:
        "Add high-quality images, write clear descriptions, use relevant tags, and engage with the community through game jams!",
      icon: "💡",
    },
  ];

  const consumerSteps: OnboardingStep[] = [
    {
      title: "Welcome to Game Loopers! 🎮",
      description:
        "Discover amazing tabletop games created by a passionate community. Your purchases directly support creators.",
      icon: "👋",
    },
    {
      title: "Browse the Marketplace",
      description:
        "Explore complete game products, individual assets, and jam entries. Use tags and search to find exactly what you need.",
      icon: "🔍",
      cta: {
        label: "Browse Products",
        action: () => {
          window.location.href = "/products";
        },
      },
    },
    {
      title: "Support Creators",
      description:
        "When you purchase, you see exactly who gets paid. Transparent royalty splits ensure fair compensation for all contributors.",
      icon: "💰",
    },
    {
      title: "Join Game Jams",
      description:
        "Participate in community jams, leave reviews, and help discover the next great tabletop game!",
      icon: "🎉",
      cta: {
        label: "View Active Jams",
        action: () => {
          window.location.href = "/jams";
        },
      },
    },
  ];

  const steps = () => (props.userType === "creator" ? creatorSteps : consumerSteps);

  const handleNext = () => {
    if (currentStep() < steps().length - 1) {
      setCurrentStep(currentStep() + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep() > 0) {
      setCurrentStep(currentStep() - 1);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage
    localStorage.setItem("onboarding-dismissed", "true");
  };

  const handleFinish = () => {
    setIsVisible(false);
    localStorage.setItem("onboarding-completed", "true");
  };

  return (
    <Show when={isVisible()}>
      <div class="onboarding">
        <div class="onboarding__overlay" onClick={handleDismiss}></div>
        <div class="onboarding__modal">
          <button
            type="button"
            class="onboarding__close"
            onClick={handleDismiss}
            aria-label="Close onboarding"
          >
            ×
          </button>

          <div class="onboarding__content">
            <div class="onboarding__icon">{steps()[currentStep()].icon}</div>
            <h2 class="onboarding__title">{steps()[currentStep()].title}</h2>
            <p class="onboarding__description">
              {steps()[currentStep()].description}
            </p>
          </div>

          <div class="onboarding__progress">
            <For each={steps()}>
              {(_, index) => (
                <div
                  class={`onboarding__progress-dot ${
                    index() === currentStep()
                      ? "onboarding__progress-dot--active"
                      : index() < currentStep()
                      ? "onboarding__progress-dot--completed"
                      : ""
                  }`}
                  onClick={() => setCurrentStep(index())}
                />
              )}
            </For>
          </div>

          <div class="onboarding__actions">
            {currentStep() > 0 && (
              <button
                type="button"
                class="onboarding__btn onboarding__btn--secondary"
                onClick={handlePrevious}
              >
                ← Previous
              </button>
            )}

            {steps()[currentStep()].cta && (
              <button
                type="button"
                class="onboarding__btn onboarding__btn--primary"
                onClick={steps()[currentStep()].cta!.action}
              >
                {steps()[currentStep()].cta!.label}
              </button>
            )}

            {currentStep() < steps().length - 1 ? (
              <button
                type="button"
                class="onboarding__btn onboarding__btn--primary"
                onClick={handleNext}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                class="onboarding__btn onboarding__btn--primary"
                onClick={handleFinish}
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </Show>
  );
}
