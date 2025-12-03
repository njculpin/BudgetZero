import { Show, createEffect } from "solid-js";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  const confirmText = props.confirmText || "Confirm";
  const cancelText = props.cancelText || "Cancel";
  const variant = props.variant || "info";

  // Handle escape key
  createEffect(() => {
    if (props.isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          props.onCancel();
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  });

  // Prevent body scroll when dialog is open
  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  });

  return (
    <Show when={props.isOpen}>
      <div class="confirm-dialog-overlay" onClick={props.onCancel}>
        <div
          class="confirm-dialog"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-message"
        >
          <div class="confirm-dialog__header">
            <h2 id="dialog-title" class="confirm-dialog__title">
              {props.title}
            </h2>
            <button
              type="button"
              class="confirm-dialog__close"
              onClick={props.onCancel}
              aria-label="Close dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <div class="confirm-dialog__body">
            <p id="dialog-message" class="confirm-dialog__message">
              {props.message}
            </p>
          </div>

          <div class="confirm-dialog__footer">
            <button
              type="button"
              class="button button--ghost button--md"
              onClick={props.onCancel}
            >
              <span class="button__text">{cancelText}</span>
            </button>
            <button
              type="button"
              class={`button button--${variant === "danger" ? "destructive" : "primary"} button--md`}
              onClick={props.onConfirm}
            >
              <span class="button__text">{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
