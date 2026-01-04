import { createSignal, Show } from "solid-js";
import {
  FormField,
  TextAreaField,
  SelectField,
  LoadingButton,
  ErrorMessage,
} from "@/components/interactive";
import TagInput from "@/components/interactive/TagInput";
import ProductCreatedModal from "./ProductCreatedModal";
import "./product-create-form.css";

export default function ProductCreateForm() {
  const [title, setTitle] = createSignal<string>("");
  const [description, setDescription] = createSignal<string>("");
  const [status, setStatus] = createSignal<string>("draft");
  const [tags, setTags] = createSignal<string[]>([]);
  const [error, setError] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = createSignal<boolean>(false);
  const [createdProduct, setCreatedProduct] = createSignal<{ title: string; handle: string } | null>(null);

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
      // Show success modal instead of immediately redirecting
      if (data.product && data.product.handle) {
        setCreatedProduct({
          title: data.product.title,
          handle: data.product.handle,
        });
        setIsLoading(false);
        setShowSuccessModal(true);

        // Dispatch event to update navigation menu
        window.dispatchEvent(new CustomEvent('product:created'));
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
    <>
      <div class="product-create-form">
        <div class="product-create-form__header">
          <h2 class="product-create-form__title">Create New Product</h2>
          <p class="product-create-form__description">
            List your tabletop game, expansion, or accessory for sale
          </p>
        </div>

        <form onSubmit={handleSubmit} class="product-create-form__form">
          <Show when={error()}>
            <ErrorMessage message={error()} onDismiss={() => setError("")} />
          </Show>

          <FormField
            label="Product Title"
            name="title"
            type="text"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="My Awesome Board Game"
            helpText="Give your product a clear, descriptive title"
            required
            disabled={isLoading()}
          />

          <TextAreaField
            label="Description"
            name="description"
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="Describe your product in detail..."
            helpText="Explain what makes your product unique. Include gameplay details, components, player count, etc."
            rows={6}
            disabled={isLoading()}
          />

          <div class="form-field">
            <label class="form-field__label">Tags</label>
            <TagInput
              name="tags"
              placeholder="Add tags (e.g., strategy, family-friendly)"
              initialTags={tags()}
              onChange={handleTagsChange}
            />
            <p class="form-field__help-text">
              Add tags to help buyers find your product (e.g., "strategy",
              "family-friendly", "dungeon-crawler")
            </p>
          </div>

          <SelectField
            label="Status"
            name="status"
            value={status()}
            onChange={(e: Event) =>
              setStatus((e.currentTarget as HTMLSelectElement).value)
            }
            options={[
              { value: "draft", label: "Draft" },
              { value: "private", label: "Private" },
              { value: "public", label: "Public" },
            ]}
            helpText="Public products are visible in the marketplace"
            disabled={isLoading()}
          />

          <div class="product-create-form__info">
            <h3 class="product-create-form__info-title">Next Steps</h3>
            <p class="product-create-form__info-text">
              After creating your product, you'll be able to:
            </p>
            <ul class="product-create-form__info-list">
              <li>Upload a cover image</li>
              <li>Add downloadable files</li>
              <li>Embed other products as components</li>
              <li>Set up pricing and royalties</li>
            </ul>
          </div>

          <div class="product-create-form__actions">
            <a href="/products" class="product-create-form__cancel-link">
              <button
                type="button"
                class="button button--ghost button--md"
                disabled={isLoading()}
              >
                <span class="button__text">Cancel</span>
              </button>
            </a>
            <LoadingButton
              type="submit"
              isLoading={isLoading()}
              loadingText="Creating..."
            >
              Create Product
            </LoadingButton>
          </div>
        </form>
      </div>

      {createdProduct() && (
        <ProductCreatedModal
          isOpen={showSuccessModal()}
          onClose={() => setShowSuccessModal(false)}
          productTitle={createdProduct()!.title}
          productHandle={createdProduct()!.handle}
        />
      )}
    </>
  );
}
