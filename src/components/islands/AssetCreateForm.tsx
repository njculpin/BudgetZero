import { createSignal } from "solid-js";
import "./AssetCreateForm.css";

export default function AssetCreateForm() {
  const [title, setTitle] = createSignal<string>("");
  const [description, setDescription] = createSignal<string>("");
  const [status, setStatus] = createSignal<string>("draft");
  const [files, setFiles] = createSignal<FileList | null>(null);
  const [images, setImages] = createSignal<FileList | null>(null);
  const [error, setError] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title());
      formData.append("description", description());
      formData.append("status", status());

      // Append files
      const fileList = files();
      if (fileList) {
        for (let i = 0; i < fileList.length; i++) {
          formData.append("files", fileList[i]);
        }
      }

      // Append images
      const imageList = images();
      if (imageList) {
        for (let i = 0; i < imageList.length; i++) {
          formData.append("images", imageList[i]);
        }
      }

      const response = await fetch("/api/assets/create-asset", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create asset. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success - the API will redirect, but we can handle it client-side
      const data = await response.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div class="card asset-create-card">
      <div class="card-content">
        <form onSubmit={handleSubmit} class="asset-form" enctype="multipart/form-data">
          {error() && (
            <div class="asset-form__error" role="alert">
              {error()}
            </div>
          )}

          <div class="asset-form__field">
            <label for="title" class="label">
              Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              class="input"
              value={title()}
              onInput={(e: InputEvent) =>
                setTitle((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="My Awesome Asset"
              required
              disabled={isLoading()}
            />
          </div>

          <div class="asset-form__field">
            <label for="description" class="label">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              class="asset-form__textarea"
              value={description()}
              onInput={(e: InputEvent) =>
                setDescription((e.currentTarget as HTMLTextAreaElement).value)
              }
              placeholder="Describe your asset..."
              rows={4}
              disabled={isLoading()}
            />
          </div>

          <div class="asset-form__field">
            <label for="files" class="label">
              Asset Files
            </label>
            <input
              type="file"
              name="files"
              id="files"
              multiple
              class="asset-form__file-input"
              onChange={(e: Event) =>
                setFiles((e.currentTarget as HTMLInputElement).files)
              }
              disabled={isLoading()}
            />
            <p class="asset-form__help-text">
              Upload your asset files (PDF, STL, OBJ, ZIP, etc.) - you can
              select multiple files
            </p>
          </div>

          <div class="asset-form__field">
            <label for="images" class="label">
              Cover Images
            </label>
            <input
              type="file"
              name="images"
              id="images"
              accept="image/*"
              multiple
              class="asset-form__file-input"
              onChange={(e: Event) =>
                setImages((e.currentTarget as HTMLInputElement).files)
              }
              disabled={isLoading()}
            />
            <p class="asset-form__help-text">
              Upload cover images for your asset - you can select multiple images
            </p>
          </div>

          <div class="asset-form__field">
            <label for="status" class="label">
              Status
            </label>
            <select
              name="status"
              id="status"
              class="asset-form__select"
              value={status()}
              onChange={(e: Event) =>
                setStatus((e.currentTarget as HTMLSelectElement).value)
              }
              disabled={isLoading()}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <p class="asset-form__help-text">
              Published assets are visible to everyone
            </p>
          </div>

          <div class="asset-form__actions">
            <a href="/dashboard">
              <button type="button" class="button button--ghost button--md">
                <span class="button__text">Cancel</span>
              </button>
            </a>
            <button
              type="submit"
              class="button button--primary button--md"
              disabled={isLoading()}
            >
              <span class="button__text">
                {isLoading() ? "Creating..." : "Create Asset"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
