import { Show, createEffect, onCleanup } from "solid-js";
import { type JSX, type ParentComponent } from "solid-js";
import "./modal.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: JSX.Element;
}

// Focusable element selectors for accessibility
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function Modal(props: ModalProps) {
  let modalRef: HTMLDivElement | undefined;
  let previouslyFocusedElement: HTMLElement | null = null;

  const size = props.size || "md";
  const showCloseButton = props.showCloseButton !== false; // default true
  const closeOnOverlayClick = props.closeOnOverlayClick !== false; // default true
  const closeOnEscape = props.closeOnEscape !== false; // default true

  // Handle escape key
  createEffect(() => {
    if (props.isOpen && closeOnEscape) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          props.onClose();
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  });

  // Prevent body scroll when modal is open
  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  });

  // Focus management and trap
  createEffect(() => {
    if (props.isOpen && modalRef) {
      // Store previously focused element
      previouslyFocusedElement = document.activeElement as HTMLElement;

      // Find all focusable elements in modal
      const focusableElements = modalRef.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      // Focus first element
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 0);
      }

      // Handle tab key to trap focus
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef) return;

        // Get currently focused element
        const focusedElement = document.activeElement;
        const focusedIndex = Array.from(focusableElements).indexOf(focusedElement as HTMLElement);

        if (e.shiftKey) {
          // Shift + Tab - move backwards
          if (focusedElement === firstFocusable || focusedIndex === -1) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab - move forwards
          if (focusedElement === lastFocusable || focusedIndex === -1) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      };

      window.addEventListener('keydown', handleTabKey);

      // Cleanup
      onCleanup(() => {
        window.removeEventListener('keydown', handleTabKey);

        // Restore focus to previously focused element
        if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
          previouslyFocusedElement.focus();
        }
      });
    }
  });

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      props.onClose();
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class="modal__overlay" onClick={handleOverlayClick}>
        <div
          ref={modalRef}
          class={`modal__content modal__content--${size}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={props.title ? "modal-title" : undefined}
        >
          <Show when={props.title || showCloseButton}>
            <div class="modal__header">
              <Show when={props.title}>
                <h2 id="modal-title" class="modal__title">
                  {props.title}
                </h2>
              </Show>
              <Show when={showCloseButton}>
                <button
                  type="button"
                  class="modal__close"
                  onClick={props.onClose}
                  aria-label="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </Show>
            </div>
          </Show>

          <div class="modal__body">{props.children}</div>
        </div>
      </div>
    </Show>
  );
}

// Specialized Modal Components

export interface ModalHeaderProps {
  children: JSX.Element;
  icon?: JSX.Element;
  centered?: boolean;
}

export const ModalHeader: ParentComponent<ModalHeaderProps> = (props) => {
  return (
    <div
      class="modal__custom-header"
      classList={{ "modal__custom-header--centered": props.centered }}
    >
      <Show when={props.icon}>
        <div class="modal__icon-wrapper">{props.icon}</div>
      </Show>
      {props.children}
    </div>
  );
};

export interface ModalFooterProps {
  children: JSX.Element;
  justify?: "start" | "end" | "center" | "between";
}

export const ModalFooter: ParentComponent<ModalFooterProps> = (props) => {
  const justify = props.justify || "end";
  return (
    <div class={`modal__footer modal__footer--${justify}`}>
      {props.children}
    </div>
  );
};

// Confirm Dialog Variant

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal(props: ConfirmModalProps) {
  const confirmText = props.confirmText || "Confirm";
  const cancelText = props.cancelText || "Cancel";
  const variant = props.variant || "info";

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.title}
      size="sm"
    >
      <div class="modal__message">{props.message}</div>
      <ModalFooter>
        <button
          type="button"
          class="button button--ghost button--md"
          onClick={props.onClose}
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
      </ModalFooter>
    </Modal>
  );
}
