import { createSignal, For } from 'solid-js';
import './TagInput.css';

interface TagInputProps {
  name: string;
  placeholder: string;
  initialTags?: string[];
  onChange?: (tags: string[]) => void;
}

export default function TagInput(props: TagInputProps) {
  const placeholder = props.placeholder
  const [tags, setTags] = createSignal<string[]>(props.initialTags || []);
  const [inputValue, setInputValue] = createSignal('');

  const addTag = () => {
    const value = inputValue().trim();
    if (value && !tags().includes(value)) {
      const newTags = [...tags(), value];
      setTags(newTags);
      setInputValue('');
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
      addTag();
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
        <input
          type="text"
          class="tag-input__input"
          placeholder={placeholder}
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          class="tag-input__add-button"
          onClick={addTag}
        >
          Add
        </button>
      </div>
    </div>
  );
}
