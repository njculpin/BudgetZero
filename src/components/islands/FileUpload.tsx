import { createSignal } from "solid-js";
import { FileUploadField, ErrorMessage, SuccessMessage } from "./base";
import "./base/base.css";
import "./FileUpload.css";
import type { StorageBucket } from "@/lib/storage";

export interface UploadedFile {
  path: string;
  url: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  label: string;
  name: string;
  bucket: StorageBucket;
  prefix?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  required?: boolean;
  helpText?: string;
  showPreview?: boolean;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUpload(props: FileUploadProps) {
  const [isUploading, setIsUploading] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setError("");
    setSuccess("");
    setIsUploading(true);
    setUploadProgress(0);

    const results: UploadedFile[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", props.bucket);
        if (props.prefix) {
          formData.append("prefix", props.prefix);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        const data = await response.json();
        results.push(data.file);

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      setSuccess(
        `Successfully uploaded ${results.length} file${
          results.length > 1 ? "s" : ""
        }`
      );
      setIsUploading(false);

      if (props.onUploadComplete) {
        props.onUploadComplete(results);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      setIsUploading(false);

      if (props.onUploadError) {
        props.onUploadError(errorMessage);
      }
    }
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div class="file-upload-wrapper">
      {error() && (
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      )}

      {success() && (
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      )}

      <FileUploadField
        label={props.label}
        name={props.name}
        accept={props.accept}
        multiple={props.multiple}
        maxSizeMB={props.maxSizeMB}
        required={props.required}
        disabled={isUploading()}
        helpText={props.helpText}
        showPreview={props.showPreview}
        onFilesSelected={handleFilesSelected}
        onError={handleFileError}
      />

      {isUploading() && (
        <div class="upload-progress">
          <div class="upload-progress__bar">
            <div
              class="upload-progress__fill"
              style={{ width: `${uploadProgress()}%` }}
            />
          </div>
          <p class="upload-progress__text">Uploading... {uploadProgress()}%</p>
        </div>
      )}
    </div>
  );
}
