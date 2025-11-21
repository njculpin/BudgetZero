import { Show } from "solid-js";
import { useBasicInfoForm } from "@/lib/hooks/useBasicInfoForm";
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
  const form = useBasicInfoForm({
    entityId: props.productId,
    entityParamName: "productId",
    updateEndpoint: "/api/products/update-product",
    urlPathSegment: "products",
    responseKey: "product",
    initialData: props.initialData,
  });

  return (
    <form onSubmit={form.handleSubmit} class="product-form">
      <Show when={form.error()}>
        <ErrorMessage message={form.error()} onDismiss={() => form.setError("")} />
      </Show>

      <Show when={form.success()}>
        <SuccessMessage message={form.success()} onDismiss={() => form.setSuccess("")} />
      </Show>

      <FormField
        label="Title"
        name="title"
        type="text"
        value={form.title()}
        onInput={(e) => form.setTitle(e.currentTarget.value)}
        placeholder="Enter product title"
        required
        disabled={form.isLoading()}
        helpText="A descriptive title for your product. The URL handle will update based on this."
      />

      <TextAreaField
        label="Description"
        name="description"
        value={form.description()}
        onInput={(e) => form.setDescription(e.currentTarget.value)}
        placeholder="Describe your product - what it includes, how it can be used, etc."
        rows={6}
        disabled={form.isLoading()}
      />

      <div class="product-form__actions">
        <LoadingButton
          type="submit"
          isLoading={form.isLoading()}
          loadingText="Saving..."
        >
          Save Basic Info
        </LoadingButton>
      </div>
    </form>
  );
}
