import { createSignal, createMemo, Show } from "solid-js";
import type { ProductFile } from "@/types";
import ContentList, { type SortOption } from "./ContentList";
import type {
  UnifiedItem,
  EmbeddedProductData,
  ProductDocumentRelation,
} from "./ContentItem";
import PricingBreakdown from "./PricingBreakdown";
import RevenuePreview from "./RevenuePreview";
import PurchaseActions from "./PurchaseActions";
import AddContentModal from "./AddContentModal";
import "./product-content-manager.css";

export interface ProductContentManagerProps {
  productId: string;
  productTitle: string;
  userId: string;
  isOwner: boolean;
  isAuthenticated: boolean;

  existingFiles: ProductFile[];
  existingDocuments: ProductDocumentRelation[];
  existingEmbeddedProducts: Array<{
    id: string;
    title: string;
    handle: string;
    inherited_price_cents: number;
    creator_name: string;
  }>;

  productOwnerId?: string;
  productOwnerHandle?: string;
  productOwnerName?: string;
}

export default function ProductContentManager(props: ProductContentManagerProps) {
  // Domain State
  const [files, setFiles] = createSignal<ProductFile[]>(props.existingFiles);
  const [documents, setDocuments] = createSignal<ProductDocumentRelation[]>(
    props.existingDocuments
  );
  const [embeddedProducts, setEmbeddedProducts] = createSignal<
    Array<EmbeddedProductData>
  >(
    props.existingEmbeddedProducts.map((p) => ({
      id: p.id,
      component_id: p.id,
      title: p.title,
      handle: p.handle,
      status: "public",
      inherited_price_cents: p.inherited_price_cents,
      creator_name: p.creator_name,
      creator_handle: "",
      file_count: 0,
    }))
  );

  // UI State
  const [sortBy, setSortBy] = createSignal<SortOption>("type");
  const [showAddModal, setShowAddModal] = createSignal(false);

  // Sort items helper function (must be defined before unifiedItems memo)
  const sortItems = (items: UnifiedItem[], sortOption: SortOption): UnifiedItem[] => {
    const sorted = [...items];
    switch (sortOption) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "price":
        return sorted.sort((a, b) => b.price - a.price);
      case "type":
      default:
        return sorted.sort((a, b) => {
          const typeOrder = { file: 0, document: 1, embedded: 2 };
          return typeOrder[a.type] - typeOrder[b.type] || a.position - b.position;
        });
    }
  };

  // Computed: Unified items for display
  const unifiedItems = createMemo<UnifiedItem[]>(() => {
    const fileItems: UnifiedItem[] = files().map((f) => ({
      id: f.id,
      type: "file" as const,
      name: f.title,
      price: f.price_cents,
      position: f.position,
      editable: props.isOwner,
      data: f,
    }));

    const docItems: UnifiedItem[] = documents().map((d) => ({
      id: d.id,
      type: "document" as const,
      name: d.document.title,
      price: d.price_cents,
      position: d.position,
      editable: props.isOwner,
      data: d,
    }));

    const embeddedItems: UnifiedItem[] = embeddedProducts().map((p) => ({
      id: p.id,
      type: "embedded" as const,
      name: p.title,
      price: p.inherited_price_cents,
      position: 999,
      editable: false,
      data: p,
    }));

    return sortItems([...fileItems, ...docItems, ...embeddedItems], sortBy());
  });

  // Computed: Total price
  const totalPrice = createMemo(() =>
    unifiedItems().reduce((sum, item) => sum + (item.price || 0), 0)
  );

  // Handlers
  const handleEditPrice = async (itemId: string, newPrice: number) => {
    const item = unifiedItems().find((i) => i.id === itemId);
    if (!item || !item.editable) return;

    try {
      if (item.type === "file") {
        const response = await fetch("/api/products/update-file-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: itemId, priceCents: newPrice }),
        });

        if (!response.ok) throw new Error("Failed to update file price");

        setFiles((prev) =>
          prev.map((f) => (f.id === itemId ? { ...f, price_cents: newPrice } : f))
        );
      } else if (item.type === "document") {
        const response = await fetch("/api/products/update-document-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: props.productId,
            documentId: itemId,
            priceCents: newPrice,
          }),
        });

        if (!response.ok) throw new Error("Failed to update document price");

        setDocuments((prev) =>
          prev.map((d) => (d.id === itemId ? { ...d, price_cents: newPrice } : d))
        );
      }
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Failed to update price");
    }
  };

  const handleDelete = async (itemId: string) => {
    const item = unifiedItems().find((i) => i.id === itemId);
    if (!item) return;

    try {
      if (item.type === "file") {
        const response = await fetch("/api/products/delete-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: itemId }),
        });

        if (!response.ok) throw new Error("Failed to delete file");

        setFiles((prev) => prev.filter((f) => f.id !== itemId));
      } else if (item.type === "document") {
        const response = await fetch("/api/products/remove-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: props.productId,
            documentId: itemId,
          }),
        });

        if (!response.ok) throw new Error("Failed to remove document");

        setDocuments((prev) => prev.filter((d) => d.id !== itemId));
      } else if (item.type === "embedded") {
        const embeddedData = item.data as EmbeddedProductData;
        const response = await fetch("/api/products/unembed-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: props.productId,
            componentId: embeddedData.component_id,
          }),
        });

        if (!response.ok) throw new Error("Failed to unembed product");

        setEmbeddedProducts((prev) => prev.filter((p) => p.id !== itemId));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const handleReorder = async (itemId: string, newPosition: number) => {
    const item = unifiedItems().find((i) => i.id === itemId);
    if (!item || item.type === "embedded") return;

    try {
      if (item.type === "file") {
        // Reorder files array
        const currentFiles = files();
        const itemIndex = currentFiles.findIndex((f) => f.id === itemId);
        if (itemIndex === -1) return;

        const reordered = [...currentFiles];
        const [removed] = reordered.splice(itemIndex, 1);
        reordered.splice(newPosition, 0, removed);

        // Update positions
        const updatedFiles = reordered.map((f, index) => ({
          ...f,
          position: index,
        }));

        setFiles(updatedFiles);

        // Save to API
        const response = await fetch("/api/products/reorder-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: props.productId,
            fileIds: updatedFiles.map((f) => f.id),
          }),
        });

        if (!response.ok) throw new Error("Failed to reorder files");
      } else if (item.type === "document") {
        // Similar logic for documents
        const currentDocs = documents();
        const itemIndex = currentDocs.findIndex((d) => d.id === itemId);
        if (itemIndex === -1) return;

        const reordered = [...currentDocs];
        const [removed] = reordered.splice(itemIndex, 1);
        reordered.splice(newPosition, 0, removed);

        const updatedDocs = reordered.map((d, index) => ({
          ...d,
          position: index,
        }));

        setDocuments(updatedDocs);

        // Save to API (assuming endpoint exists)
        const response = await fetch("/api/products/reorder-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: props.productId,
            documentIds: updatedDocs.map((d) => d.id),
          }),
        });

        if (!response.ok) throw new Error("Failed to reorder documents");
      }
    } catch (error) {
      console.error("Error reordering:", error);
      alert("Failed to reorder items");
    }
  };

  const handleAddContent = () => {
    setShowAddModal(true);
  };

  const handleFilesAdded = (newFiles: ProductFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDocumentAdded = (newDoc: ProductDocumentRelation) => {
    setDocuments((prev) => [...prev, newDoc]);
  };

  const handleProductEmbedded = (newProduct: EmbeddedProductData) => {
    setEmbeddedProducts((prev) => [...prev, newProduct]);
  };

  return (
    <div class="product-content-manager">
      {/* Content List */}
      <ContentList
        items={unifiedItems()}
        sortBy={sortBy()}
        onSortChange={setSortBy}
        onEditPrice={handleEditPrice}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onAddContent={handleAddContent}
        isOwner={props.isOwner}
      />

      {/* Pricing Breakdown */}
      <PricingBreakdown totalPrice={totalPrice()} />

      {/* Purchase Actions (Non-Owner) */}
      <Show when={!props.isOwner}>
        <PurchaseActions
          productId={props.productId}
          productTitle={props.productTitle}
          isAuthenticated={props.isAuthenticated}
        />
      </Show>

      {/* Revenue Preview (Owner Only) */}
      <Show when={props.isOwner}>
        <RevenuePreview
          productId={props.productId}
          totalPrice={totalPrice()}
          productOwnerName={props.productOwnerName}
        />
      </Show>

      {/* Add Content Modal */}
      <AddContentModal
        isOpen={showAddModal()}
        onClose={() => setShowAddModal(false)}
        productId={props.productId}
        userId={props.userId}
        onFilesAdded={handleFilesAdded}
        onDocumentAdded={handleDocumentAdded}
        onProductEmbedded={handleProductEmbedded}
      />
    </div>
  );
}
