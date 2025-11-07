import { createSignal, Show } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";
import "./product-images-form.css";

export interface ProductImagesFormProps {
  productId: string;
  currentCoverImage: string | null;
}

export default function ProductImagesForm(props: ProductImagesFormProps) {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleFileSelect = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!selectedFile()) {
      setError("Please select an image to upload");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("coverImage", selectedFile()!);

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload image");
        setIsLoading(false);
        return;
      }

      setSuccess("Cover image updated successfully! Refreshing...");
      setIsLoading(false);

      // Reload page to show new image
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div class="product-images-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      {/* Current Cover Image */}
      <Show when={props.currentCoverImage && !previewUrl()}>
        <div class="product-images-form__current">
          <h4 class="product-images-form__label">Current Cover Image</h4>
          <div class="product-images-form__preview">
            <img
              src={props.currentCoverImage!}
              alt="Current cover"
              class="product-images-form__image"
            />
          </div>
        </div>
      </Show>

      {/* Preview New Image */}
      <Show when={previewUrl()}>
        <div class="product-images-form__current">
          <h4 class="product-images-form__label">New Cover Image Preview</h4>
          <div class="product-images-form__preview">
            <img
              src={previewUrl()!}
              alt="New cover preview"
              class="product-images-form__image"
            />
          </div>
        </div>
      </Show>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} class="product-form">
        <div class="form-field">
          <label for="cover-image-upload" class="form-field__label">
            {props.currentCoverImage ? "Replace Cover Image" : "Add Cover Image"}
          </label>
          <div class="upload-zone">
            <div class="upload-zone__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div class="upload-zone__text">
              <p class="upload-zone__primary">Click to upload or drag and drop</p>
              <p class="upload-zone__secondary">PNG, JPG, JPEG up to 10MB</p>
            </div>
            <input
              id="cover-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isLoading()}
              class="upload-zone__input"
            />
          </div>
          <Show when={selectedFile()}>
            <p class="form-field__help-text">
              Selected: {selectedFile()!.name} ({(selectedFile()!.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </Show>
        </div>

        <Show when={selectedFile()}>
          <div class="product-form__actions">
            <LoadingButton
              type="submit"
              isLoading={isLoading()}
              loadingText="Uploading..."
            >
              Upload Cover Image
            </LoadingButton>
          </div>
        </Show>
      </form>
    </div>
  );
}
