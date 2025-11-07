import { createSignal, createEffect, Show, For } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";
import "./asset-files-form.css";

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
  const [hasReordered, setHasReordered] = createSignal(false);
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);

  // Update files when props change
  createEffect(() => {
    setFiles(props.existingFiles);
  });

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

  // Handle file reordering
  const handleDragStart = (e: DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex() !== null) {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.stopPropagation();
    setDragOverIndex(null);
  };

  const handleFileDrop = (e: DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const dragIndex = draggedIndex();

    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFiles = [...files()];
    const [draggedFile] = newFiles.splice(dragIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    setFiles(newFiles);
    setHasReordered(true);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: DragEvent) => {
    e.stopPropagation();
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveOrder = async () => {
    setError("");
    setSuccess("");

    try {
      const fileOrders = files().map((file, index) => ({
        id: file.id,
        position: index,
      }));

      const response = await fetch("/api/assets/reorder-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: props.assetId,
          fileOrders,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save file order");
        return;
      }

      setSuccess("File order saved successfully!");
      setHasReordered(false);
    } catch (err) {
      setError("An unexpected error occurred while saving order");
    }
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
              {(file, index) => (
                <div
                  class="file-item"
                  classList={{
                    "file-item--dragging": draggedIndex() === index(),
                    "file-item--drag-over": dragOverIndex() === index(),
                  }}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index())}
                  onDragOver={(e) => handleDragOver(e, index())}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleFileDrop(e, index())}
                  onDragEnd={handleDragEnd}
                >
                  <div class="file-item__drag-handle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="4" y1="8" x2="20" y2="8"/>
                      <line x1="4" y1="16" x2="20" y2="16"/>
                    </svg>
                  </div>
                  <div class="file-item__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                      <polyline points="13 2 13 9 20 9"/>
                    </svg>
                  </div>
                  <div class="file-item__info">
                    <p class="file-item__name">{file.title}</p>
                    <p class="file-item__meta">
                      {formatFileSize(file.file_size_bytes)} MB
                    </p>
                  </div>
                  <div class="asset-files-form__controls">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="asset-files-form__button"
                      aria-label={`Download ${file.title}`}
                      title="Download"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      class="asset-files-form__button asset-files-form__button--delete"
                      aria-label={`Delete ${file.title}`}
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>

          <Show when={hasReordered()}>
            <div class="asset-files-form__save-order">
              <button
                type="button"
                onClick={handleSaveOrder}
                class="asset-files-form__save-button"
              >
                Save Order
              </button>
            </div>
          </Show>
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="asset-form">
        <div class="form-field">
          <label for="asset-file-upload" class="form-field__label">Add More Files</label>
          <div class="upload-zone">
            <div class="upload-zone__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <div class="upload-zone__text">
              <p class="upload-zone__primary">Click to upload or drag and drop</p>
              <p class="upload-zone__secondary">PDF, STL, OBJ, ZIP, etc. up to 50MB</p>
            </div>
            <input
              id="asset-file-upload"
              type="file"
              multiple
              onChange={handleFilesSelected}
              disabled={isLoading()}
              class="upload-zone__input"
              accept=".pdf,.stl,.obj,.zip,.png,.jpg,.jpeg,.glb,.gltf,.3mf,.ply,.fbx"
              aria-describedby="asset-file-help"
            />
          </div>
          <Show when={selectedFiles().length > 0}>
            <div class="upload-zone__preview">
              <p class="upload-zone__preview-count">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {selectedFiles().length} file{selectedFiles().length !== 1 ? 's' : ''} selected
              </p>
              <div class="upload-zone__preview-list">
                {selectedFiles().map(file => (
                  <span class="upload-zone__preview-item">{file.name}</span>
                ))}
              </div>
            </div>
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
