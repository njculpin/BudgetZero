import { createSignal } from "solid-js";

interface CreatorFiltersProps {
  onFilterChange: (search: string, tags: string[]) => void;
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

export default function CreatorFilters(props: CreatorFiltersProps) {
  const [search, setSearch] = createSignal("");
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);

  const handleSearchInput = (value: string) => {
    setSearch(value);
    props.onFilterChange(value, selectedTags());
  };

  const toggleTag = (tag: string) => {
    const current = selectedTags();
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setSelectedTags(updated);
    props.onFilterChange(search(), updated);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTags([]);
    props.onFilterChange("", []);
  };

  const hasActiveFilters = () => search().length > 0 || selectedTags().length > 0;

  return (
    <div class="creator-filters">
      <div class="creator-filters__search">
        <input
          type="text"
          class="creator-filters__search-input"
          placeholder="Search creators by name or bio..."
          value={search()}
          onInput={(e) => handleSearchInput(e.currentTarget.value)}
        />
      </div>

      <div class="creator-filters__tags">
        <div class="creator-filters__tags-header">
          <h3 class="creator-filters__tags-title">Filter by Type</h3>
          {hasActiveFilters() && (
            <button
              type="button"
              class="creator-filters__clear"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
        <div class="creator-filters__tags-list">
          {CREATOR_TYPES.map((tag) => (
            <button
              type="button"
              class={`creator-filters__tag ${
                selectedTags().includes(tag)
                  ? "creator-filters__tag--active"
                  : ""
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
