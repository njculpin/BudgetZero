import { createSignal, Show, For, createResource } from "solid-js";
import Modal from "@/components/Modal";
import { LoadingButton } from "@/components/interactive";
import type { ProductFile } from "@/types";
import type { EmbeddedProductData, ProductDocumentRelation } from "./ContentItem";

type ContentType = "file" | "document" | "embedded" | null;

export interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  userId: string;
  onFilesAdded: (files: ProductFile[]) => void;
  onDocumentAdded: (document: ProductDocumentRelation) => void;
  onProductEmbedded: (product: EmbeddedProductData) => void;
}

interface PendingFile {
  file: File;
  title: string;
  price: string;
}

export default function AddContentModal(props: AddContentModalProps) {
  const [selectedType, setSelectedType] = createSignal<ContentType>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);

  // File upload state
  const [pendingFiles, setPendingFiles] = createSignal<PendingFile[]>([]);

  // Document attachment state
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedDocId, setSelectedDocId] = createSignal<string | null>(null);
  const [docPrice, setDocPrice] = createSignal("0.00");

  // Product embedding state
  const [productSearch, setProductSearch] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<any[]>([]);

  // Fetch user's documents
  const [userDocuments] = createResource(
    () => selectedType() === "document" && props.userId,
    async (userId) => {
      try {
        const response = await fetch(`/api/users/${userId}/documents`);
        if (!response.ok) throw new Error("Failed to fetch documents");
        const data = await response.json();
        return data.documents || [];
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    }
  );

  const handleClose = () => {
    setSelectedType(null);
    setPendingFiles([]);
    setSelectedDocId(null);
    setDocPrice("0.00");
    setProductSearch("");
    setSearchResults([]);
    setError(null);
    setSuccess(null);
    props.onClose();
  };

  // ===== File Upload Handlers =====
  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles: PendingFile[] = Array.from(input.files).map((file) => ({
      file,
      title: file.name,
      price: "0.00",
    }));

    setPendingFiles([...pendingFiles(), ...newFiles]);
    input.value = "";
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFilePrice = (index: number, price: string) => {
    setPendingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, price } : f))
    );
  };

  const handleUploadFiles = async () => {
    if (pendingFiles().length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);

      pendingFiles().forEach((pf, index) => {
        formData.append(`files`, pf.file);
        formData.append(`prices`, String(Math.round(parseFloat(pf.price) * 100)));
        formData.append(`titles`, pf.title);
      });

      const response = await fetch("/api/products/upload-files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload files");

      const data = await response.json();
      props.onFilesAdded(data.files);
      setSuccess(`${pendingFiles().length} file(s) uploaded successfully`);
      setPendingFiles([]);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Document Attachment Handlers =====
  const handleCreateDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/create-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: props.userId,
          title: "Untitled Document",
          productId: props.productId,
          priceCents: 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to create document");

      const data = await response.json();
      props.onDocumentAdded(data.productDocument);
      setSuccess("Document created and attached");

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachDocument = async () => {
    const docId = selectedDocId();
    if (!docId) return;

    setIsLoading(true);
    setError(null);

    try {
      const priceCents = Math.round(parseFloat(docPrice()) * 100);

      const response = await fetch("/api/products/add-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
          documentId: docId,
          priceCents,
        }),
      });

      if (!response.ok) throw new Error("Failed to attach document");

      const data = await response.json();
      props.onDocumentAdded(data.productDocument);
      setSuccess("Document attached successfully");

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach document");
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Product Embedding Handlers =====
  const handleSearchProducts = async () => {
    const query = productSearch();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/products/search-embeddable?q=${encodeURIComponent(query)}&userId=${props.userId}`
      );

      if (!response.ok) throw new Error("Failed to search products");

      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmbedProduct = async (childProductId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products/embed-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
          childProductId,
        }),
      });

      if (!response.ok) throw new Error("Failed to embed product");

      const data = await response.json();
      props.onProductEmbedded(data.embeddedProduct);
      setSuccess("Product embedded successfully");

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to embed product");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = () => {
    const docs = userDocuments() || [];
    const query = searchQuery().toLowerCase();
    return docs.filter((d: any) =>
      d.title.toLowerCase().includes(query)
    );
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title={
        selectedType()
          ? `Add ${
              selectedType() === "file"
                ? "Files"
                : selectedType() === "document"
                ? "Document"
                : "Product"
            }`
          : "Add Content"
      }
      size="lg"
    >
      <div class="add-content-modal">
        {/* Error/Success Messages */}
        <Show when={error()}>
          <div class="add-content-modal__error">{error()}</div>
        </Show>

        <Show when={success()}>
          <div class="add-content-modal__success">{success()}</div>
        </Show>

        {/* Type Selector */}
        <Show when={!selectedType()}>
          <div class="add-content-modal__type-selector">
            <button
              type="button"
              class="add-content-modal__type-card"
              onClick={() => setSelectedType("file")}
            >
              <span class="add-content-modal__type-icon">📁</span>
              <span class="add-content-modal__type-label">Upload Files</span>
              <span class="add-content-modal__type-description">
                Add downloadable files (PDFs, ZIPs, STLs, etc.)
              </span>
            </button>

            <button
              type="button"
              class="add-content-modal__type-card"
              onClick={() => setSelectedType("document")}
            >
              <span class="add-content-modal__type-icon">📄</span>
              <span class="add-content-modal__type-label">Attach Document</span>
              <span class="add-content-modal__type-description">
                Link a collaborative document to this product
              </span>
            </button>

            <button
              type="button"
              class="add-content-modal__type-card"
              onClick={() => setSelectedType("embedded")}
            >
              <span class="add-content-modal__type-icon">📦</span>
              <span class="add-content-modal__type-label">Embed Product</span>
              <span class="add-content-modal__type-description">
                Include another creator's product (automatic royalties)
              </span>
            </button>
          </div>
        </Show>

        {/* File Upload Form */}
        <Show when={selectedType() === "file"}>
          <div class="add-content-modal__form">
            {/* File Input */}
            <div class="add-content-modal__upload-area">
              <label class="add-content-modal__upload-label">
                <input
                  type="file"
                  multiple
                  class="add-content-modal__upload-input"
                  onChange={handleFileSelect}
                  accept=".pdf,.zip,.stl,.png,.jpg,.jpeg"
                />
                <div class="add-content-modal__upload-prompt">
                  <span class="add-content-modal__upload-icon">📁</span>
                  <span class="add-content-modal__upload-text">
                    Drop files here or click to upload
                  </span>
                  <span class="add-content-modal__upload-hint">
                    Supports PDF, ZIP, STL, PNG, JPG (max 100MB per file)
                  </span>
                </div>
              </label>
            </div>

            {/* Pending Files */}
            <Show when={pendingFiles().length > 0}>
              <div class="add-content-modal__pending-files">
                <h4 class="add-content-modal__pending-title">
                  Set Prices for New Files
                </h4>
                <For each={pendingFiles()}>
                  {(pf, index) => (
                    <div class="add-content-modal__pending-file">
                      <div class="add-content-modal__pending-file-info">
                        <span class="add-content-modal__pending-file-name">
                          {pf.file.name}
                        </span>
                        <span class="add-content-modal__pending-file-size">
                          {(pf.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div class="add-content-modal__pending-file-price">
                        <span>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pf.price}
                          onInput={(e) =>
                            handleUpdateFilePrice(index(), e.currentTarget.value)
                          }
                          class="add-content-modal__price-input"
                        />
                      </div>
                      <button
                        type="button"
                        class="add-content-modal__pending-file-remove"
                        onClick={() => handleRemovePendingFile(index())}
                        aria-label="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </For>
                <LoadingButton
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleUploadFiles}
                  isLoading={isLoading()}
                  loadingText="Uploading..."
                >
                  Upload All ({pendingFiles().length} files)
                </LoadingButton>
              </div>
            </Show>
          </div>
        </Show>

        {/* Document Attachment Form */}
        <Show when={selectedType() === "document"}>
          <div class="add-content-modal__form">
            <LoadingButton
              type="button"
              variant="secondary"
              size="md"
              onClick={handleCreateDocument}
              isLoading={isLoading()}
              loadingText="Creating..."
            >
              Create a new document
            </LoadingButton>

            <div class="add-content-modal__divider">
              <span>or select existing</span>
            </div>

            <input
              type="text"
              placeholder="Search your documents..."
              class="add-content-modal__search-input"
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />

            <Show
              when={!userDocuments.loading}
              fallback={<div>Loading documents...</div>}
            >
              <div class="add-content-modal__document-list">
                <For each={filteredDocuments()}>
                  {(doc: any) => (
                    <div
                      class="add-content-modal__document-item"
                      classList={{
                        "add-content-modal__document-item--selected":
                          selectedDocId() === doc.id,
                      }}
                      onClick={() => setSelectedDocId(doc.id)}
                    >
                      <div class="add-content-modal__document-info">
                        <span class="add-content-modal__document-title">
                          {doc.title}
                        </span>
                        <Show when={doc.description}>
                          <span class="add-content-modal__document-description">
                            {doc.description}
                          </span>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={selectedDocId()}>
              <div class="add-content-modal__price-section">
                <label class="add-content-modal__price-label">Price:</label>
                <div class="add-content-modal__price-input-wrapper">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={docPrice()}
                    onInput={(e) => setDocPrice(e.currentTarget.value)}
                    class="add-content-modal__price-input"
                  />
                </div>
              </div>
              <LoadingButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleAttachDocument}
                isLoading={isLoading()}
                loadingText="Attaching..."
              >
                Add Document
              </LoadingButton>
            </Show>
          </div>
        </Show>

        {/* Product Embedding Form */}
        <Show when={selectedType() === "embedded"}>
          <div class="add-content-modal__form">
            <div class="add-content-modal__search-section">
              <input
                type="text"
                placeholder="Search for products to embed..."
                class="add-content-modal__search-input"
                value={productSearch()}
                onInput={(e) => setProductSearch(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchProducts();
                }}
              />
              <LoadingButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleSearchProducts}
                isLoading={isLoading()}
                loadingText="Searching..."
              >
                Search
              </LoadingButton>
            </div>

            <Show when={searchResults().length > 0}>
              <div class="add-content-modal__search-results">
                <For each={searchResults()}>
                  {(product: any) => (
                    <div class="add-content-modal__search-result">
                      <div class="add-content-modal__search-result-info">
                        <span class="add-content-modal__search-result-title">
                          {product.title}
                        </span>
                        <span class="add-content-modal__search-result-creator">
                          by {product.creator_name}
                        </span>
                        <span class="add-content-modal__search-result-price">
                          ${(product.total_price / 100).toFixed(2)}
                        </span>
                      </div>
                      <LoadingButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEmbedProduct(product.id)}
                        isLoading={isLoading()}
                      >
                        Embed
                      </LoadingButton>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        {/* Back Button */}
        <Show when={selectedType()}>
          <button
            type="button"
            class="add-content-modal__back"
            onClick={() => setSelectedType(null)}
          >
            ← Back to type selection
          </button>
        </Show>
      </div>
    </Modal>
  );
}
