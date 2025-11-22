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

export interface DocumentBasicInfoFormProps {
  documentId: string;
  initialTitle: string;
  initialDescription: string;
}

export default function DocumentBasicInfoForm(props: DocumentBasicInfoFormProps) {
  const form = useBasicInfoForm({
    entityId: props.documentId,
    entityParamName: "documentId",
    updateEndpoint: "/api/documents/update-document",
    urlPathSegment: "documents",
    responseKey: "document",
    initialData: {
      title: props.initialTitle,
      description: props.initialDescription,
    },
  });

  return (
    <form onSubmit={form.handleSubmit} class="document-form">
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
        placeholder="Enter document title"
        required
        disabled={form.isLoading()}
        helpText="The title of your document."
      />

      <TextAreaField
        label="Description"
        name="description"
        value={form.description()}
        onInput={(e) => form.setDescription(e.currentTarget.value)}
        placeholder="Brief description of this document"
        rows={3}
        disabled={form.isLoading()}
      />

      <div class="document-form__actions">
        <LoadingButton
          type="submit"
          isLoading={form.isLoading()}
          loadingText="Saving..."
        >
          Save Info
        </LoadingButton>
      </div>
    </form>
  );
}
