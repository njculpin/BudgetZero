import type { JSX } from "solid-js";

interface TextAreaFieldProps {
  label: string;
  name: string;
  id?: string;
  value: string;
  onInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  rows?: number;
}

export default function TextAreaField(props: TextAreaFieldProps) {
  let textareaRef: HTMLTextAreaElement | undefined;
  const fieldId = props.id || props.name;
  const hasError = !!props.error;

  return (
    <div class="form-field">
      <label for={fieldId} class="form-field__label">
        {props.label}
        {props.required && <span class="form-field__required">*</span>}
      </label>
      <textarea
        ref={textareaRef}
        name={props.name}
        id={fieldId}
        class={`form-field__textarea ${hasError ? "form-field__textarea--error" : ""}`}
        value={props.value}
        onInput={props.onInput}
        placeholder={props.placeholder}
        required={props.required}
        disabled={props.disabled}
        rows={props.rows || 4}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${fieldId}-error` : props.helpText ? `${fieldId}-help` : undefined
        }
      />
      {hasError && (
        <span id={`${fieldId}-error`} class="form-field__error" role="alert">
          {props.error}
        </span>
      )}
      {!hasError && props.helpText && (
        <span id={`${fieldId}-help`} class="form-field__help">
          {props.helpText}
        </span>
      )}
    </div>
  );
}
