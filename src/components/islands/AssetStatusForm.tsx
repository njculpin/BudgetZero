import { createSignal, Show } from "solid-js";
import {
  SelectField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";

export interface AssetStatusFormProps {
  assetId: string;
  initialStatus: "draft" | "published" | "archived";
}

export default function AssetStatusForm(props: AssetStatusFormProps) {
  const [status, setStatus] = createSignal(props.initialStatus);
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
      formData.append("status", status());

      const response = await fetch("/api/assets/update-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update status");
        setIsLoading(false);
        return;
      }

      setSuccess("Status updated successfully!");
      setIsLoading(false);
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

      <SelectField
        label="Publication Status"
        name="status"
        value={status()}
        onChange={(e) =>
          setStatus(e.currentTarget.value as "draft" | "published" | "archived")
        }
        options={[
          { value: "draft", label: "Draft - Not visible to others" },
          { value: "published", label: "Published - Visible in marketplace" },
          { value: "archived", label: "Archived - Hidden from marketplace" },
        ]}
        disabled={isLoading()}
        helpText="Draft assets are only visible to you. Published assets appear in the marketplace."
      />

      <div class="asset-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Saving..."
        >
          Update Status
        </LoadingButton>
      </div>
    </form>
  );
}
