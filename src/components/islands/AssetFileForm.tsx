import { createSignal, Show, For } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";

export interface AssetFile {
  id: string;
  title: string;
  file_size_bytes: number;
  file_url: string;
}

export interface AssetFileFormProps {
  assetId: string;
  existingFiles: AssetFile[];
}

export default function AssetFileForm(props: AssetFileFormProps) {
  const [files, setFiles] = createSignal<AssetFile[]>(props.existingFiles);
  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleFilesSelected = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files) {
      setSelectedFiles(Array.from(input.files));
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/assets/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete file");
        return;
      }

      setSuccess("File deleted successfully! Refreshing...");

      // Reload page to update server-rendered file list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred while deleting file");
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (selectedFiles().length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("assetId", props.assetId);

      // Append new files
      selectedFiles().forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/assets/update-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload files");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      setSuccess("Files uploaded successfully! Refreshing...");
      setIsLoading(false);

      // Reload the page to show newly uploaded files
      // This is needed because the file list in Preview/Shop mode is server-rendered
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  return (
    <div class="asset-files-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <Show when={files().length > 0}>
        <div class="asset-files-form__existing">
          <h4 class="asset-files-form__existing-title">
            Current Files ({files().length})
          </h4>
          <div class="asset-files-form__list">
            <For each={files()}>
              {(file) => (
                <div class="asset-files-form__item">
                  <div class="asset-files-form__file-info">
                    <span class="asset-files-form__file-name">{file.title}</span>
                    <span class="asset-files-form__file-size">
                      {formatFileSize(file.file_size_bytes)} MB
                    </span>
                  </div>
                  <div class="asset-files-form__controls">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="asset-files-form__button"
                      aria-label={`Download ${file.title}`}
                    >
                      ↓
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      class="asset-files-form__button asset-files-form__button--delete"
                      aria-label={`Delete ${file.title}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="asset-form">
        <div class="form-field">
          <label for="asset-file-upload" class="form-field__label">Add More Files</label>
          <input
            id="asset-file-upload"
            type="file"
            multiple
            onChange={handleFilesSelected}
            disabled={isLoading()}
            class="form-field__file-input"
            accept=".pdf,.stl,.obj,.zip,.png,.jpg,.jpeg,.glb,.gltf,.3mf,.ply,.fbx"
            aria-describedby="asset-file-help"
          />
          <p id="asset-file-help" class="form-field__help-text">
            Upload downloadable files for this asset (PDF, STL, OBJ, ZIP, etc.). Maximum 50MB per file.
          </p>
          <Show when={selectedFiles().length > 0}>
            <p class="asset-files-form__selected">
              Selected {selectedFiles().length} file(s)
            </p>
          </Show>
        </div>

        <div class="asset-form__actions">
          <LoadingButton
            type="submit"
            isLoading={isLoading()}
            loadingText="Uploading..."
            disabled={selectedFiles().length === 0}
          >
            Upload Files
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
