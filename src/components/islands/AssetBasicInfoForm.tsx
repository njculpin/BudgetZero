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

export interface AssetBasicInfoFormProps {
  assetId: string;
  initialData: {
    title: string;
    description: string | null;
  };
}

export default function AssetBasicInfoForm(props: AssetBasicInfoFormProps) {
  const form = useBasicInfoForm({
    entityId: props.assetId,
    entityParamName: "assetId",
    updateEndpoint: "/api/assets/update-asset",
    urlPathSegment: "assets",
    responseKey: "asset",
    initialData: props.initialData,
  });

  return (
    <form onSubmit={form.handleSubmit} class="asset-form">
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
        placeholder="Enter asset title"
        required
        disabled={form.isLoading()}
        helpText="A descriptive title for your asset. The URL handle will update based on this."
      />

      <TextAreaField
        label="Description"
        name="description"
        value={form.description()}
        onInput={(e) => form.setDescription(e.currentTarget.value)}
        placeholder="Describe your asset - what it includes, how it can be used, etc."
        rows={6}
        disabled={form.isLoading()}
      />

      <div class="asset-form__actions">
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
