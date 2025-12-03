import { createSignal, Show, For } from "solid-js";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { ErrorMessage } from "@/components/interactive";
import TagInput from "@/components/interactive/TagInput";
import "@/components/interactive/base.css";
import "@/styles/save-status.css";
import "./asset-tags-form.css";

export interface AssetTagsFormProps {
  assetId: string;
  initialTags: string[];
}

export default function AssetTagsForm(props: AssetTagsFormProps) {
  const [tags, setTags] = createSignal<string[]>(props.initialTags);
  const [error, setError] = createSignal("");

  // Auto-save handler
  const saveData = async () => {
    setError("");

    const formData = new FormData();
    formData.append("assetId", props.assetId);
    formData.append("tags", JSON.stringify(tags()));

    const response = await fetch("/api/assets/update-asset", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error || "Failed to update tags";
      setError(errorMessage);

      // Throw error with status for retry logic
      const error = new Error(errorMessage) as Error & { status: number };
      error.status = response.status;
      throw error;
    }
  };

  const autoSave = useAutoSave({
    debounceMs: 1000,
    onSave: saveData,
  });

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    autoSave.triggerSave();
  };

  return (
    <div class="asset-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError("")} />
      </Show>

      {/* Save Status Indicator */}
      <div class="asset-form__save-status">
        <Show when={autoSave.saveStatus() === "saving"}>
          <span
            class="save-status save-status--saving"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span class="save-status__spinner" aria-hidden="true"></span>
            Saving...
          </span>
        </Show>
        <Show when={autoSave.saveStatus() === "saved"}>
          <span
            class="save-status save-status--saved"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            ✓ Saved
          </span>
        </Show>
        <Show when={autoSave.saveStatus() === "error"}>
          <span
            class="save-status save-status--error"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            ✗ Save failed
          </span>
        </Show>
      </div>

      <div class="form-field">
        <label class="form-field__label">Tags</label>
        <Show when={props.initialTags.length > 0}>
          <div class="asset-tags-form__existing-tags">
            <p class="asset-tags-form__label">Current tags:</p>
            <div class="asset-tags-form__tag-list">
              <For each={props.initialTags}>
                {(tag) => <span class="asset-tags-form__tag">{tag}</span>}
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
          Add tags to help users discover your asset (e.g., "fantasy", "character", "miniature")
        </p>
      </div>
    </div>
  );
}
