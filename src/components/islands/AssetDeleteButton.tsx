import { createSignal, Show } from "solid-js";
import { LoadingButton, ErrorMessage, ConfirmDialog } from "./base";

export interface AssetDeleteButtonProps {
  assetId: string;
  assetTitle: string;
  redirectUrl: string;
}

export default function AssetDeleteButton(props: AssetDeleteButtonProps) {
  const [showConfirm, setShowConfirm] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/assets/delete-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: props.assetId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete asset");
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
    <div class="asset-delete-button">
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
        title="Delete Asset"
        message={`Are you sure you want to delete "${props.assetTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
