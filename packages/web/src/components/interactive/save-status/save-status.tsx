import { Show } from 'solid-js';
import './save-status.css';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveStatusProps {
  status: SaveState;
}

/**
 * The auto-save indicator shown beside a form.
 *
 * Three forms carried a byte-identical copy of this markup — the three `Show`
 * blocks and, more importantly, the `role`, `aria-live` and `aria-atomic`
 * attributes that make the state change audible to a screen reader. Duplicated
 * accessibility markup is the kind that drifts: fix one copy and the other two
 * quietly stay broken.
 */
export default function SaveStatus(props: SaveStatusProps) {
  return (
    <>
      <Show when={props.status === 'saving'}>
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
      <Show when={props.status === 'saved'}>
        <span
          class="save-status save-status--saved"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          ✓ Saved
        </span>
      </Show>
      <Show when={props.status === 'error'}>
        <span
          class="save-status save-status--error"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          ✗ Save failed
        </span>
      </Show>
    </>
  );
}
