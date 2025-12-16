import { createSignal, Show, For, createEffect } from "solid-js";
import {
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import "./document-attachments-form.css";

export interface DocumentAttachment {
  id: string;
  document_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentAttachmentsFormProps {
  documentId: string;
  userId: string;
  existingAttachments: DocumentAttachment[];
}

// Helper to format bytes to human-readable size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export default function DocumentAttachmentsForm(props: DocumentAttachmentsFormProps) {
  const [attachments, setAttachments] = createSignal<DocumentAttachment[]>(props.existingAttachments);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [uploading, setUploading] = createSignal(false);
  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([]);

  let fileInputRef: HTMLInputElement | undefined;

  // Update attachments when props change
  createEffect(() => {
    setAttachments(props.existingAttachments);
  });

  const handleFileSelect = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const files = Array.from(target.files);
      setSelectedFiles(files);
    }
  };

  const handleCancelSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef) {
      fileInputRef.value = "";
    }
  };

  const handleUpload = async () => {
    const files = selectedFiles();
    if (files.length === 0) return;

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("documentId", props.documentId);
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/documents/upload-attachments", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload files");
        setUploading(false);
        return;
      }

      const result = await response.json();

      // Reactively add new attachments to the list
      setAttachments([...attachments(), ...result.attachments]);
      setSuccess(result.message || "Files uploaded successfully!");
      setSelectedFiles([]);
      if (fileInputRef) {
        fileInputRef.value = "";
      }

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, title: string) => {
    if (!confirm(`Delete attachment "${title}"?`)) return;

    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("attachmentId", attachmentId);
      formData.append("documentId", props.documentId);

      const response = await fetch("/api/documents/delete-attachment", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete attachment");
        return;
      }

      // Reactively remove the attachment from the list
      setAttachments(attachments().filter(att => att.id !== attachmentId));
      setSuccess("Attachment deleted successfully!");

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div class="document-attachments-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="document-attachments-form__header">
        <h3 class="document-attachments-form__title">Attachments</h3>
        <label class="document-attachments-form__add-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span>Add Files</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            class="document-attachments-form__file-input"
          />
        </label>
      </div>

      {/* File selection preview */}
      <Show when={selectedFiles().length > 0}>
        <div class="selected-files">
          <div class="selected-files__header">
            <h4 class="selected-files__title">
              Selected Files ({selectedFiles().length})
            </h4>
          </div>
          <div class="selected-files__list">
            <For each={selectedFiles()}>
              {(file) => (
                <div class="selected-files__item">
                  <div class="selected-files__info">
                    <div class="selected-files__name">{file.name}</div>
                    <div class="selected-files__meta">
                      {formatFileSize(file.size)} · {file.type || "Unknown type"}
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
          <div class="selected-files__actions">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading()}
              class="selected-files__upload-button"
            >
              {uploading() ? "Uploading..." : `Upload ${selectedFiles().length} file(s)`}
            </button>
            <button
              type="button"
              onClick={handleCancelSelection}
              disabled={uploading()}
              class="selected-files__cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </Show>

      {/* Existing attachments */}
      <Show when={attachments().length > 0} fallback={
        <div class="document-attachments-form__empty">
          <p>No attachments yet</p>
          <p class="document-attachments-form__empty-hint">
            Add files to attach supporting documents, images, or other resources
          </p>
        </div>
      }>
        <div class="attachments-list">
          <For each={attachments()}>
            {(attachment) => (
              <div class="attachments-list__item">
                <div class="attachments-list__icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div class="attachments-list__info">
                  <div class="attachments-list__title">{attachment.title}</div>
                  <div class="attachments-list__meta">
                    {formatFileSize(attachment.file_size_bytes)} · {attachment.mime_type}
                  </div>
                  <Show when={attachment.description}>
                    <div class="attachments-list__description">
                      {attachment.description}
                    </div>
                  </Show>
                </div>
                <div class="attachments-list__actions">
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="attachments-list__download-button"
                    aria-label={`Download ${attachment.title}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(attachment.id, attachment.title)}
                    class="attachments-list__delete-button"
                    aria-label={`Delete ${attachment.title}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      aria-hidden="true"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
