import { createSignal, For, Show } from "solid-js";
import "./dashboard-content-filter.css";

export interface ContentItem {
  type: "asset" | "product";
  id: string;
  handle: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  status: string;
}

export interface DashboardContentFilterProps {
  items: ContentItem[];
}

type FilterType = "all" | "draft" | "private" | "public" | "archived";

export default function DashboardContentFilter(props: DashboardContentFilterProps) {
  const [activeFilter, setActiveFilter] = createSignal<FilterType>("all");

  const filteredItems = () => {
    const filter = activeFilter();
    if (filter === "all") {
      return props.items;
    }
    return props.items.filter(item => item.status === filter);
  };

  const getFilterCount = (filter: FilterType) => {
    if (filter === "all") return props.items.length;
    return props.items.filter(item => item.status === filter).length;
  };

  const filters: Array<{ key: FilterType; label: string; emoji: string }> = [
    { key: "all", label: "All", emoji: "📚" },
    { key: "draft", label: "Draft", emoji: "✏️" },
    { key: "private", label: "Private", emoji: "🔒" },
    { key: "public", label: "Public", emoji: "🌐" },
    { key: "archived", label: "Archived", emoji: "📦" },
  ];

  return (
    <div class="dashboard-filter">
      <div class="dashboard-filter__tabs">
        <For each={filters}>
          {(filter) => (
            <Show when={getFilterCount(filter.key) > 0}>
              <button
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                class="dashboard-filter__tab"
                classList={{
                  "dashboard-filter__tab--active": activeFilter() === filter.key,
                }}
              >
                <span class="dashboard-filter__tab-emoji">{filter.emoji}</span>
                <span class="dashboard-filter__tab-label">{filter.label}</span>
                <span class="dashboard-filter__tab-count">{getFilterCount(filter.key)}</span>
              </button>
            </Show>
          )}
        </For>
      </div>

      <Show
        when={filteredItems().length > 0}
        fallback={
          <div class="dashboard-filter__empty">
            <div class="dashboard-filter__empty-icon">📭</div>
            <p class="dashboard-filter__empty-text">
              No {activeFilter() !== "all" ? activeFilter() : ""} items found
            </p>
          </div>
        }
      >
        <div class="dashboard__content-grid">
          <For each={filteredItems()}>
            {(item) => (
              <a
                href={`/${item.type === "asset" ? "assets" : "products"}/${item.handle}`}
                class="dashboard__content-item"
                title={item.title}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  class="dashboard__content-image"
                />
                <div class="dashboard__content-overlay">
                  <span class={`dashboard__content-status dashboard__content-status--${item.status}`}>
                    {item.status}
                  </span>
                  {item.type === "asset" ? (
                    <svg class="dashboard__content-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  ) : (
                    <svg class="dashboard__content-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  )}
                </div>
                <div class="dashboard__content-footer">
                  <h4 class="dashboard__content-title">{item.title}</h4>
                </div>
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
