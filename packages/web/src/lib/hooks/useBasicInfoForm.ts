import { createSignal, createEffect, type Accessor, type Setter } from "solid-js";

/**
 * Initial data for the basic info form
 */
export interface BasicInfoInitialData {
  title: string;
  description: string | null;
}

/**
 * Configuration for the useBasicInfoForm hook
 */
export interface UseBasicInfoFormConfig {
  /** The entity ID (productId or assetId) */
  entityId: string;
  /** The param name for the entity ID in the form data */
  entityParamName: string;
  /** API endpoint for updating the entity */
  updateEndpoint: string;
  /** URL path segment for the entity type (e.g., "products" or "assets") */
  urlPathSegment: string;
  /** Response key containing the updated entity */
  responseKey: string;
  /** Initial form data */
  initialData: BasicInfoInitialData;
}

/**
 * Return type for the useBasicInfoForm hook
 */
export interface UseBasicInfoFormReturn {
  title: Accessor<string>;
  setTitle: Setter<string>;
  description: Accessor<string>;
  setDescription: Setter<string>;
  isLoading: Accessor<boolean>;
  error: Accessor<string>;
  setError: Setter<string>;
  success: Accessor<string>;
  setSuccess: Setter<string>;
  handleSubmit: (e: SubmitEvent) => Promise<void>;
}

/**
 * Shared hook for basic info form functionality (title/description editing)
 * Handles form state, submission, and handle-based redirects
 */
export function useBasicInfoForm(config: UseBasicInfoFormConfig): UseBasicInfoFormReturn {
  const [title, setTitle] = createSignal(config.initialData.title);
  const [description, setDescription] = createSignal(config.initialData.description || "");
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  // Update signals when initialData changes (e.g., after page reload)
  createEffect(() => {
    setTitle(config.initialData.title);
    setDescription(config.initialData.description || "");
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append(config.entityParamName, config.entityId);
      formData.append("title", title());
      formData.append("description", description());

      const response = await fetch(config.updateEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setSuccess("Basic info updated successfully!");
      setIsLoading(false);

      // Redirect if handle changed
      const entity = data[config.responseKey];
      const newHandle = entity?.handle;
      const currentPath = window.location.pathname;
      const currentHandle = currentPath.split(`/${config.urlPathSegment}/`)[1]?.split("?")[0];

      if (newHandle && currentHandle && newHandle !== currentHandle) {
        // Preserve current mode parameter if it exists
        const currentMode = new URLSearchParams(window.location.search).get("mode");
        const newUrl = currentMode
          ? `/${config.urlPathSegment}/${newHandle}?mode=${currentMode}`
          : `/${config.urlPathSegment}/${newHandle}`;

        setTimeout(() => {
          window.location.href = newUrl;
        }, 1500);
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    isLoading,
    error,
    setError,
    success,
    setSuccess,
    handleSubmit,
  };
}
