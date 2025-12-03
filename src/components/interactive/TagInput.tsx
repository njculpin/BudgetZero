import { createSignal, For, Show, onCleanup, createEffect } from 'solid-js';
import './tag-input.css';

interface TagInputProps {
  name: string;
  placeholder: string;
  initialTags?: string[];
  onChange?: (tags: string[]) => void;
}

interface TagSuggestion {
  value: string;
  count: number;
}

export default function TagInput(props: TagInputProps) {
  const placeholder = props.placeholder
  const [tags, setTags] = createSignal<string[]>(props.initialTags || []);
  const [inputValue, setInputValue] = createSignal('');
  const [suggestions, setSuggestions] = createSignal<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [selectedIndex, setSelectedIndex] = createSignal(-1);
  const [isLoading, setIsLoading] = createSignal(false);

  let inputRef: HTMLInputElement | undefined;
  let dropdownRef: HTMLDivElement | undefined;
  let fetchTimeout: ReturnType<typeof setTimeout> | undefined;

  // Cleanup timeout on unmount
  onCleanup(() => {
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }
  });

  // Fetch suggestions when input changes
  createEffect(() => {
    const value = inputValue().trim();

    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }

    if (!value) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce fetch
    fetchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tags/suggestions?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out already added tags
          const filtered = data.filter((s: TagSuggestion) => !tags().includes(s.value));
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch (error) {
        console.error('Failed to fetch tag suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  });

  const addTag = (value?: string) => {
    const tagValue = (value || inputValue()).trim();
    if (tagValue && !tags().includes(tagValue)) {
      const newTags = [...tags(), tagValue];
      setTags(newTags);
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      if (props.onChange) props.onChange(newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags().filter(tag => tag !== tagToRemove);
    setTags(newTags);
    if (props.onChange) props.onChange(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const selected = selectedIndex();
      if (selected >= 0 && suggestions()[selected]) {
        addTag(suggestions()[selected].value);
      } else {
        addTag();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex() + 1, suggestions().length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex() - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div class="tag-input">
      <input
        type="hidden"
        name={props.name}
        value={JSON.stringify(tags())}
      />

      <div class="tag-input__tags">
        <For each={tags()}>
          {(tag) => (
            <div class="tag-input__tag">
              <span class="tag-input__tag-text">{tag}</span>
              <button
                type="button"
                class="tag-input__tag-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </div>
          )}
        </For>
      </div>

      <div class="tag-input__input-wrapper">
        <div class="tag-input__autocomplete">
          <input
            ref={inputRef}
            type="text"
            class="tag-input__input"
            placeholder={placeholder}
            value={inputValue()}
            onInput={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions().length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          <Show when={showSuggestions() && suggestions().length > 0}>
            <div ref={dropdownRef} class="tag-input__suggestions">
              <For each={suggestions()}>
                {(suggestion, index) => (
                  <button
                    type="button"
                    class={`tag-input__suggestion ${
                      index() === selectedIndex() ? 'tag-input__suggestion--selected' : ''
                    }`}
                    onClick={() => addTag(suggestion.value)}
                    onMouseEnter={() => setSelectedIndex(index())}
                  >
                    <span class="tag-input__suggestion-value">{suggestion.value}</span>
                    <span class="tag-input__suggestion-count">{suggestion.count}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
          <Show when={isLoading()}>
            <div class="tag-input__loading">Loading...</div>
          </Show>
        </div>
        <button
          type="button"
          class="tag-input__add-button"
          onClick={() => addTag()}
        >
          Add
        </button>
      </div>
    </div>
  );
}
