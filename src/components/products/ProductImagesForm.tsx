import { createSignal, Show, For, createEffect } from "solid-js";
import {
  ErrorMessage,
  SuccessMessage,
  LoadingButton,
} from "@/components/interactive";
import "./product-images-form.css";

export interface ProductImage {
  id: string;
  title: string;
  file_url: string;
}

export interface ProductImagesFormProps {
  productId: string;
  existingImages: ProductImage[];
}

interface UploadProgress {
  file: File;
  progress: number;
  preview: string;
}

const MAX_IMAGES = 9;

export default function ProductImagesForm(props: ProductImagesFormProps) {
  const [images, setImages] = createSignal<ProductImage[]>(props.existingImages);
  const [uploadQueue, setUploadQueue] = createSignal<UploadProgress[]>([]);
  const [hasReordered, setHasReordered] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = createSignal(false);

  // Update images when props change
  createEffect(() => {
    setImages(props.existingImages);
  });

  const totalSlots = () => MAX_IMAGES;
  const availableSlots = () => MAX_IMAGES - images().length;

  // Generate preview URL for file
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Handle file drop on drop zone
  const handleFileDrop = async (e: DragEvent) => {
    e.preventDefault();

    // If we're dragging an image (not files), don't handle it here
    if (draggedIndex() !== null) {
      setIsDraggingFiles(false);
      return;
    }

    setIsDraggingFiles(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    await handleFiles(Array.from(files));
  };

  // Handle file selection
  const handleFileSelect = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    await handleFiles(Array.from(input.files));
    input.value = ''; // Reset input
  };

  // Process and upload files
  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError("Please select image files only");
      return;
    }

    const available = availableSlots();
    if (imageFiles.length > available) {
      setError(`Can only upload ${available} more image(s). Maximum is ${MAX_IMAGES}.`);
      return;
    }

    setError("");

    // Create preview for each file
    const uploads: UploadProgress[] = await Promise.all(
      imageFiles.map(async (file) => ({
        file,
        progress: 0,
        preview: await createPreview(file),
      }))
    );

    setUploadQueue(uploads);

    // Upload files
    await uploadFiles(imageFiles);
  };

  const uploadFiles = async (files: File[]) => {
    try {
      const formData = new FormData();
      formData.append("productId", props.productId);

      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload images");
        setUploadQueue([]);
        return;
      }

      setSuccess("Images uploaded successfully!");
      setUploadQueue([]);

      // Reload page to show new images
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
      setUploadQueue([]);
    }
  };

  // Handle image reordering
  const handleDragStart = (e: DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedIndex(index);
    setIsDraggingFiles(false); // Not dragging files
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow drop if we're dragging an image (not files)
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

  const handleImageDrop = (e: DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    const dragIndex = draggedIndex();

    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images()];
    const [draggedImage] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    setImages(newImages);
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
      const imageOrders = images().map((image, index) => ({
        id: image.id,
        position: index,
      }));

      const response = await fetch("/api/products/reorder-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
          imageOrders,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save image order");
        return;
      }

      setSuccess("Image order saved successfully!");
      setHasReordered(false);
    } catch (err) {
      setError("An unexpected error occurred while saving order");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete image");
        return;
      }

      setSuccess("Image deleted successfully! Refreshing...");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred while deleting image");
    }
  };

  return (
    <div class="image-grid-editor">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      {/* Show grid only if there are images */}
      <Show when={images().length > 0 || uploadQueue().length > 0}>
        <div
          class="image-grid"
          classList={{ "image-grid--dragging": isDraggingFiles() }}
          onDragOver={(e) => {
            if (draggedIndex() === null) {
              e.preventDefault();
              setIsDraggingFiles(true);
            }
          }}
          onDragLeave={() => {
            if (draggedIndex() === null) {
              setIsDraggingFiles(false);
            }
          }}
          onDrop={handleFileDrop}
        >
          {/* Render existing images */}
          <For each={images()}>
            {(image, index) => (
              <div
                class="image-grid__item"
                classList={{
                  "image-grid__item--dragging": draggedIndex() === index(),
                  "image-grid__item--drag-over": dragOverIndex() === index(),
                  "image-grid__item--cover": index() === 0 && images().length > 1,
                }}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index())}
                onDragOver={(e) => handleDragOver(e, index())}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleImageDrop(e, index())}
                onDragEnd={handleDragEnd}
              >
                <img
                  src={image.file_url}
                  alt={image.title}
                  class="image-grid__image"
                />
                {index() === 0 && (
                  <span class="image-grid__badge">Cover</span>
                )}
                <div class="image-grid__overlay">
                  <LoadingButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteImage(image.id)}
                    aria-label={`Delete ${image.title}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </LoadingButton>
                </div>
                <div class="image-grid__drag-handle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="8" x2="20" y2="8"/>
                    <line x1="4" y1="16" x2="20" y2="16"/>
                  </svg>
                </div>
              </div>
            )}
          </For>

          {/* Render upload progress placeholders */}
          <For each={uploadQueue()}>
            {(upload) => (
              <div class="image-grid__item image-grid__item--uploading">
                <img
                  src={upload.preview}
                  alt="Uploading..."
                  class="image-grid__image"
                />
                <div class="image-grid__progress">
                  <div class="image-grid__progress-bar">
                    <div
                      class="image-grid__progress-fill"
                      style={`width: ${upload.progress}%`}
                    />
                  </div>
                  <span class="image-grid__progress-text">Uploading...</span>
                </div>
              </div>
            )}
          </For>
        </div>

        <Show when={images().length > 1}>
          <p class="image-grid-editor__help">
            Drag images to reorder • First image is the cover
          </p>
        </Show>

        <Show when={hasReordered()}>
          <div class="image-grid-editor__actions">
            <LoadingButton
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveOrder}
            >
              Save Order
            </LoadingButton>
          </div>
        </Show>
      </Show>

      {/* Upload button */}
      <Show when={availableSlots() > 0 && uploadQueue().length === 0}>
        <label class="image-grid-editor__upload-btn">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            class="image-grid__input"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>
            {images().length === 0 ? 'Add Images' : `Add More Images (${availableSlots()} remaining)`}
          </span>
        </label>
      </Show>

      <Show when={availableSlots() === 0}>
        <p class="image-grid-editor__limit">
          Maximum of {MAX_IMAGES} images reached
        </p>
      </Show>
    </div>
  );
}
