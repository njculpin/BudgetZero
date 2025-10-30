import { createSignal, Show } from "solid-js";
import {
  FormField,
  TextAreaField,
  SelectField,
  LoadingButton,
  ErrorMessage,
  SuccessMessage,
} from "./base";
import TagInput from "./TagInput";
import "./base/base.css";

export interface ProductEditFormProps {
  productId: string;
  initialData: {
    title: string;
    description: string | null;
    status: "draft" | "published" | "archived";
    coverImageUrl: string | null;
    tags: string[];
  };
  productHandle: string;
}

export default function ProductEditForm(props: ProductEditFormProps) {
  const [title, setTitle] = createSignal(props.initialData.title);
  const [description, setDescription] = createSignal(props.initialData.description || "");
  const [status, setStatus] = createSignal(props.initialData.status);
  const [tags, setTags] = createSignal<string[]>(props.initialData.tags);
  const [coverImageFile, setCoverImageFile] = createSignal<File | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setCoverImageFile(files[0]);
    }
  };

  const handleFileError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("productId", props.productId);
      formData.append("title", title());
      formData.append("description", description());
      formData.append("status", status());
      formData.append("tags", JSON.stringify(tags()));

      if (coverImageFile()) {
        formData.append("coverImage", coverImageFile()!);
      }

      const response = await fetch("/api/products/update-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update product");
        setIsLoading(false);
        return;
      }

      setSuccess("Product updated successfully!");
      setIsLoading(false);

      // Reload page after short delay to show success message
      setTimeout(() => {
        window.location.href = `/products/${props.productHandle}/edit`;
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  return (
    <form onSubmit={handleSubmit} class="product-edit-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <FormField
        label="Product Title"
        name="title"
        type="text"
        value={title()}
        onInput={(e) => setTitle(e.currentTarget.value)}
        required
        disabled={isLoading()}
      />

      <TextAreaField
        label="Description"
        name="description"
        value={description()}
        onInput={(e) => setDescription(e.currentTarget.value)}
        rows={6}
        disabled={isLoading()}
      />

      <div class="form-field">
        <label class="form-field__label">Cover Image</label>
        <Show when={props.initialData.coverImageUrl && !coverImageFile()}>
          <div class="product-edit-form__current-image">
            <img src={props.initialData.coverImageUrl!} alt="Current cover" />
          </div>
        </Show>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const files = e.currentTarget.files;
            if (files && files.length > 0) {
              handleFilesSelected([files[0]]);
            }
          }}
          disabled={isLoading()}
          class="form-field__file-input"
        />
        <Show when={coverImageFile()}>
          <p class="form-field__help-text">New file selected: {coverImageFile()!.name}</p>
        </Show>
      </div>

      <div class="form-field">
        <label class="form-field__label">Tags</label>
        <TagInput
          name="tags"
          placeholder="Add tags..."
          initialTags={tags()}
          onChange={handleTagsChange}
        />
      </div>

      <SelectField
        label="Status"
        name="status"
        value={status()}
        onChange={(e) => setStatus(e.currentTarget.value as "draft" | "published" | "archived")}
        options={[
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
          { value: "archived", label: "Archived" },
        ]}
        disabled={isLoading()}
      />

      <div class="product-edit-form__actions">
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Saving..."
        >
          Save Changes
        </LoadingButton>
      </div>
    </form>
  );
}
