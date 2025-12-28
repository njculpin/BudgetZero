import { Show } from "solid-js";
import "./dialog.css";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: any;
  size?: "sm" | "md" | "lg";
}

export default function Dialog(props: DialogProps) {
  const sizeClass = props.size ? `dialog--${props.size}` : "dialog--md";

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  return (
    <Show when={props.open}>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onKeyDown={handleKeyDown}
      >
        <div class="dialog__overlay" onClick={handleOverlayClick} />
        <div class={`dialog__content ${sizeClass}`}>
          <div class="dialog__header">
            <h2 id="dialog-title" class="dialog__title">
              {props.title}
            </h2>
            <button
              type="button"
              class="dialog__close"
              onClick={props.onClose}
              aria-label="Close dialog"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="dialog__body">{props.children}</div>
        </div>
      </div>
    </Show>
  );
}
