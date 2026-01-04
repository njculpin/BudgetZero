import { createSignal, Show } from "solid-js";
import type { ProductFile } from "@/types";

export type ContentItemType = "file" | "document" | "embedded";

export interface ProductDocumentRelation {
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

export interface UnifiedItem {
  id: string;
  type: ContentItemType;
  name: string;
  price: number;
  position: number;
  editable: boolean;
  data: ProductFile | ProductDocumentRelation | EmbeddedProductData;
}

export interface EmbeddedProductData {
  id: string;
  component_id: string;
  title: string;
  handle: string;
  status: string;
  inherited_price_cents: number;
  creator_name: string;
  creator_handle: string;
  file_count: number;
}

export interface ContentItemProps {
  item: UnifiedItem;
  onEditPrice?: (itemId: string, newPrice: number) => void;
  onDelete?: (itemId: string) => void;
  isDraggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function ContentItem(props: ContentItemProps) {
  const [isEditingPrice, setIsEditingPrice] = createSignal(false);
  const [priceInput, setPriceInput] = createSignal("");
  const [showTooltip, setShowTooltip] = createSignal(false);

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getTypeIcon = (type: ContentItemType): string => {
    switch (type) {
      case "file":
        return "📁";
      case "document":
        return "📄";
      case "embedded":
        return "📦";
      default:
        return "📄";
    }
  };

  const getTypeName = (type: ContentItemType): string => {
    switch (type) {
      case "file":
        return "File";
      case "document":
        return "Document";
      case "embedded":
        return "Product";
      default:
        return "Item";
    }
  };

  const handleEditPrice = () => {
    if (!props.item.editable) return;
    setPriceInput((props.item.price / 100).toFixed(2));
    setIsEditingPrice(true);
  };

  const handleSavePrice = () => {
    const newPriceCents = Math.round(parseFloat(priceInput()) * 100);
    if (!isNaN(newPriceCents) && newPriceCents >= 0) {
      props.onEditPrice?.(props.item.id, newPriceCents);
    }
    setIsEditingPrice(false);
  };

  const handleCancelEdit = () => {
    setIsEditingPrice(false);
    setPriceInput("");
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${props.item.name}"?`)) {
      props.onDelete?.(props.item.id);
    }
  };

  const getCreatorInfo = (): string | null => {
    if (props.item.type === "embedded") {
      const data = props.item.data as EmbeddedProductData;
      return `by ${data.creator_name}`;
    }
    return null;
  };

  return (
    <div
      class="content-item"
      classList={{
        "content-item--draggable": props.isDraggable,
        [`content-item--${props.item.type}`]: true,
      }}
      draggable={props.isDraggable}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
    >
      {/* Drag Handle */}
      <Show when={props.isDraggable}>
        <div class="content-item__drag-handle" aria-label="Drag to reorder">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
      </Show>

      {/* Type Badge */}
      <div class="content-item__badge">
        <span class="content-item__badge-icon">{getTypeIcon(props.item.type)}</span>
        <span class="content-item__badge-label">{getTypeName(props.item.type)}</span>
      </div>

      {/* Content Info */}
      <div class="content-item__info">
        <div class="content-item__name">{props.item.name}</div>
        <Show when={getCreatorInfo()}>
          <div class="content-item__creator">{getCreatorInfo()}</div>
        </Show>
      </div>

      {/* Price */}
      <div class="content-item__price-section">
        <Show when={!isEditingPrice()}>
          <div
            class="content-item__price"
            classList={{ "content-item__price--editable": props.item.editable }}
            onClick={handleEditPrice}
            onMouseEnter={() => !props.item.editable && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {formatPrice(props.item.price)}
            <Show when={!props.item.editable && showTooltip()}>
              <div class="content-item__tooltip">
                Inherited price fixed at embedding time
              </div>
            </Show>
          </div>
        </Show>

        <Show when={isEditingPrice()}>
          <div class="content-item__price-edit">
            <div class="content-item__price-input-wrapper">
              <span class="content-item__price-currency">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                class="content-item__price-input"
                value={priceInput()}
                onInput={(e) => setPriceInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSavePrice();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                ref={(el) => setTimeout(() => el.focus(), 0)}
              />
            </div>
            <button
              type="button"
              class="content-item__price-save"
              onClick={handleSavePrice}
              aria-label="Save price"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 2.5l-8 8-3-3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              class="content-item__price-cancel"
              onClick={handleCancelEdit}
              aria-label="Cancel"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </Show>
      </div>

      {/* Actions */}
      <Show when={props.item.editable}>
        <div class="content-item__actions">
          <button
            type="button"
            class="content-item__delete"
            onClick={handleDelete}
            aria-label="Delete item"
          >
            <svg
              width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M13 4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h10z" />
          </svg>
        </button>
      </div>
      </Show>
    </div>
  );
}
