import type { JSX } from "solid-js";

interface FormFieldProps {
  label: string;
  name: string;
  id?: string;
  type?: "text" | "email" | "password" | "number" | "url" | "tel";
  value: string | number;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  autocomplete?: string;
  min?: number;
  max?: number;
  step?: number;
}

export default function FormField(props: FormFieldProps) {
  const fieldId = props.id || props.name;
  const hasError = !!props.error;

  return (
    <div class="form-field">
      <label for={fieldId} class="form-field__label">
        {props.label}
        {props.required && <span class="form-field__required">*</span>}
      </label>
      <input
        type={props.type || "text"}
        name={props.name}
        id={fieldId}
        class={`form-field__input ${hasError ? "form-field__input--error" : ""}`}
        value={props.value}
        onInput={props.onInput}
        placeholder={props.placeholder}
        required={props.required}
        disabled={props.disabled}
        autocomplete={props.autocomplete}
        min={props.min}
        max={props.max}
        step={props.step}
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
