import { createSignal, type Accessor, type Setter } from "solid-js";

/**
 * Configuration for the useDeleteConfirm hook
 */
export interface UseDeleteConfirmConfig {
  /** The entity ID to delete */
  entityId: string;
  /** The param name for the entity ID in the request body */
  entityParamName: string;
  /** API endpoint for deleting the entity */
  deleteEndpoint: string;
  /** URL to redirect to after successful deletion */
  redirectUrl: string;
}

/**
 * Return type for the useDeleteConfirm hook
 */
export interface UseDeleteConfirmReturn {
  showConfirm: Accessor<boolean>;
  setShowConfirm: Setter<boolean>;
  isDeleting: Accessor<boolean>;
  error: Accessor<string>;
  setError: Setter<string>;
  handleDelete: () => Promise<void>;
  openConfirm: () => void;
  closeConfirm: () => void;
}

/**
 * Shared hook for delete confirmation functionality
 * Handles confirmation dialog state, deletion API call, and redirect
 */
export function useDeleteConfirm(config: UseDeleteConfirmConfig): UseDeleteConfirmReturn {
  const [showConfirm, setShowConfirm] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal("");

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  const handleDelete = async () => {
    setError("");
    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append(config.entityParamName, config.entityId);

      const response = await fetch(config.deleteEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete");
        setIsDeleting(false);
        setShowConfirm(false);
        return;
      }

      // Redirect after successful delete
      window.location.href = config.redirectUrl;
    } catch {
      setError("An unexpected error occurred");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return {
    showConfirm,
    setShowConfirm,
    isDeleting,
    error,
    setError,
    handleDelete,
    openConfirm,
    closeConfirm,
  };
}
