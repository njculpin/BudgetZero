import { createSignal, Show } from "solid-js";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import {
  SelectField,
  ErrorMessage,
} from "@/components/interactive";
import "@/components/interactive/base.css";
import "@/styles/save-status.css";

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
  const [error, setError] = createSignal("");

  // Auto-save handler
  const saveData = async () => {
    setError("");

    const formData = new FormData();
    formData.append("assetId", props.assetId);
    formData.append("licenseType", licenseType());

    const response = await fetch("/api/assets/update-asset", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error || "Failed to update licensing";
      setError(errorMessage);

      // Throw error with status for retry logic
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = response.status;
      throw error;
    }
  };

  const autoSave = useAutoSave({
    debounceMs: 1000,
    onSave: saveData,
  });

  const handleLicenseChange = (e: Event) => {
    setLicenseType((e.currentTarget as HTMLSelectElement).value);
    autoSave.triggerSave();
  };

  return (
    <div class="asset-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      {/* Save Status Indicator */}
      <div class="asset-form__save-status">
        <Show when={autoSave.saveStatus() === "saving"}>
          <span
            class="save-status save-status--saving"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span class="save-status__spinner" aria-hidden="true"></span>
            Saving...
          </span>
        </Show>
        <Show when={autoSave.saveStatus() === "saved"}>
          <span
            class="save-status save-status--saved"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            ✓ Saved
          </span>
        </Show>
        <Show when={autoSave.saveStatus() === "error"}>
          <span
            class="save-status save-status--error"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            ✗ Save failed
          </span>
        </Show>
      </div>

      <SelectField
        label="License Type"
        name="licenseType"
        value={licenseType()}
        onChange={handleLicenseChange}
        options={[
          {
            value: "standard",
            label:
              "Standard License - Personal & Commercial Use on Game Loopers Platform Only",
          },
        ]}
        disabled={false}
      />
    </div>
  );
}
