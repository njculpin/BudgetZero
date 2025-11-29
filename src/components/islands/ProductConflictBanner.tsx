import { createSignal, Show } from "solid-js";
import "./product-conflict-banner.css";

interface ProductConflictBannerProps {
  productId: string;
  productHandle: string;
  attentionReason: string;
  attentionSince: string;
  onResolve?: () => void;
}

export default function ProductConflictBanner(
  props: ProductConflictBannerProps
) {
  const [resolving, setResolving] = createSignal(false);
  const [dismissed, setDismissed] = createSignal(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleResolve = async () => {
    setResolving(true);

    try {
      const response = await fetch(
        `/api/products/${props.productId}/resolve-conflict`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resolve conflict");
      }

      setDismissed(true);
      if (props.onResolve) {
        props.onResolve();
      }
    } catch (err) {
      console.error("Failed to resolve conflict:", err);
      alert("Failed to resolve conflict. Please try again.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <Show when={!dismissed()}>
      <div class="product-conflict-banner">
        <div class="product-conflict-banner__icon">⚠️</div>
        <div class="product-conflict-banner__content">
          <h3 class="product-conflict-banner__title">
            Product Needs Attention
          </h3>
          <p class="product-conflict-banner__message">
            {props.attentionReason}
          </p>
          <p class="product-conflict-banner__timestamp">
            Flagged on {formatDate(props.attentionSince)}
          </p>
        </div>
        <div class="product-conflict-banner__actions">
          <button
            class="product-conflict-banner__button product-conflict-banner__button--primary"
            onClick={handleResolve}
            disabled={resolving()}
          >
            {resolving() ? "Resolving..." : "Mark as Resolved"}
          </button>
          <a
            href={`/products/edit/${props.productHandle}`}
            class="product-conflict-banner__button product-conflict-banner__button--secondary"
          >
            Edit Product
          </a>
        </div>
      </div>
    </Show>
  );
}
