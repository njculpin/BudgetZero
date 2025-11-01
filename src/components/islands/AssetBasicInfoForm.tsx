import { createSignal, Show } from "solid-js";
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
  const [title, setTitle] = createSignal(props.initialData.title);
  const [description, setDescription] = createSignal(
    props.initialData.description || ""
  );
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("assetId", props.assetId);
      formData.append("title", title());
      formData.append("description", description());

      const response = await fetch("/api/assets/update-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update asset");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setSuccess("Basic info updated successfully!");
      setIsLoading(false);

      // Redirect if handle changed
      const newHandle = data.asset?.handle;
      if (newHandle && newHandle !== window.location.pathname.split("/")[2]) {
        setTimeout(() => {
          window.location.href = `/assets/${newHandle}/edit`;
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="asset-form">
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
        placeholder="Enter asset title"
        required
        disabled={isLoading()}
        helpText="A descriptive title for your asset. The URL handle will update based on this."
      />

      <TextAreaField
        label="Description"
        name="description"
        value={description()}
        onInput={(e) => setDescription(e.currentTarget.value)}
        placeholder="Describe your asset - what it includes, how it can be used, etc."
        rows={6}
        disabled={isLoading()}
      />

      <div class="asset-form__actions">
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
