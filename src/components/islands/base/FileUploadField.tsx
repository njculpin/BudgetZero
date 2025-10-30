import { createSignal, Show, For } from "solid-js";

export interface FileUploadFieldProps {
  label: string;
  name: string;
  id?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  onFilesSelected: (files: File[]) => void;
  onError?: (error: string) => void;
  showPreview?: boolean;
}

export default function FileUploadField(props: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([]);
  const [previewUrls, setPreviewUrls] = createSignal<string[]>([]);

  const fieldId = props.id || props.name;
  const maxSizeBytes = (props.maxSizeMB || 10) * 1024 * 1024;

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      // Check file size
      if (file.size > maxSizeBytes) {
        return `File "${file.name}" exceeds ${props.maxSizeMB || 10}MB limit`;
      }

      // Check file type if accept is specified
      if (props.accept) {
        const acceptedTypes = props.accept.split(",").map((t) => t.trim());
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            const category = type.split("/")[0];
            return file.type.startsWith(category + "/");
          }
          return file.type === type;
        });

        if (!isAccepted) {
          return `File "${file.name}" type is not accepted`;
        }
      }
    }
    return null;
  };

  const createPreviews = (files: File[]) => {
    if (!props.showPreview) return;

    const urls: string[] = [];
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        urls.push(url);
      }
    });
    setPreviewUrls(urls);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validationError = validateFiles(fileArray);

    if (validationError) {
      if (props.onError) {
        props.onError(validationError);
      }
      return;
    }

    setSelectedFiles(fileArray);
    createPreviews(fileArray);
    props.onFilesSelected(fileArray);
  };

  const handleChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    handleFiles(input.files);
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    handleFiles(e.dataTransfer?.files || null);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles().filter((_, i) => i !== index);
    const newUrls = previewUrls().filter((_, i) => i !== index);

    // Revoke old URL to prevent memory leaks
    if (previewUrls()[index]) {
      URL.revokeObjectURL(previewUrls()[index]);
    }

    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    props.onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div class="form-field">
      <label for={fieldId} class="form-field__label">
        {props.label}
        {props.required && <span class="form-field__required">*</span>}
      </label>

      <div
        class={`file-upload ${isDragging() ? "file-upload--dragging" : ""} ${
          props.error ? "file-upload--error" : ""
        } ${props.disabled ? "file-upload--disabled" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={fieldId}
          name={props.name}
          class="file-upload__input"
          accept={props.accept}
          multiple={props.multiple}
          required={props.required}
          disabled={props.disabled}
          onChange={handleChange}
          aria-invalid={props.error ? "true" : "false"}
          aria-describedby={
            props.error
              ? `${fieldId}-error`
              : props.helpText
                ? `${fieldId}-help`
                : undefined
          }
        />

        <div class="file-upload__content">
          <svg
            class="file-upload__icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div class="file-upload__text">
            <p class="file-upload__primary">
              <span class="file-upload__link">Click to upload</span> or drag and
              drop
            </p>
            <p class="file-upload__secondary">
              {props.accept ? `Accepted: ${props.accept}` : "Any file type"}
              {" • "}
              Max {props.maxSizeMB || 10}MB
            </p>
          </div>
        </div>
      </div>

      <Show when={selectedFiles().length > 0}>
        <div class="file-upload__files">
          <For each={selectedFiles()}>
            {(file, index) => (
              <div class="file-upload__file">
                <Show when={props.showPreview && previewUrls()[index()]}>
                  <img
                    src={previewUrls()[index()]}
                    alt={file.name}
                    class="file-upload__preview"
                  />
                </Show>

                <div class="file-upload__file-info">
                  <p class="file-upload__file-name">{file.name}</p>
                  <p class="file-upload__file-size">{formatFileSize(file.size)}</p>
                </div>

                <button
                  type="button"
                  class="file-upload__remove"
                  onClick={() => handleRemoveFile(index())}
                  disabled={props.disabled}
                  aria-label={`Remove ${file.name}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {props.error && (
        <p id={`${fieldId}-error`} class="form-field__error" role="alert">
          {props.error}
        </p>
      )}

      {props.helpText && !props.error && (
        <p id={`${fieldId}-help`} class="form-field__help">
          {props.helpText}
        </p>
      )}
    </div>
  );
}
