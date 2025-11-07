import { createSignal, createEffect, Show } from "solid-js";
import {
  FormField,
  TextAreaField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";

export interface ProductBasicInfoFormProps {
  productId: string;
  initialData: {
    title: string;
    description: string | null;
  };
}

export default function ProductBasicInfoForm(props: ProductBasicInfoFormProps) {
  const [title, setTitle] = createSignal(props.initialData.title);
  const [description, setDescription] = createSignal(
    props.initialData.description || ""
  );
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  // Update signals when props change (e.g., after page reload)
  createEffect(() => {
    setTitle(props.initialData.title);
    setDescription(props.initialData.description || "");
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("title", title());
      formData.append("description", description());

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update product");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setSuccess("Basic info updated successfully!");
      setIsLoading(false);

      // Redirect if handle changed
      const newHandle = data.product?.handle;
      const currentPath = window.location.pathname;
      const currentHandle = currentPath.split("/products/")[1]?.split("?")[0];

      if (newHandle && currentHandle && newHandle !== currentHandle) {
        // Preserve current mode parameter if it exists
        const currentMode = new URLSearchParams(window.location.search).get("mode");
        const newUrl = currentMode
          ? `/products/${newHandle}?mode=${currentMode}`
          : `/products/${newHandle}`;

        setTimeout(() => {
          window.location.href = newUrl;
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="product-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <FormField
        label="Title"
        name="title"
        type="text"
        value={title()}
        onInput={(e) => setTitle(e.currentTarget.value)}
        placeholder="Enter product title"
        required
        disabled={isLoading()}
        helpText="A descriptive title for your product. The URL handle will update based on this."
      />

      <TextAreaField
        label="Description"
        name="description"
        value={description()}
        onInput={(e) => setDescription(e.currentTarget.value)}
        placeholder="Describe your product - what it includes, how it can be used, etc."
        rows={6}
        disabled={isLoading()}
      />

      <div class="product-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Saving..."
        >
          Save Basic Info
        </LoadingButton>
      </div>
    </form>
  );
}
