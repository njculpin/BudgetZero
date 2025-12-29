import { createSignal, createEffect, For, Show } from "solid-js";
import type { ProductFile, ProductComponent } from "@/types";
import "./product-publish-checklist.css";

interface Requirement {
  id: string;
  label: string;
  description: string;
  status: "complete" | "incomplete";
  isRequired: boolean;
}

export interface ProductPublishChecklistProps {
  productId: string;
  title: string;
  description: string;
  price: number | null;
  files: ProductFile[];
  components: ProductComponent[];
  isEmbeddable: boolean;
  royaltyRate: number | null;
  coverImage: string | null;
}

export default function ProductPublishChecklist(props: ProductPublishChecklistProps) {
  const [expanded, setExpanded] = createSignal<string | null>(null);
  const [requirements, setRequirements] = createSignal<Requirement[]>([]);

  createEffect(() => {
    const reqs: Requirement[] = [
      {
        id: "title",
        label: "Product title",
        description: "A clear, descriptive title helps buyers find your product.",
        status: props.title && props.title.trim().length > 0 ? "complete" : "incomplete",
        isRequired: true,
      },
      {
        id: "description",
        label: "Product description",
        description: "Explain what's included, how to use it, and what makes it special.",
        status: props.description && props.description.trim().length > 0 ? "complete" : "incomplete",
        isRequired: true,
      },
      {
        id: "content",
        label: "Files or components",
        description: "Products must include downloadable files or embed other products as components.",
        status: (props.files && props.files.length > 0) || (props.components && props.components.length > 0) ? "complete" : "incomplete",
        isRequired: true,
      },
      {
        id: "price",
        label: "Price set",
        description: "Set a price for your product. You can offer it for free by setting the price to $0.",
        status: props.price !== null && props.price >= 0 ? "complete" : "incomplete",
        isRequired: true,
      },
      {
        id: "royalty",
        label: "Royalty rate configured",
        description: "If this product is embeddable, set the royalty rate you'll earn when others embed it.",
        status: props.isEmbeddable ? (props.royaltyRate !== null && props.royaltyRate >= 0 ? "complete" : "incomplete") : "complete",
        isRequired: props.isEmbeddable,
      },
      {
        id: "cover",
        label: "Cover image",
        description: "A cover image makes your product stand out in the marketplace. (Recommended but not required)",
        status: props.coverImage ? "complete" : "incomplete",
        isRequired: false,
      },
    ];

    setRequirements(reqs);
  });

  const progress = () => {
    const requiredReqs = requirements().filter(r => r.isRequired);
    const completeRequired = requiredReqs.filter(r => r.status === "complete").length;
    return requiredReqs.length > 0 ? (completeRequired / requiredReqs.length) * 100 : 0;
  };

  const allRequiredMet = () => {
    return requirements().filter(r => r.isRequired).every(r => r.status === "complete");
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => prev === id ? null : id);
  };

  return (
    <div class="publish-checklist">
      <div class="publish-checklist__header">
        <h3 class="publish-checklist__title">Publishing Requirements</h3>
        <p class="publish-checklist__subtitle">
          Complete all required items before publishing your product.
        </p>
      </div>

      <div class="publish-checklist__progress">
        <div class="publish-checklist__progress-bar">
          <div
            class="publish-checklist__progress-fill"
            classList={{
              "publish-checklist__progress-fill--complete": allRequiredMet(),
            }}
            style={`width: ${progress()}%`}
          />
        </div>
        <span class="publish-checklist__progress-text">
          {requirements().filter(r => r.isRequired && r.status === "complete").length} / {requirements().filter(r => r.isRequired).length} required items complete
        </span>
      </div>

      <ul class="publish-checklist__list">
        <For each={requirements()}>
          {(req) => (
            <li
              class="publish-checklist__item"
              classList={{
                "publish-checklist__item--complete": req.status === "complete",
                "publish-checklist__item--incomplete": req.status === "incomplete",
                "publish-checklist__item--expanded": expanded() === req.id,
              }}
            >
              <button
                type="button"
                class="publish-checklist__item-button"
                onClick={() => toggleExpanded(req.id)}
              >
                <span class="publish-checklist__icon">
                  {req.status === "complete" ? "✅" : "❌"}
                </span>
                <span class="publish-checklist__label">
                  {req.label}
                  {!req.isRequired && <span class="publish-checklist__optional"> (Optional)</span>}
                </span>
                <span
                  class="publish-checklist__expand-icon"
                  classList={{
                    "publish-checklist__expand-icon--expanded": expanded() === req.id,
                  }}
                >
                  ▼
                </span>
              </button>
              <Show when={expanded() === req.id}>
                <p class="publish-checklist__description">
                  {req.description}
                </p>
              </Show>
            </li>
          )}
        </For>
      </ul>

      <Show when={allRequiredMet()}>
        <div class="publish-checklist__success">
          <span class="publish-checklist__success-icon">🎉</span>
          <p class="publish-checklist__success-text">
            All required items complete! Your product is ready to publish.
          </p>
        </div>
      </Show>
    </div>
  );
}
