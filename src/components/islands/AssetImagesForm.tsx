import { createSignal, Show, For } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";

export interface AssetImage {
  id: string;
  title: string;
  file_url: string;
}

export interface AssetImagesFormProps {
  assetId: string;
  existingImages: AssetImage[];
}

export default function AssetImagesForm(props: AssetImagesFormProps) {
  const [images, setImages] = createSignal<AssetImage[]>(props.existingImages);
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

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images()];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === images().length - 1) return;
    const newImages = [...images()];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (selectedFiles().length === 0) {
      setError("Please select at least one image to upload");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("assetId", props.assetId);

      // Append new images
      selectedFiles().forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch("/api/assets/update-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload images");
        setIsLoading(false);
        return;
      }

      setSuccess("Images uploaded successfully!");
      setIsLoading(false);
      setSelectedFiles([]);

      // Reload page to show new images
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div class="asset-images-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <Show when={images().length > 0}>
        <div class="asset-images-form__existing">
          <h4 class="asset-images-form__existing-title">
            Current Images ({images().length})
          </h4>
          <p class="asset-images-form__existing-description">
            Reorder images by using the up/down arrows. The first image will be used as the cover.
          </p>
          <div class="asset-images-form__grid">
            <For each={images()}>
              {(image, index) => (
                <div class="asset-images-form__item">
                  <div class="asset-images-form__image-wrapper">
                    <img
                      src={image.file_url}
                      alt={image.title}
                      class="asset-images-form__image"
                    />
                    {index() === 0 && (
                      <span class="asset-images-form__cover-badge">Cover</span>
                    )}
                  </div>
                  <div class="asset-images-form__controls">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index())}
                      disabled={index() === 0}
                      class="asset-images-form__button"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index())}
                      disabled={index() === images().length - 1}
                      class="asset-images-form__button"
                      title="Move down"
                    >
                      ↓
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
          <label class="form-field__label">Add More Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            disabled={isLoading()}
            class="form-field__file-input"
          />
          <p class="form-field__help-text">
            Upload cover images, previews, or screenshots of your asset
          </p>
          <Show when={selectedFiles().length > 0}>
            <p class="asset-images-form__selected">
              Selected {selectedFiles().length} image(s)
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
            Upload Images
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
