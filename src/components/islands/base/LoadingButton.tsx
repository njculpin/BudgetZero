import type { JSX } from "solid-js";

interface LoadingButtonProps {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children: JSX.Element;
  loadingText?: string;
}

export default function LoadingButton(props: LoadingButtonProps) {
  const variantClass = props.variant ? `button--${props.variant}` : "button--primary";
  const sizeClass = props.size ? `button--${props.size}` : "button--md";
  const isDisabled = props.disabled || props.isLoading;

  return (
    <button
      type={props.type || "button"}
      class={`button ${variantClass} ${sizeClass} ${props.isLoading ? "button--loading" : ""}`}
      disabled={isDisabled}
      onClick={props.onClick}
    >
      {props.isLoading && (
        <svg
          class="button__spinner"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
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
        {props.isLoading && props.loadingText ? props.loadingText : props.children}
      </span>
    </button>
  );
}
