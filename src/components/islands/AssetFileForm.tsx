import { createSignal, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";

export interface AssetFileFormProps {
  assetId: string;
  existingFile: {
    id: string;
    title: string;
    file_size_bytes: number;
    file_url: string;
  } | null;
}

export default function AssetFileForm(props: AssetFileFormProps) {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleFileSelected = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      setSelectedFile(input.files[0]);
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!selectedFile()) {
      setError("Please select a file to upload");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("assetId", props.assetId);
      formData.append("files", selectedFile()!);

      const response = await fetch("/api/assets/update-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload file");
        setIsLoading(false);
        return;
      }

      setSuccess("File uploaded successfully!");
      setIsLoading(false);
      setSelectedFile(null);

      // Reload page to show new file
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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

      <Show when={props.existingFile}>
        <div class="asset-file-form__existing">
          <div class="asset-file-form__existing-header">
            <h4 class="asset-file-form__existing-title">Current File</h4>
          </div>
          <div class="asset-file-form__file-card">
            <div class="asset-file-form__file-info">
              <span class="asset-file-form__file-name">{props.existingFile?.title}</span>
              <span class="asset-file-form__file-size">
                {props.existingFile && (props.existingFile.file_size_bytes / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <a
              href={props.existingFile?.file_url}
              target="_blank"
              rel="noopener noreferrer"
              class="button button--ghost button--sm"
            >
              Download
            </a>
          </div>
          <p class="asset-file-form__replace-note">
            Upload a new file below to replace the current one
          </p>
        </div>
      </Show>

      <div class="form-field">
        <label class="form-field__label">
          {props.existingFile ? "Replace Asset File" : "Upload Asset File"}
        </label>
        <input
          type="file"
          onChange={handleFileSelected}
          disabled={isLoading()}
          class="form-field__file-input"
          accept=".pdf,.stl,.obj,.zip,.png,.jpg,.jpeg"
        />
        <p class="form-field__help-text">
          Upload the main downloadable file for this asset (PDF, STL, OBJ, ZIP, etc.)
        </p>
        <Show when={selectedFile()}>
          <p class="asset-file-form__selected">
            Selected: {selectedFile()!.name} ({(selectedFile()!.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </Show>
      </div>

      <div class="asset-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Uploading..."
          disabled={!selectedFile()}
        >
          {props.existingFile ? "Replace File" : "Upload File"}
        </LoadingButton>
      </div>
    </form>
  );
}
