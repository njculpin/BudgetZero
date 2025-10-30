import { createSignal, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  ConfirmDialog,
} from "./base";
import "./base/base.css";

export interface ProductDeleteButtonProps {
  productId: string;
  productTitle: string;
  redirectUrl: string;
}

export default function ProductDeleteButton(props: ProductDeleteButtonProps) {
  const [showConfirm, setShowConfirm] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/products/delete-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: props.productId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete product");
        setIsDeleting(false);
        setShowConfirm(false);
        return;
      }

      // Redirect after successful delete
      window.location.href = props.redirectUrl;
    } catch (err) {
      setError("An unexpected error occurred");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div class="product-delete-button">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <LoadingButton
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        isLoading={isDeleting()}
        loadingText="Deleting..."
      >
        Delete
      </LoadingButton>

      <ConfirmDialog
        isOpen={showConfirm()}
        title="Delete Product"
        message={`Are you sure you want to delete "${props.productTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        isLoading={isDeleting()}
      />
    </div>
  );
}
