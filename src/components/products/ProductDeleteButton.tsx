import { createSignal } from "solid-js";
import { LoadingButton } from "@/components/interactive";
import "./product-delete-button.css";

export interface ProductDeleteButtonProps {
  productId: string;
  productTitle: string;
}

export default function ProductDeleteButton(props: ProductDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete "${props.productTitle}"?\n\nThis action cannot be undone. All files, documents, and data associated with this product will be permanently removed.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/products/delete-product", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete product");
        setIsDeleting(false);
        return;
      }

      // Redirect to products page after successful deletion
      window.location.href = "/products";
    } catch (err) {
      setError("An unexpected error occurred while deleting the product");
      setIsDeleting(false);
    }
  };

  return (
    <div class="product-delete">
      <div class="product-delete__warning">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="product-delete__icon"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div class="product-delete__warning-text">
          <p class="product-delete__warning-title">Danger Zone</p>
          <p class="product-delete__warning-description">
            Deleting this product is permanent and cannot be undone. All associated files, documents, and data will be lost.
          </p>
        </div>
      </div>

      {error() && (
        <div class="product-delete__error">
          {error()}
        </div>
      )}

      <LoadingButton
        type="button"
        variant="destructive"
        size="md"
        onClick={handleDelete}
        isLoading={isDeleting()}
        loadingText="Deleting..."
      >
        Delete Product
      </LoadingButton>
    </div>
  );
}
