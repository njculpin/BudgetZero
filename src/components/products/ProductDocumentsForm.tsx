import { createSignal, Show, For, createEffect, createResource } from "solid-js";
import {
  ErrorMessage,
  SuccessMessage,
} from "@/components/interactive";
import "./product-documents-form.css";

export interface ProductDocument {
  id: string;
  product_id: string;
  document_id: string;
  price_cents: number;
  position: number;
  document: {
    id: string;
    handle: string;
    title: string;
    description: string;
  };
}

export interface ProductDocumentsFormProps {
  productId: string;
  userId: string;
  existingDocuments: ProductDocument[];
}

// Helper to format cents to dollars
const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export default function ProductDocumentsForm(props: ProductDocumentsFormProps) {
  const [documents, setDocuments] = createSignal<ProductDocument[]>(props.existingDocuments);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");
  const [editingDocId, setEditingDocId] = createSignal<string | null>(null);
  const [editPrice, setEditPrice] = createSignal("");
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [selectedDocument, setSelectedDocument] = createSignal<any>(null);
  const [addDocumentPrice, setAddDocumentPrice] = createSignal("0.00");
  const [mounted, setMounted] = createSignal(false);

  createEffect(() => {
    setMounted(true);
  });

  // Update documents when props change
  createEffect(() => {
    setDocuments(props.existingDocuments);
  });

  // Fetch user's available documents
  const [availableDocs] = createResource(
    () => mounted() && showAddModal(),
    async () => {
      const response = await fetch(`/api/documents/user-documents?userId=${props.userId}`);
      if (!response.ok) return [];
      const data = await response.json();
      // Filter out documents already attached to this product
      const attachedDocIds = documents().map(d => d.document_id);
      return data.documents.filter((doc: any) => !attachedDocIds.includes(doc.id));
    }
  );

  const handleSelectDocument = (doc: any) => {
    setSelectedDocument(doc);
    setAddDocumentPrice("0.00");
  };

  const handleCancelAddDocument = () => {
    setSelectedDocument(null);
    setAddDocumentPrice("0.00");
  };

  const handleConfirmAddDocument = async () => {
    const doc = selectedDocument();
    if (!doc) return;

    const priceValue = parseFloat(addDocumentPrice());
    if (isNaN(priceValue) || priceValue < 0) {
      setError("Please enter a valid price");
      return;
    }

    const priceCents = Math.round(priceValue * 100);

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/add-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: props.productId,
          documentId: doc.id,
          priceCents: priceCents,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add document");
        return;
      }

      const result = await response.json();

      // Reactively add the new document to the list
      setDocuments([...documents(), result.productDocument]);
      setSuccess("Document added successfully!");
      setShowAddModal(false);
      setSelectedDocument(null);
      setAddDocumentPrice("0.00");

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleRemoveDocument = async (productDocId: string) => {
    if (!confirm("Remove this document from the product?")) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/products/remove-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productDocumentId: productDocId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to remove document");
        return;
      }

      // Reactively remove the document from the list
      setDocuments(documents().filter(doc => doc.id !== productDocId));
      setSuccess("Document removed successfully!");

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleStartEditPrice = (doc: ProductDocument) => {
    setEditingDocId(doc.id);
    setEditPrice((doc.price_cents / 100).toFixed(2));
  };

  const handleSavePrice = async (productDocId: string) => {
    const priceValue = parseFloat(editPrice());
    if (isNaN(priceValue) || priceValue < 0) {
      setError("Please enter a valid price");
      return;
    }

    const priceCents = Math.round(priceValue * 100);

    try {
      const response = await fetch("/api/products/update-document-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDocumentId: productDocId,
          priceCents: priceCents,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update price");
        return;
      }

      // Reactively update the price in the documents list
      setDocuments(documents().map(doc =>
        doc.id === productDocId
          ? { ...doc, price_cents: priceCents }
          : doc
      ));

      setSuccess("Price updated successfully!");
      setEditingDocId(null);

      // Auto-dismiss success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleCancelEditPrice = () => {
    setEditingDocId(null);
    setEditPrice("");
  };

  return (
    <div class="product-documents-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="product-documents-form__header">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          class="product-documents-form__add-button"
        >
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Document</span>
        </button>
      </div>

      <Show when={documents().length > 0} fallback={
        <div class="product-documents-form__empty">
          <p>No documents attached to this product yet</p>
          <p class="product-documents-form__empty-hint">
            Click "Add Document" to attach existing documents to this product
          </p>
        </div>
      }>
        <div class="document-list">
          <For each={documents()}>
            {(doc) => (
              <div class="document-list__item">
                <div class="document-list__info">
                  <div class="document-list__title">
                    <a href={`/documents/${doc.document.handle}`} target="_blank">
                      📄 {doc.document.title}
                    </a>
                  </div>
                  <Show when={doc.document.description}>
                    <div class="document-list__description">
                      {doc.document.description}
                    </div>
                  </Show>
                </div>

                <div class="document-list__actions">
                  <Show
                    when={editingDocId() === doc.id}
                    fallback={
                      <div class="document-list__price">
                        <span class="document-list__price-value">
                          {formatPrice(doc.price_cents)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEditPrice(doc)}
                          class="document-list__edit-button"
                        >
                          Edit Price
                        </button>
                      </div>
                    }
                  >
                    <div class="document-list__price-edit">
                      <label class="document-list__price-label">
                        Price ($)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrice()}
                          onInput={(e) => setEditPrice(e.currentTarget.value)}
                          class="document-list__price-input"
                          placeholder="0.00"
                        />
                      </label>
                      <div class="document-list__price-actions">
                        <button
                          type="button"
                          onClick={() => handleSavePrice(doc.id)}
                          class="document-list__save-price"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditPrice}
                          class="document-list__cancel-price"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </Show>

                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(doc.id)}
                    class="document-list__remove-button"
                    title="Remove document from product"
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
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Add Document Modal */}
      <Show when={showAddModal()}>
        <div class="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">Add Document to Product</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                class="modal-close"
              >
                ×
              </button>
            </div>

            <div class="modal-body">
              <Show
                when={!availableDocs.loading}
                fallback={<p>Loading your documents...</p>}
              >
                <Show
                  when={availableDocs() && availableDocs()!.length > 0}
                  fallback={
                    <div class="modal-empty">
                      <p>No documents available to add</p>
                      <a href="/api/documents/create-document" class="modal-create-link">
                        Create a new document
                      </a>
                    </div>
                  }
                >
                  <div class="available-docs-list">
                    <For each={availableDocs()}>
                      {(doc: any) => (
                        <div class="available-docs-list__item"
                             classList={{ "available-docs-list__item--selected": selectedDocument()?.id === doc.id }}>
                          <div class="available-docs-list__info">
                            <div class="available-docs-list__title">
                              📄 {doc.title}
                            </div>
                            <Show when={doc.description}>
                              <div class="available-docs-list__description">
                                {doc.description}
                              </div>
                            </Show>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectDocument(doc)}
                            class="available-docs-list__add-button"
                          >
                            {selectedDocument()?.id === doc.id ? "Selected" : "Select"}
                          </button>
                        </div>
                      )}
                    </For>
                  </div>

                  {/* Price input section when document is selected */}
                  <Show when={selectedDocument()}>
                    <div class="add-document-price">
                      <h4 class="add-document-price__title">Set Price for "{selectedDocument()!.title}"</h4>
                      <div class="add-document-price__input-group">
                        <label class="add-document-price__label">
                          Price ($):
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={addDocumentPrice()}
                            onInput={(e) => setAddDocumentPrice(e.currentTarget.value)}
                            class="add-document-price__input"
                            placeholder="0.00"
                          />
                        </label>
                      </div>
                      <div class="add-document-price__actions">
                        <button
                          type="button"
                          onClick={handleConfirmAddDocument}
                          class="add-document-price__confirm"
                        >
                          Add Document
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelAddDocument}
                          class="add-document-price__cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </Show>
                </Show>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
