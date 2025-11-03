import type { JSX } from "solid-js";
import "./LoadingButton.css";

interface LoadingButtonProps {
  type?: "button" | "submit" | "reset";
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "ghost-secondary"
    | "outline"
    | "destructive"
    | "accent"
    | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  disabled?: boolean;
  class?: string;
  onClick?: (e: MouseEvent) => void;
  children: JSX.Element;
  loadingText?: string;
}

export default function LoadingButton(props: LoadingButtonProps) {
  const variantClass = () => props.variant
    ? `button--${props.variant}`
    : "button--primary";
  const sizeClass = () => props.size ? `button--${props.size}` : "button--md";

  const classes = () => [
    "button",
    variantClass(),
    sizeClass(),
    props.isLoading ? "button--loading" : "",
    props.class,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={props.type || "submit"}
      class={classes()}
      disabled={props.disabled || props.isLoading}
      onClick={props.onClick}
    >
      {props.isLoading && (
        <svg
          class="button__spinner"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="status"
          aria-hidden="true"
        >
          <circle
            class="button__spinner-track"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="button__spinner-path"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span class="button__text">
        {props.isLoading && props.loadingText
          ? props.loadingText
          : props.children}
      </span>
    </button>
  );
}
