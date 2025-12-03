import { createSignal } from "solid-js";
import "./document-create-asset-button.css";

interface DocumentCreateAssetButtonProps {
  documentId: string;
  documentTitle: string;
}

export default function DocumentCreateAssetButton(props: DocumentCreateAssetButtonProps) {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);

  const handleCreateAsset = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/documents/create-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: props.documentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create asset");
      }

      setSuccess("Asset created successfully!");

      // Redirect to the new asset after a short delay
      if (data.asset?.handle) {
        setTimeout(() => {
          window.location.href = `/assets/${data.asset.handle}`;
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="document-create-asset">
      <button
        type="button"
        class="document-create-asset__btn"
        onClick={handleCreateAsset}
        disabled={isLoading()}
      >
        {isLoading() ? (
          <>
            <span class="document-create-asset__spinner" />
            <span>Creating PDF...</span>
          </>
        ) : (
          <>
            <svg
              class="document-create-asset__icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>Create Asset from PDF</span>
          </>
        )}
      </button>

      {error() && (
        <p class="document-create-asset__error">{error()}</p>
      )}

      {success() && (
        <p class="document-create-asset__success">{success()}</p>
      )}

      <p class="document-create-asset__hint">
        Generate a PDF from this document and save it as a downloadable asset.
      </p>
    </div>
  );
}
