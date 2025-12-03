import { Show } from "solid-js";
import { useDeleteConfirm } from "@/lib/hooks/useDeleteConfirm";
import { LoadingButton, ErrorMessage, ConfirmDialog } from "@/components/interactive";
import "@/components/interactive/base.css";

export interface AssetDeleteButtonProps {
  assetId: string;
  assetTitle: string;
  redirectUrl: string;
}

export default function AssetDeleteButton(props: AssetDeleteButtonProps) {
  const deleteAction = useDeleteConfirm({
    entityId: props.assetId,
    entityParamName: "assetId",
    deleteEndpoint: "/api/assets/delete-asset",
    redirectUrl: props.redirectUrl,
  });

  return (
    <div class="asset-delete-button">
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
        title="Delete Asset"
        message={`Are you sure you want to delete "${props.assetTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={deleteAction.handleDelete}
        onCancel={deleteAction.closeConfirm}
      />
    </div>
  );
}
