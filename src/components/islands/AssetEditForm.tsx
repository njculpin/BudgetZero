import { createSignal, Show, For } from "solid-js";
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

export interface AssetEditFormProps {
  assetId: string;
  assetHandle: string;
  initialData: {
    title: string;
    description: string | null;
    status: "draft" | "private" | "public" | "archived";
    tags: string[];
    existingFiles: Array<{
      id: string;
      title: string;
      file_size_bytes: number;
    }>;
    existingImages: Array<{
      id: string;
      title: string;
      file_url: string;
    }>;
  };
}

export default function AssetEditForm(props: AssetEditFormProps) {
  const [title, setTitle] = createSignal(props.initialData.title);
  const [description, setDescription] = createSignal(
    props.initialData.description || ""
  );
  const [status, setStatus] = createSignal(props.initialData.status);
  const [tags, setTags] = createSignal<string[]>(props.initialData.tags);
  const [newFiles, setNewFiles] = createSignal<File[]>([]);
  const [newImages, setNewImages] = createSignal<File[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal("");

  const handleFilesSelected = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files) {
      setNewFiles(Array.from(input.files));
    }
  };

  const handleImagesSelected = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files) {
      setNewImages(Array.from(input.files));
    }
  };

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
      formData.append("assetId", props.assetId);
      formData.append("title", title());
      formData.append("description", description());
      formData.append("status", status());
      formData.append("tags", JSON.stringify(tags()));

      // Append new files
      newFiles().forEach((file) => {
        formData.append("files", file);
      });

      // Append new images
      newImages().forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch("/api/assets/update-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update asset");
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setSuccess("Asset updated successfully!");
      setIsLoading(false);

      // Redirect to asset detail page using the updated handle (in case title changed)
      const newHandle = data.asset?.handle || props.assetHandle;
      setTimeout(() => {
        window.location.href = `/assets/${newHandle}`;
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="asset-edit-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      <Show when={success()}>
        <SuccessMessage message={success()} onDismiss={() => setSuccess("")} />
      </Show>

      <FormField
        label="Title"
        name="title"
        type="text"
        value={title()}
        onInput={(e) => setTitle(e.currentTarget.value)}
        placeholder="Enter asset title"
        required
        disabled={isLoading()}
      />

      <TextAreaField
        label="Description"
        name="description"
        value={description()}
        onInput={(e) => setDescription(e.currentTarget.value)}
        placeholder="Describe your asset..."
        rows={4}
        disabled={isLoading()}
      />

      <div class="form-field">
        <label class="form-field__label">Tags</label>
        <Show when={props.initialData.tags.length > 0}>
          <div class="asset-edit-form__existing-tags">
            <p class="asset-edit-form__label">Existing tags:</p>
            <div class="asset-edit-form__tag-list">
              <For each={props.initialData.tags}>
                {(tag) => <span class="asset-edit-form__tag">{tag}</span>}
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
      </div>

      <div class="form-field">
        <label class="form-field__label">Asset Files</label>
        <Show when={props.initialData.existingFiles.length > 0}>
          <div class="asset-edit-form__existing-files">
            <p class="asset-edit-form__label">
              Existing files ({props.initialData.existingFiles.length}):
            </p>
            <ul class="asset-edit-form__file-list">
              <For each={props.initialData.existingFiles}>
                {(file) => (
                  <li class="asset-edit-form__file-item">
                    <span>{file.title}</span>
                    <span class="asset-edit-form__file-size">
                      {(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
        <input
          type="file"
          multiple
          onChange={handleFilesSelected}
          disabled={isLoading()}
          class="form-field__file-input"
        />
        <p class="form-field__help-text">
          Add more asset files (PDF, STL, OBJ, ZIP, etc.)
        </p>
        <Show when={newFiles().length > 0}>
          <p class="form-field__help-text">
            Selected {newFiles().length} new file(s)
          </p>
        </Show>
      </div>

      <div class="form-field">
        <label class="form-field__label">Cover Images</label>
        <Show when={props.initialData.existingImages.length > 0}>
          <div class="asset-edit-form__existing-images">
            <p class="asset-edit-form__label">
              Existing images ({props.initialData.existingImages.length}):
            </p>
            <div class="asset-edit-form__image-grid">
              <For each={props.initialData.existingImages}>
                {(image) => (
                  <div class="asset-edit-form__image-item">
                    <img src={image.file_url} alt={image.title} />
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagesSelected}
          disabled={isLoading()}
          class="form-field__file-input"
        />
        <p class="form-field__help-text">Add more cover images</p>
        <Show when={newImages().length > 0}>
          <p class="form-field__help-text">
            Selected {newImages().length} new image(s)
          </p>
        </Show>
      </div>

      <SelectField
        label="Status"
        name="status"
        value={status()}
        onChange={(e: Event) =>
          setStatus((e.currentTarget as HTMLSelectElement).value as "draft" | "private" | "public" | "archived")
        }
        options={[
          { value: "draft", label: "✏️ Draft" },
          { value: "private", label: "🔒 Private" },
          { value: "public", label: "🌐 Public" },
          { value: "archived", label: "📦 Archived" },
        ]}
        disabled={isLoading()}
      />

      <div class="asset-edit-form__actions">
        <a
          href={`/assets/${props.assetHandle}`}
          class="button button--outline button--md"
        >
          Cancel
        </a>
        <LoadingButton
          type="submit"
          isLoading={isLoading()}
          loadingText="Saving..."
        >
          Update Asset
        </LoadingButton>
      </div>
    </form>
  );
}
