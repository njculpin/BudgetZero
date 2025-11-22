import { Show } from "solid-js";
import { useDeleteConfirm } from "@/lib/hooks/useDeleteConfirm";
import { LoadingButton, ErrorMessage, ConfirmDialog } from "./base";
import "./base/base.css";

export interface ProductDeleteButtonProps {
  productId: string;
  productTitle: string;
  redirectUrl: string;
}

export default function ProductDeleteButton(props: ProductDeleteButtonProps) {
  const deleteAction = useDeleteConfirm({
    entityId: props.productId,
    entityParamName: "productId",
    deleteEndpoint: "/api/products/delete-product",
    redirectUrl: props.redirectUrl,
  });

  return (
    <div class="product-delete-button">
      <Show when={deleteAction.error()}>
        <ErrorMessage message={deleteAction.error()} onDismiss={() => deleteAction.setError("")} />
      </Show>

      <LoadingButton
        variant="destructive"
        size="sm"
        onClick={deleteAction.openConfirm}
        isLoading={deleteAction.isDeleting()}
        loadingText="Deleting..."
      >
        Delete
      </LoadingButton>

      <ConfirmDialog
        isOpen={deleteAction.showConfirm()}
        title="Delete Product"
        message={`Are you sure you want to delete "${props.productTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={deleteAction.handleDelete}
        onCancel={deleteAction.closeConfirm}
      />
    </div>
  );
}
