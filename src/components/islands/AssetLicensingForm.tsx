import { createSignal, Show } from "solid-js";
import {
  SelectField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";
import Button from "../Button.astro";

export interface AssetLicensingFormProps {
  assetId: string;
  initialData: {
    licenseType: string;
    commercialUse: boolean;
    attribution: boolean;
    customTerms: string;
  };
}

export default function AssetLicensingForm(props: AssetLicensingFormProps) {
  const [licenseType, setLicenseType] = createSignal(
    props.initialData.licenseType || "standard"
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
      formData.append("licenseType", licenseType());

      const response = await fetch("/api/assets/update-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update licensing");
        setIsLoading(false);
        return;
      }

      setSuccess("Licensing terms updated successfully!");
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
        label="License Type"
        name="licenseType"
        value={licenseType()}
        onChange={(e: any) => setLicenseType(e.currentTarget.value)}
        options={[
          {
            value: "standard",
            label:
              "Standard License - Personal & Commercial Use on Game Loopers Platform Only",
          },
        ]}
        disabled={isLoading()}
      />

      <div class="asset-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Saving..."
        >
          Save License Terms
        </LoadingButton>
      </div>
    </form>
  );
}
