import { createSignal, Show, For } from "solid-js";
import {
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import TagInput from "./TagInput";
import "./base/base.css";
import "./product-tags-form.css";

export interface ProductTagsFormProps {
  productId: string;
  initialTags: string[];
}

export default function ProductTagsForm(props: ProductTagsFormProps) {
  const [tags, setTags] = createSignal<string[]>(props.initialTags);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("tags", JSON.stringify(tags()));

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update tags");
        setIsLoading(false);
        return;
      }

      setSuccess("Tags updated successfully!");
      setIsLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="product-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <div class="form-field">
        <label class="form-field__label">Tags</label>
        <Show when={props.initialTags.length > 0}>
          <div class="product-tags-form__existing-tags">
            <p class="product-tags-form__label">Current tags:</p>
            <div class="product-tags-form__tag-list">
              <For each={props.initialTags}>
                {(tag) => <span class="product-tags-form__tag">{tag}</span>}
              </For>
            </div>
          </div>
        </Show>
        <TagInput
          name="tags"
          placeholder="Add new tags (press Enter)"
          initialTags={tags()}
          onChange={handleTagsChange}
        />
        <p class="form-field__help-text">
          Add tags to help users discover your product (e.g., "rpg", "fantasy", "miniatures")
        </p>
      </div>

      <div class="product-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Saving..."
        >
          Save Tags
        </LoadingButton>
      </div>
    </form>
  );
}
