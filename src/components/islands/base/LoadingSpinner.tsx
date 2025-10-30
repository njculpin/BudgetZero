interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function LoadingSpinner(props: LoadingSpinnerProps) {
  const sizeClass = props.size ? `loading-spinner--${props.size}` : "loading-spinner--md";

  return (
    <div class="loading-spinner-container">
      <div class={`loading-spinner ${sizeClass}`} role="status" aria-label={props.label || "Loading"}>
        <svg class="loading-spinner__svg" viewBox="0 0 50 50">
          <circle
            class="loading-spinner__circle"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke-width="5"
          />
        </svg>
      </div>
      {props.label && <span class="loading-spinner__label">{props.label}</span>}
    </div>
  );
}
