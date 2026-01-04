import { createSignal, For, Show, onMount } from "solid-js";
import PurchaseCard, { type PurchaseWithDetails } from "./PurchaseCard";
import "./purchases-list.css";

export interface PurchasesListProps {
  initialPurchases: PurchaseWithDetails[];
  initialPage?: number;
  initialSearch?: string;
  initialFilter?: string;
  totalCount: number;
}

export default function PurchasesList(props: PurchasesListProps) {
  const [purchases, setPurchases] = createSignal<PurchaseWithDetails[]>(props.initialPurchases);
  const [search, setSearch] = createSignal(props.initialSearch || "");
  const [filter, setFilter] = createSignal(props.initialFilter || "all");
  const [currentPage, setCurrentPage] = createSignal(props.initialPage || 1);
  const [totalCount, setTotalCount] = createSignal(props.totalCount);
  const [isLoading, setIsLoading] = createSignal(false);

  const itemsPerPage = 10;
  const totalPages = () => Math.ceil(totalCount() / itemsPerPage);

  // Filter purchases client-side for now (will move to server-side later)
  const filteredPurchases = () => {
    let filtered = purchases();
    const searchTerm = search().toLowerCase().trim();

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((purchase) =>
        purchase.items.some((item) => {
          const productMatch = item.product?.title.toLowerCase().includes(searchTerm);
          const fileMatch = item.files?.some((file) =>
            file.title.toLowerCase().includes(searchTerm) ||
            file.source_product_title?.toLowerCase().includes(searchTerm)
          );
          return productMatch || fileMatch;
        })
      );
    }

    // Apply date filter
    const now = new Date();
    const filterValue = filter();

    if (filterValue !== "all") {
      filtered = filtered.filter((purchase) => {
        const purchaseDate = new Date(purchase.created_at);
        const daysDiff = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (filterValue) {
          case "last_30":
            return daysDiff <= 30;
          case "last_90":
            return daysDiff <= 90;
          case "last_year":
            return daysDiff <= 365;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Update URL params when filters change
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (search()) params.set("search", search());
    if (filter() !== "all") params.set("filter", filter());
    if (currentPage() > 1) params.set("page", currentPage().toString());

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, "", newUrl);
  };

  // Handle search input
  const handleSearchInput = (e: InputEvent) => {
    setSearch((e.target as HTMLInputElement).value);
    setCurrentPage(1); // Reset to first page on search
    updateUrlParams();
  };

  // Handle filter change
  const handleFilterChange = (e: Event) => {
    setFilter((e.target as HTMLSelectElement).value);
    setCurrentPage(1); // Reset to first page on filter change
    updateUrlParams();
  };

  // Pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages()) return;
    setCurrentPage(page);
    updateUrlParams();

    // Scroll to top of purchases list
    const purchasesElement = document.querySelector('.purchases-list');
    if (purchasesElement) {
      purchasesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Paginated purchases
  const paginatedPurchases = () => {
    const filtered = filteredPurchases();
    const start = (currentPage() - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  };

  // Pagination range (show 5 page numbers at a time)
  const paginationRange = () => {
    const total = totalPages();
    const current = currentPage();
    const range: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    // Adjust if at the beginning or end
    if (current <= 3) {
      end = Math.min(5, total);
    }
    if (current >= total - 2) {
      start = Math.max(1, total - 4);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

  return (
    <div class="purchases-list">
      {/* Search and Filter Bar */}
      <div class="purchases-list__filters">
        <div class="purchases-list__search">
          <input
            type="text"
            class="purchases-list__search-input"
            placeholder="Search by product or file name..."
            value={search()}
            onInput={handleSearchInput}
          />
          <svg
            class="purchases-list__search-icon"
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
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>

        <div class="purchases-list__filter-group">
          <label for="date-filter" class="purchases-list__filter-label">
            Time period:
          </label>
          <select
            id="date-filter"
            class="purchases-list__filter-select"
            value={filter()}
            onChange={handleFilterChange}
          >
            <option value="all">All time</option>
            <option value="last_30">Last 30 days</option>
            <option value="last_90">Last 3 months</option>
            <option value="last_year">Last year</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div class="purchases-list__summary">
        <Show
          when={filteredPurchases().length > 0}
          fallback={
            <p class="purchases-list__summary-text">
              No purchases found
              <Show when={search() || filter() !== "all"}>
                {" "}matching your filters
              </Show>
            </p>
          }
        >
          <p class="purchases-list__summary-text">
            Showing {paginatedPurchases().length} of {filteredPurchases().length} {filteredPurchases().length === 1 ? "purchase" : "purchases"}
          </p>
        </Show>
      </div>

      {/* Purchase Cards */}
      <Show
        when={paginatedPurchases().length > 0}
        fallback={
          <div class="purchases-list__empty">
            <Show
              when={search() || filter() !== "all"}
              fallback={
                <>
                  <svg
                    class="purchases-list__empty-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <h3 class="purchases-list__empty-title">No purchases yet</h3>
                  <p class="purchases-list__empty-description">
                    When you purchase products, your digital downloads will appear here.
                  </p>
                  <a href="/products" class="button button--primary button--md">
                    <span class="button__text">Browse Products</span>
                  </a>
                </>
              }
            >
              <svg
                class="purchases-list__empty-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3 class="purchases-list__empty-title">No results found</h3>
              <p class="purchases-list__empty-description">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button
                type="button"
                class="button button--outline button--md"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                  setCurrentPage(1);
                  updateUrlParams();
                }}
              >
                <span class="button__text">Clear Filters</span>
              </button>
            </Show>
          </div>
        }
      >
        <div class="purchases-list__cards">
          <For each={paginatedPurchases()}>
            {(purchase) => <PurchaseCard purchase={purchase} />}
          </For>
        </div>
      </Show>

      {/* Pagination */}
      <Show when={totalPages() > 1 && filteredPurchases().length > 0}>
        <div class="purchases-list__pagination">
          <button
            type="button"
            class="purchases-list__pagination-button"
            disabled={currentPage() === 1}
            onClick={() => handlePageChange(currentPage() - 1)}
            aria-label="Previous page"
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
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Previous</span>
          </button>

          <div class="purchases-list__pagination-numbers">
            <Show when={paginationRange()[0] > 1}>
              <button
                type="button"
                class="purchases-list__pagination-number"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              <Show when={paginationRange()[0] > 2}>
                <span class="purchases-list__pagination-ellipsis">...</span>
              </Show>
            </Show>

            <For each={paginationRange()}>
              {(page) => (
                <button
                  type="button"
                  class={`purchases-list__pagination-number ${
                    page === currentPage() ? "purchases-list__pagination-number--active" : ""
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )}
            </For>

            <Show when={paginationRange()[paginationRange().length - 1] < totalPages()}>
              <Show when={paginationRange()[paginationRange().length - 1] < totalPages() - 1}>
                <span class="purchases-list__pagination-ellipsis">...</span>
              </Show>
              <button
                type="button"
                class="purchases-list__pagination-number"
                onClick={() => handlePageChange(totalPages())}
              >
                {totalPages()}
              </button>
            </Show>
          </div>

          <button
            type="button"
            class="purchases-list__pagination-button"
            disabled={currentPage() === totalPages()}
            onClick={() => handlePageChange(currentPage() + 1)}
            aria-label="Next page"
          >
            <span>Next</span>
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
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </Show>
    </div>
  );
}
