import { For, Show, createSignal } from "solid-js";
import ContentItem, { type UnifiedItem } from "./ContentItem";

export type SortOption = "type" | "name" | "price";

export interface ContentListProps {
  items: UnifiedItem[];
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  onEditPrice: (itemId: string, newPrice: number) => void;
  onDelete: (itemId: string) => void;
  onReorder?: (itemId: string, newPosition: number) => void;
  onAddContent?: () => void;
  isOwner?: boolean;
}

export default function ContentList(props: ContentListProps) {
  const [draggedItemId, setDraggedItemId] = createSignal<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = createSignal<string | null>(null);

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragOver = (e: DragEvent, itemId: string) => {
    e.preventDefault();
    setDragOverItemId(itemId);
  };

  const handleDrop = (e: DragEvent, targetItemId: string) => {
    e.preventDefault();
    const draggedId = draggedItemId();
    if (!draggedId || draggedId === targetItemId) return;

    const draggedItem = props.items.find((item) => item.id === draggedId);
    const targetItem = props.items.find((item) => item.id === targetItemId);

    // Only allow reordering within same type
    if (draggedItem && targetItem && draggedItem.type === targetItem.type) {
      props.onReorder?.(draggedId, targetItem.position);
    }

    handleDragEnd();
  };

  const canItemBeDragged = (item: UnifiedItem): boolean => {
    // Embedded products cannot be reordered
    return item.type !== "embedded";
  };

  return (
    <div class="content-list">
      {/* Header with Sort Controls and Add Button */}
      <div class="content-list__header">
        <h3 class="content-list__title">Product Content</h3>
        <div class="content-list__controls">
          <div class="content-list__sort">
            <label class="content-list__sort-label" for="sort-select">
              Sort by:
            </label>
            <select
              id="sort-select"
              class="content-list__sort-select"
              value={props.sortBy}
              onChange={(e) =>
                props.onSortChange(e.currentTarget.value as SortOption)
              }
            >
              <option value="type">Type</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </div>
          <Show when={props.isOwner}>
            <button
              type="button"
              class="content-list__add-button"
              onClick={props.onAddContent}
            >
              <svg
                class="content-list__add-icon"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="10" y1="5" x2="10" y2="15" />
                <line x1="5" y1="10" x2="15" y2="10" />
              </svg>
              <span class="content-list__add-text">Add Content</span>
            </button>
          </Show>
        </div>
      </div>

      {/* Items List */}
      <div class="content-list__items">
        <Show
          when={props.items.length > 0}
          fallback={
            <div class="content-list__empty">
              <div class="content-list__empty-icon">📦</div>
              <p class="content-list__empty-text">
                No content added yet
              </p>
              <p class="content-list__empty-hint">
                Add files, documents, or embed products to get started
              </p>
            </div>
          }
        >
          <For each={props.items}>
            {(item) => (
              <div
                class="content-list__item-wrapper"
                classList={{
                  "content-list__item-wrapper--drag-over":
                    dragOverItemId() === item.id,
                }}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
              >
                <ContentItem
                  item={item}
                  onEditPrice={props.onEditPrice}
                  onDelete={props.onDelete}
                  isDraggable={canItemBeDragged(item)}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                />
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
