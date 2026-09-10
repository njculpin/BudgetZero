import { createSignal, Show } from 'solid-js';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { ErrorMessage } from '@/components/interactive';
import TagInput from '@/components/interactive/tag-input/tag-input';
import '@/components/interactive/base.css';
import SaveStatus from '../../interactive/save-status/save-status';

export interface ProductTagsFormProps {
  productId: string;
  initialTags: string[];
}

export default function ProductTagsForm(props: ProductTagsFormProps) {
  const [tags, setTags] = createSignal<string[]>(props.initialTags);
  const [error, setError] = createSignal('');

  // Auto-save handler
  const saveData = async () => {
    setError('');

    const formData = new FormData();
    formData.append('productId', props.productId);
    formData.append('tags', JSON.stringify(tags()));

    const response = await fetch('/api/products/update-product', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage = data.error || 'Failed to update tags';
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
    <div class="product-form">
      <Show when={error()}>
        <ErrorMessage message={error()} onDismiss={() => setError('')} />
      </Show>

      {/* Save Status Indicator */}
      <div class="product-form__save-status">
        <SaveStatus status={autoSave.saveStatus()} />
      </div>

      <div class="form-field">
        <label class="form-field__label">Tags</label>
        <TagInput
          name="tags"
          placeholder="Add tags (press Enter)"
          initialTags={tags()}
          onChange={handleTagsChange}
        />
        <p class="form-field__help-text">
          Add tags to help users discover your product (e.g., "rpg", "fantasy",
          "miniatures")
        </p>
      </div>
    </div>
  );
}
