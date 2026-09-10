import { createSignal, Show } from "solid-js";
import "./onboarding-modal.css";

type Persona = "creator" | "buyer" | "both" | null;

export default function OnboardingModal() {
  const [step, setStep] = createSignal<"persona" | "next-steps">("persona");
  const [selectedPersona, setSelectedPersona] = createSignal<Persona>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    setStep("next-steps");
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      // Mark onboarding as completed in the database
      const response = await fetch("/api/users/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Redirect based on persona
      const persona = selectedPersona();
      if (persona === "creator" || persona === "both") {
        window.location.href = "/products";
      } else {
        window.location.href = "/products";
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setIsSubmitting(false);
    }
  };

  const getNextSteps = () => {
    const persona = selectedPersona();

    if (persona === "creator") {
      return {
        title: "Get Started as a Creator",
        steps: [
          {
            icon: "📝",
            text: "Create your first product",
            action: "/products",
          },
          {
            icon: "🎨",
            text: "Complete your profile",
            action: "/settings",
          },
          {
            icon: "💰",
            text: "Connect Stripe for payouts",
            action: "/settings",
          },
        ],
      };
    } else if (persona === "buyer") {
      return {
        title: "Start Exploring",
        steps: [
          {
            icon: "🔍",
            text: "Browse the marketplace",
            action: "/products",
          },
          {
            icon: "🛒",
            text: "Add products to your cart",
            action: "/products",
          },
          {
            icon: "👤",
            text: "Complete your profile",
            action: "/settings",
          },
        ],
      };
    } else {
      // both
      return {
        title: "Your Creative Journey Begins",
        steps: [
          {
            icon: "📝",
            text: "Create your first product",
            action: "/products",
          },
          {
            icon: "🔍",
            text: "Browse the marketplace",
            action: "/products",
          },
          {
            icon: "💰",
            text: "Connect Stripe for payouts",
            action: "/settings",
          },
        ],
      };
    }
  };

  return (
    <div class="onboarding-modal">
      <div class="onboarding-modal__overlay"></div>
      <div class="onboarding-modal__content">
        <Show when={step() === "persona"}>
          <div class="onboarding-modal__step">
            <div class="onboarding-modal__icon">🎮</div>
            <h2 class="onboarding-modal__title">Welcome to Game Loopers!</h2>
            <p class="onboarding-modal__description">
              A social commerce platform where tabletop game creators collaborate, publish, and earn together.
            </p>

            <div class="onboarding-modal__personas">
              <button
                type="button"
                class="onboarding-modal__persona-card"
                onClick={() => handlePersonaSelect("creator")}
              >
                <span class="onboarding-modal__persona-icon">🎨</span>
                <h3 class="onboarding-modal__persona-title">I'm a Creator</h3>
                <p class="onboarding-modal__persona-description">
                  I want to create and sell game products
                </p>
              </button>

              <button
                type="button"
                class="onboarding-modal__persona-card"
                onClick={() => handlePersonaSelect("buyer")}
              >
                <span class="onboarding-modal__persona-icon">🛒</span>
                <h3 class="onboarding-modal__persona-title">I'm a Buyer</h3>
                <p class="onboarding-modal__persona-description">
                  I want to discover and purchase game products
                </p>
              </button>

              <button
                type="button"
                class="onboarding-modal__persona-card"
                onClick={() => handlePersonaSelect("both")}
              >
                <span class="onboarding-modal__persona-icon">✨</span>
                <h3 class="onboarding-modal__persona-title">Both!</h3>
                <p class="onboarding-modal__persona-description">
                  I want to create products and support other creators
                </p>
              </button>
            </div>
          </div>
        </Show>

        <Show when={step() === "next-steps"}>
          <div class="onboarding-modal__step">
            <div class="onboarding-modal__icon">🚀</div>
            <h2 class="onboarding-modal__title">{getNextSteps().title}</h2>
            <p class="onboarding-modal__description">
              Here's what you can do next:
            </p>

            <div class="onboarding-modal__next-steps">
              {getNextSteps().steps.map((stepItem) => (
                <button
                  type="button"
                  class="onboarding-modal__next-step"
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      const response = await fetch("/api/users/complete-onboarding", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                      });

                      if (!response.ok) {
                        throw new Error("Failed to complete onboarding");
                      }

                      window.location.href = stepItem.action;
                    } catch (error) {
                      console.error("Error completing onboarding:", error);
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting()}
                >
                  <span class="onboarding-modal__next-step-icon">
                    {stepItem.icon}
                  </span>
                  <span class="onboarding-modal__next-step-text">
                    {stepItem.text}
                  </span>
                  <span class="onboarding-modal__next-step-arrow">→</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              class="onboarding-modal__skip"
              onClick={handleComplete}
              disabled={isSubmitting()}
            >
              {isSubmitting() ? "Loading..." : "I'll explore on my own"}
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}
