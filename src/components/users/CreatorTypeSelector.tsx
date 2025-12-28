import { createSignal, For } from "solid-js";

interface CreatorTypeSelectorProps {
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  autoSave?: boolean;
}

const CREATOR_TYPES = [
  "Game Designer",
  "Illustrator",
  "3D Modeler",
  "Painter",
  "Printer",
  "Writer",
  "Sound Designer",
  "Programmer",
];

export default function CreatorTypeSelector(props: CreatorTypeSelectorProps) {
  const [selectedTags, setSelectedTags] = createSignal<string[]>(props.initialTags || []);
  const [isSaving, setIsSaving] = createSignal(false);
  const [saveStatus, setSaveStatus] = createSignal("");

  const toggleTag = async (tag: string) => {
    const current = selectedTags();
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];

    setSelectedTags(updated);

    // Call onChange callback
    if (props.onTagsChange) {
      props.onTagsChange(updated);
    }

    // Auto-save if enabled
    if (props.autoSave) {
      await saveTags(updated);
    }
  };

  const saveTags = async (tags: string[]) => {
    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      const formData = new FormData();
      formData.append("tags", JSON.stringify(tags));

      const response = await fetch("/api/users/update-tags", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setSaveStatus("Error: " + (data.error || "Failed to save"));
        setTimeout(() => setSaveStatus(""), 3000);
        setIsSaving(false);
        return;
      }

      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(""), 2000);
      setIsSaving(false);
    } catch (error) {
      setSaveStatus("Error: Failed to save");
      setTimeout(() => setSaveStatus(""), 3000);
      setIsSaving(false);
    }
  };

  return (
    <div class="creator-type-selector">
      <div class="creator-type-selector__header">
        <h3 class="creator-type-selector__title">What type of creator are you?</h3>
        <p class="creator-type-selector__description">
          Select all that apply. This helps others find you in the creator directory.
        </p>
        {saveStatus() && (
          <div class={`creator-type-selector__status creator-type-selector__status--${saveStatus().startsWith('Error') ? 'error' : 'success'}`}>
            {saveStatus()}
          </div>
        )}
      </div>

      <div class="creator-type-selector__grid">
        <For each={CREATOR_TYPES}>
          {(type) => (
            <button
              type="button"
              class={`creator-type-selector__option ${
                selectedTags().includes(type)
                  ? "creator-type-selector__option--active"
                  : ""
              }`}
              onClick={() => toggleTag(type)}
              disabled={isSaving()}
            >
              <span class="creator-type-selector__option-text">{type}</span>
              {selectedTags().includes(type) && (
                <svg
                  class="creator-type-selector__check"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
