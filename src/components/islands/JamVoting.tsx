import { createSignal, createEffect, For, Show } from "solid-js";
import type { JamCategory, Product } from "@/types";
import { LoadingButton, ErrorMessage } from "./base";
import "./base/base.css";
import "./jam-voting.css";

interface JamVotingProps {
  jamId: string;
  categories: JamCategory[];
  products: Product[];
  existingVotes?: Record<string, string[]>;
}

export default function JamVoting(props: JamVotingProps) {
  const maxVotesPerCategory = 3;

  const [activeCategory, setActiveCategory] = createSignal(
    props.categories[0]?.id || ""
  );
  const [votes, setVotes] = createSignal<Record<string, Set<string>>>(
    initializeVotes()
  );
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  function initializeVotes(): Record<string, Set<string>> {
    const initialVotes: Record<string, Set<string>> = {};
    if (props.existingVotes) {
      Object.entries(props.existingVotes).forEach(([categoryId, productIds]) => {
        initialVotes[categoryId] = new Set(productIds);
      });
    }
    return initialVotes;
  }

  const toggleVote = (categoryId: string, productId: string) => {
    setVotes((prev) => {
      const newVotes = { ...prev };
      const categoryVotes = new Set(prev[categoryId] || []);

      if (categoryVotes.has(productId)) {
        categoryVotes.delete(productId);
      } else {
        if (categoryVotes.size >= maxVotesPerCategory) {
          setError(
            `You can only select up to ${maxVotesPerCategory} products per category`
          );
          setTimeout(() => setError(""), 3000);
          return prev;
        }
        categoryVotes.add(productId);
      }

      newVotes[categoryId] = categoryVotes;
      return newVotes;
    });
  };

  const categoryVoteCount = (categoryId: string) => {
    return votes()[categoryId]?.size || 0;
  };

  const isProductVoted = (categoryId: string, productId: string) => {
    return votes()[categoryId]?.has(productId) || false;
  };

  const totalVotes = () => {
    return Object.values(votes()).reduce((sum, set) => sum + set.size, 0);
  };

  const submitVotes = async () => {
    setError("");
    setIsSubmitting(true);

    const votePayload: Array<{ category_id: string; product_id: string }> = [];
    Object.entries(votes()).forEach(([categoryId, productIds]) => {
      productIds.forEach((productId) => {
        votePayload.push({ category_id: categoryId, product_id: productId });
      });
    });

    if (votePayload.length === 0) {
      setError("Please select at least one product to vote for");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/jams/submit-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jam_id: props.jamId,
          votes: votePayload,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        localStorage.removeItem(`jam_votes_${props.jamId}`);
        setTimeout(() => {
          window.location.href = window.location.pathname + "?voting_success=true";
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit votes");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  createEffect(() => {
    const votesData: Record<string, string[]> = {};
    Object.entries(votes()).forEach(([categoryId, productIds]) => {
      votesData[categoryId] = Array.from(productIds);
    });
    localStorage.setItem(`jam_votes_${props.jamId}`, JSON.stringify(votesData));
  });

  return (
    <div class="jam-voting">
      {error() && (
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      )}

      {success() && (
        <div class="jam-voting__success">
          <svg
            class="jam-voting__success-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p class="jam-voting__success-text">Votes submitted successfully!</p>
        </div>
      )}

      <Show when={!success()}>
        <div class="jam-voting__categories">
          <For each={props.categories}>
            {(category) => (
              <button
                class={`jam-voting__category ${
                  activeCategory() === category.id
                    ? "jam-voting__category--active"
                    : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span class="jam-voting__category-title">{category.title}</span>
                <span class="jam-voting__category-count">
                  {categoryVoteCount(category.id)}/{maxVotesPerCategory}
                </span>
              </button>
            )}
          </For>
        </div>

        <Show
          when={props.categories.find((c) => c.id === activeCategory())}
        >
          {(category) => (
            <div class="jam-voting__category-description">
              <p>{category().description}</p>
            </div>
          )}
        </Show>

        <div class="jam-voting__products">
          <For each={props.products}>
            {(product) => (
              <div class="jam-voting__product">
                <a
                  href={`/products/${product.handle}`}
                  class="jam-voting__product-link"
                  target="_blank"
                >
                  <div class="jam-voting__product-card">
                    {product.cover_image_url && (
                      <div
                        class="jam-voting__product-image"
                        style={{
                          "background-image": `url('${product.cover_image_url}')`,
                        }}
                      />
                    )}
                    <div class="jam-voting__product-content">
                      <h4 class="jam-voting__product-title">{product.title}</h4>
                    </div>
                  </div>
                </a>

                <label class="jam-voting__vote-label">
                  <input
                    type="checkbox"
                    class="jam-voting__vote-checkbox"
                    checked={isProductVoted(activeCategory(), product.id)}
                    onChange={() => toggleVote(activeCategory(), product.id)}
                  />
                  <span class="jam-voting__vote-text">
                    {isProductVoted(activeCategory(), product.id)
                      ? "Voted ✓"
                      : "Vote for this"}
                  </span>
                </label>
              </div>
            )}
          </For>
        </div>

        <div class="jam-voting__footer">
          <div class="jam-voting__progress">
            <span class="jam-voting__progress-text">
              Total votes: {totalVotes()}
            </span>
          </div>

          <LoadingButton
            type="button"
            variant="primary"
            size="lg"
            isLoading={isSubmitting()}
            loadingText="Submitting..."
            onClick={submitVotes}
          >
            Submit All Votes
          </LoadingButton>
        </div>
      </Show>
    </div>
  );
}
