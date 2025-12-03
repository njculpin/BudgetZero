import { createSignal } from "solid-js";
import TagInput from "@/components/interactive/TagInput";
import "./product-create-form.css";

export default function ProductCreateForm() {
  const [title, setTitle] = createSignal<string>("");
  const [description, setDescription] = createSignal<string>("");
  const [status, setStatus] = createSignal<string>("draft");
  const [tags, setTags] = createSignal<string[]>([]);
  const [error, setError] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/products/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title(),
          description: description() || undefined,
          status: status() as "draft" | "private" | "public" | "archived",
          tags: tags().length > 0 ? tags() : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create product. Please try again.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      // Redirect to the product page
      if (data.product && data.product.handle) {
        window.location.href = `/products/${data.product.handle}`;
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  return (
    <div class="card product-create-card">
      <div class="card-header">
        <h2 class="card-title">Create New Product</h2>
        <p class="card-description">
          List your tabletop game, expansion, or accessory for sale
        </p>
      </div>

      <div class="card-content">
        <form onSubmit={handleSubmit} class="product-form">
          {error() && (
            <div class="product-form__error" role="alert">
              {error()}
            </div>
          )}

          <div class="product-form__field">
            <label for="title" class="product-form__label">
              Product Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              class="product-form__input"
              value={title()}
              onInput={(e: InputEvent) =>
                setTitle((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="My Awesome Board Game"
              required
              disabled={isLoading()}
            />
            <p class="product-form__help-text">
              Give your product a clear, descriptive title
            </p>
          </div>

          <div class="product-form__field">
            <label for="description" class="product-form__label">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              class="product-form__textarea"
              value={description()}
              onInput={(e: InputEvent) =>
                setDescription((e.currentTarget as HTMLTextAreaElement).value)
              }
              placeholder="Describe your product in detail..."
              rows={6}
              disabled={isLoading()}
            />
            <p class="product-form__help-text">
              Explain what makes your product unique. Include gameplay details,
              components, player count, etc.
            </p>
          </div>

          <div class="product-form__field">
            <label for="tags" class="product-form__label">
              Tags
            </label>
            <TagInput
              name="tags"
              placeholder="Add tags (e.g., strategy, family-friendly)"
              initialTags={tags()}
              onChange={handleTagsChange}
            />
            <p class="product-form__help-text">
              Add tags to help buyers find your product (e.g., "strategy",
              "family-friendly", "dungeon-crawler")
            </p>
          </div>

          <div class="product-form__field">
            <label for="status" class="product-form__label">
              Status
            </label>
            <select
              name="status"
              id="status"
              class="product-form__select"
              value={status()}
              onChange={(e: Event) =>
                setStatus((e.currentTarget as HTMLSelectElement).value)
              }
              disabled={isLoading()}
            >
              <option value="draft">Draft</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <p class="product-form__help-text">
              public products are visible in the marketplace
            </p>
          </div>

          <div class="product-form__info">
            <h3 class="product-form__info-title">Next Steps</h3>
            <p class="product-form__info-text">
              After creating your product, you'll be able to:
            </p>
            <ul class="product-form__info-list">
              <li>Add product variants (PDF, Physical, Bundle, etc.)</li>
              <li>Set pricing for each variant</li>
              <li>Link downloadable assets to variants</li>
              <li>Upload a cover image</li>
            </ul>
          </div>

          <div class="product-form__actions">
            <a href="/dashboard">
              <button
                type="button"
                class="button button--ghost button--md"
                disabled={isLoading()}
              >
                <span class="button__text">Cancel</span>
              </button>
            </a>
            <button
              type="submit"
              class="button button--primary button--md"
              disabled={isLoading()}
            >
              <span class="button__text">
                {isLoading() ? "Creating..." : "Create Product"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
