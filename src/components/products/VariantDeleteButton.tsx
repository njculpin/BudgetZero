import { createSignal, Show } from "solid-js";
import { ErrorMessage, SuccessMessage } from "@/components/interactive";
import "@/components/interactive/base.css";
import "./variant-delete-button.css";

export interface VariantDeleteButtonProps {
  variantId: string;
  variantTitle: string;
}

export default function VariantDeleteButton(props: VariantDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the "${props.variantTitle}" variant? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/variants/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: props.variantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete variant");
        setIsDeleting(false);
        return;
      }

      setSuccess("Variant deleted! Refreshing...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  return (
    <div class="variant-delete">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="variant-delete__danger-zone">
        <div class="variant-delete__danger-header">
          <h6 class="variant-delete__danger-title">Danger Zone</h6>
          <p class="variant-delete__danger-description">
            Deleting this variant is permanent and cannot be undone. All associated pricing and assets will be removed.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          class="variant-delete__button"
          disabled={isDeleting()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          {isDeleting() ? "Deleting..." : "Delete This Variant"}
        </button>
      </div>
    </div>
  );
}
