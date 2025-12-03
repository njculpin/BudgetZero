import { Show } from "solid-js";
import { useDeleteConfirm } from "@/lib/hooks/useDeleteConfirm";
import { LoadingButton, ErrorMessage, ConfirmDialog } from "@/components/interactive";
import "@/components/interactive/base.css";

export interface DocumentDeleteButtonProps {
  documentId: string;
  documentTitle: string;
}

export default function DocumentDeleteButton(props: DocumentDeleteButtonProps) {
  const deleteAction = useDeleteConfirm({
    entityId: props.documentId,
    entityParamName: "documentId",
    deleteEndpoint: "/api/documents/delete-document",
    redirectUrl: "/documents",
  });

  return (
    <div class="document-delete-button">
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
        Delete Document
      </LoadingButton>

      <ConfirmDialog
        isOpen={deleteAction.showConfirm()}
        title="Delete Document"
        message={`Are you sure you want to delete "${props.documentTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={deleteAction.handleDelete}
        onCancel={deleteAction.closeConfirm}
      />
    </div>
  );
}
