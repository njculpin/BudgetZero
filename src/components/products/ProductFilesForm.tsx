import { createSignal, Show, For, createEffect } from "solid-js";
import {
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import "./product-files-form.css";

export interface ProductFile {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  position: number;
  price_cents: number;
}

export interface ProductFilesFormProps {
  productId: string;
  existingFiles: ProductFile[];
}

interface UploadProgress {
  file: File;
  progress: number;
}

interface PendingFile {
  file: File;
  price: string;
}

const MAX_FILES = 20;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Helper to get file icon based on mime type
const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
  if (mimeType.includes('stl') || mimeType.includes('obj') || mimeType.includes('3d')) return '🧊';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('text')) return '📝';
  return '📁';
};

// Helper to format cents to dollars
const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export default function ProductFilesForm(props: ProductFilesFormProps) {
  const [files, setFiles] = createSignal<ProductFile[]>(props.existingFiles);
  const [uploadQueue, setUploadQueue] = createSignal<UploadProgress[]>([]);
  const [pendingFiles, setPendingFiles] = createSignal<PendingFile[]>([]);
  const [hasReordered, setHasReordered] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = createSignal(false);
  const [editingFileId, setEditingFileId] = createSignal<string | null>(null);
  const [editPrice, setEditPrice] = createSignal("");

  // Update files when props change
  createEffect(() => {
    setFiles(props.existingFiles);
  });

  const availableSlots = () => MAX_FILES - files().length;

  // Handle file drop on drop zone
  const handleFileDrop = async (e: DragEvent) => {
    e.preventDefault();

    // If we're dragging a file item (not new files), don't handle it here
    if (draggedIndex() !== null) {
      setIsDraggingFiles(false);
      return;
    }

    setIsDraggingFiles(false);

    const droppedFiles = e.dataTransfer?.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    await handleFiles(Array.from(droppedFiles));
  };

  // Handle file selection
  const handleFileSelect = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    await handleFiles(Array.from(input.files));
    input.value = ''; // Reset input
  };

  // Process and show files for review with price inputs
  const handleFiles = async (selectedFiles: File[]) => {
    // Validate file sizes
    const invalidFiles = selectedFiles.filter(f => f.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      setError(`Some files exceed ${formatFileSize(MAX_FILE_SIZE)} limit`);
      return;
    }

    const available = availableSlots();
    if (selectedFiles.length > available) {
      setError(`Can only upload ${available} more file(s). Maximum is ${MAX_FILES}.`);
      return;
    }

    setError("");

    // Add files to pending list with default price
    const pending: PendingFile[] = selectedFiles.map((file) => ({
      file,
      price: "0.00",
    }));

    setPendingFiles(pending);
  };

  // Update price for a pending file
  const updatePendingFilePrice = (index: number, price: string) => {
    setPendingFiles(pendingFiles().map((pf, i) =>
      i === index ? { ...pf, price } : pf
    ));
  };

  // Remove a file from pending list
  const removePendingFile = (index: number) => {
    setPendingFiles(pendingFiles().filter((_, i) => i !== index));
  };

  // Confirm and upload all pending files
  const confirmUpload = async () => {
    await uploadFiles(pendingFiles());
  };

  const uploadFiles = async (pendingFileList: PendingFile[]) => {
    try {
      // Create upload progress items
      const uploads: UploadProgress[] = pendingFileList.map((pf) => ({
        file: pf.file,
        progress: 0,
      }));
      setUploadQueue(uploads);

      const formData = new FormData();
      formData.append("productId", props.productId);

      pendingFileList.forEach((pf) => {
        formData.append("files", pf.file);
      });

      const response = await fetch("/api/products/upload-files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload files");
        setUploadQueue([]);
        return;
      }

      const result = await response.json();

      // Update prices for uploaded files
      const uploadedFiles = result.files;
      for (let i = 0; i < uploadedFiles.length; i++) {
        const pendingFile = pendingFileList[i];
        const uploadedFile = uploadedFiles[i];
        const priceCents = Math.round(parseFloat(pendingFile.price) * 100);

        // If price is non-zero, update it
        if (priceCents > 0) {
          await fetch("/api/products/update-file-price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileId: uploadedFile.id,
              priceCents
            }),
          });
          // Update the local file object with the price
          uploadedFile.price_cents = priceCents;
        }
      }

      // Reactively add uploaded files to the list
      setFiles([...files(), ...uploadedFiles]);
      setSuccess("Files uploaded successfully!");
      setUploadQueue([]);
      setPendingFiles([]);

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Unable to upload files. Please check your internet connection and try again.");
      setUploadQueue([]);
    }
  };

  // Handle file reordering
  const handleDragStart = (e: DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedIndex(index);
    setIsDraggingFiles(false);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow drop if we're dragging a file item (not new files)
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

  const handleFileDrop2 = (e: DragEvent, dropIndex: number) => {
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

      const response = await fetch("/api/products/reorder-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
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
      setError("Unable to save file order. Please try again.");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete file");
        return;
      }

      // Reactively remove the file from the list
      setFiles(files().filter(f => f.id !== fileId));
      setSuccess("File deleted successfully!");

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Unable to delete file. Please try again.");
    }
  };

  const handleStartEditPrice = (file: ProductFile) => {
    setEditingFileId(file.id);
    setEditPrice((file.price_cents / 100).toFixed(2));
  };

  const handleCancelEditPrice = () => {
    setEditingFileId(null);
    setEditPrice("");
  };

  const handleSavePrice = async (fileId: string) => {
    setError("");
    setSuccess("");

    const priceValue = parseFloat(editPrice());
    if (isNaN(priceValue) || priceValue < 0) {
      setError("Please enter a valid price");
      return;
    }

    const priceCents = Math.round(priceValue * 100);

    try {
      const response = await fetch("/api/products/update-file-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          priceCents
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update file price");
        return;
      }

      // Reactively update the price in the files list
      setFiles(files().map(f =>
        f.id === fileId
          ? { ...f, price_cents: priceCents }
          : f
      ));

      setSuccess("Price updated successfully!");
      setEditingFileId(null);
      setEditPrice("");

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Unable to update price. Please try again.");
    }
  };

  return (
    <div class="file-list-editor">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      {/* Pending files for upload with price inputs */}
      <Show when={pendingFiles().length > 0}>
        <div class="pending-files">
          <h3 class="pending-files__title">Set Prices for New Files</h3>
          <div class="pending-files__list">
            <For each={pendingFiles()}>
              {(pendingFile, index) => (
                <div class="pending-files__item">
                  <div class="pending-files__icon">
                    {getFileIcon(pendingFile.file.type)}
                  </div>
                  <div class="pending-files__info">
                    <div class="pending-files__name">{pendingFile.file.name}</div>
                    <div class="pending-files__meta">
                      {formatFileSize(pendingFile.file.size)}
                    </div>
                  </div>
                  <div class="pending-files__price">
                    <label class="pending-files__price-label">
                      Price ($):
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pendingFile.price}
                        onInput={(e) => updatePendingFilePrice(index(), e.currentTarget.value)}
                        class="pending-files__price-input"
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingFile(index())}
                    class="pending-files__remove"
                    aria-label={`Remove ${pendingFile.file.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>
          <div class="pending-files__actions">
            <button
              type="button"
              onClick={confirmUpload}
              class="pending-files__upload-button"
            >
              Upload All ({pendingFiles().length} file{pendingFiles().length !== 1 ? 's' : ''})
            </button>
            <button
              type="button"
              onClick={() => setPendingFiles([])}
              class="pending-files__cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </Show>

      <div
        class="file-list"
        classList={{ "file-list--dragging": isDraggingFiles() }}
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
        {/* Empty state when no files */}
        <Show when={files().length === 0 && uploadQueue().length === 0}>
          <div class="file-list__empty">
            <div class="file-list__empty-icon">📦</div>
            <p class="file-list__empty-text">
              No files uploaded yet. Add files to make this product available for purchase.
            </p>
            <p class="file-list__empty-hint">
              Drag & drop files below or click to upload
            </p>
          </div>
        </Show>

        {/* Render existing files */}
        <For each={files()}>
          {(file, index) => (
            <div
              class="file-list__item"
              classList={{
                "file-list__item--dragging": draggedIndex() === index(),
                "file-list__item--drag-over": dragOverIndex() === index(),
              }}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index())}
              onDragOver={(e) => handleDragOver(e, index())}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleFileDrop2(e, index())}
              onDragEnd={handleDragEnd}
            >
              <div class="file-list__drag-handle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="4" y1="8" x2="20" y2="8"/>
                  <line x1="4" y1="16" x2="20" y2="16"/>
                </svg>
              </div>
              <div class="file-list__icon">
                {getFileIcon(file.mime_type)}
              </div>
              <div class="file-list__info">
                <div class="file-list__name">{file.title}</div>
                <div class="file-list__meta">
                  {formatFileSize(file.file_size_bytes)} • {file.mime_type}
                </div>
                {file.description && (
                  <div class="file-list__description">{file.description}</div>
                )}
                <Show when={editingFileId() === file.id} fallback={
                  <div class="file-list__price">
                    <span class="file-list__price-label">Price:</span>
                    <span class="file-list__price-value">{formatPrice(file.price_cents)}</span>
                    <button
                      type="button"
                      onClick={() => handleStartEditPrice(file)}
                      class="file-list__edit-price"
                      aria-label="Edit price"
                    >
                      Edit
                    </button>
                  </div>
                }>
                  <div class="file-list__price-edit">
                    <label class="file-list__price-edit-label">
                      <span>Price ($):</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPrice()}
                        onInput={(e) => setEditPrice(e.currentTarget.value)}
                        class="file-list__price-input"
                        placeholder="0.00"
                      />
                    </label>
                    <div class="file-list__price-actions">
                      <button
                        type="button"
                        onClick={() => handleSavePrice(file.id)}
                        class="file-list__save-price"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditPrice}
                        class="file-list__cancel-price"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Show>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteFile(file.id)}
                class="file-list__delete"
                aria-label={`Delete ${file.title}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          )}
        </For>

        {/* Render upload progress placeholders */}
        <For each={uploadQueue()}>
          {(upload) => (
            <div class="file-list__item file-list__item--uploading">
              <div class="file-list__icon">
                {getFileIcon(upload.file.type)}
              </div>
              <div class="file-list__info">
                <div class="file-list__name">{upload.file.name}</div>
                <div class="file-list__progress">
                  <div class="file-list__progress-bar">
                    <div
                      class="file-list__progress-fill"
                      style={`width: ${upload.progress}%`}
                    />
                  </div>
                  <span class="file-list__progress-text">Uploading...</span>
                </div>
              </div>
            </div>
          )}
        </For>

        {/* Upload area */}
        {availableSlots() > 0 && (
          <label class="file-list__upload">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              class="file-list__input"
            />
            <div class="file-list__upload-content">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span class="file-list__upload-text">
                Drop files here or click to upload
              </span>
              <span class="file-list__upload-hint">
                PDFs, ZIPs, STLs, images, etc. • Max {formatFileSize(MAX_FILE_SIZE)} per file
              </span>
            </div>
          </label>
        )}
      </div>

      <Show when={hasReordered()}>
        <div class="file-list-editor__actions">
          <button
            type="button"
            onClick={handleSaveOrder}
            class="file-list-editor__save-button"
          >
            Save Order
          </button>
        </div>
      </Show>

      <p class="file-list-editor__help">
        {files().length} of {MAX_FILES} files • Drag files to reorder • Purchasers will receive all files
      </p>
    </div>
  );
}
