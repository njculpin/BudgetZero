import { createSignal, createEffect, Show, For } from "solid-js";
import {
  FormField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import "./base/base.css";

export interface AssetAddToProductFormProps {
  assetId: string;
}

interface Product {
  id: string;
  handle: string;
  title: string;
  status: string;
}

export default function AssetAddToProductForm(props: AssetAddToProductFormProps) {
  const [mode, setMode] = createSignal<"existing" | "new">("existing");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = createSignal("");
  const [newProductTitle, setNewProductTitle] = createSignal("");
  const [isSearching, setIsSearching] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  // Debounced search effect
  createEffect(() => {
    const query = searchQuery();
    if (mode() === "existing" && query.trim().length > 0) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/products/search-products?q=${encodeURIComponent(query)}`
          );
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.products || []);
          }
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    if (mode() === "existing" && !selectedProductId()) {
      setError("Please select a product");
      return;
    }

    if (mode() === "new" && !newProductTitle().trim()) {
      setError("Please enter a product title");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = {
        assetId: props.assetId,
        ...(mode() === "existing"
          ? { productId: selectedProductId() }
          : { newProductTitle: newProductTitle() }),
      };

      const response = await fetch("/api/assets/add-to-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add asset to product");
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      setSuccess(
        `Asset successfully added to product: ${data.product.title}`
      );
      setIsSubmitting(false);

      // Reset form
      setSearchQuery("");
      setSelectedProductId("");
      setNewProductTitle("");

      // Show link to product
      setTimeout(() => {
        window.location.href = `/products/${data.product.handle}`;
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="asset-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="asset-form__field">
        <label class="asset-form__label">Add to Product</label>
        <div class="asset-form__radio-group">
          <label class="asset-form__radio">
            <input
              type="radio"
              name="mode"
              value="existing"
              checked={mode() === "existing"}
              onChange={() => setMode("existing")}
            />
            <span>Add to Existing Product</span>
          </label>
          <label class="asset-form__radio">
            <input
              type="radio"
              name="mode"
              value="new"
              checked={mode() === "new"}
              onChange={() => setMode("new")}
            />
            <span>Create New Product</span>
          </label>
        </div>
      </div>

      <Show when={mode() === "existing"}>
        <FormField
          label="Search Products"
          name="search"
          type="text"
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
          placeholder="Search your products..."
          disabled={isSubmitting()}
          helpText="Search for a product by title or handle"
        />

        <Show when={isSearching()}>
          <div class="asset-form__search-status">Searching...</div>
        </Show>

        <Show when={searchResults().length > 0}>
          <div class="asset-form__search-results">
            <For each={searchResults()}>
              {(product) => (
                <label class="asset-form__search-result">
                  <input
                    type="radio"
                    name="product"
                    value={product.id}
                    checked={selectedProductId() === product.id}
                    onChange={() => setSelectedProductId(product.id)}
                  />
                  <div class="asset-form__search-result-info">
                    <div class="asset-form__search-result-title">
                      {product.title}
                    </div>
                    <div class="asset-form__search-result-meta">
                      {product.handle} • {product.status}
                    </div>
                  </div>
                </label>
              )}
            </For>
          </div>
        </Show>

        <Show
          when={
            searchQuery().trim().length > 0 && searchResults().length === 0 && !isSearching()
          }
        >
          <div class="asset-form__no-results">
            No products found. Try a different search or create a new product.
          </div>
        </Show>
      </Show>

      <Show when={mode() === "new"}>
        <FormField
          label="Product Title"
          name="newProductTitle"
          type="text"
          value={newProductTitle()}
          onInput={(e) => setNewProductTitle(e.currentTarget.value)}
          placeholder="Enter new product title"
          required
          disabled={isSubmitting()}
          helpText="A new product will be created with this title"
        />
      </Show>

      <div class="asset-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isSubmitting()}
          loadingText="Adding to product..."
        >
          Add to Product
        </LoadingButton>
      </div>
    </form>
  );
}
