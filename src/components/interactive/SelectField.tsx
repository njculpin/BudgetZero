import { For } from "solid-js";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  id?: string;
  value: string;
  onChange: (e: Event) => void;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
}

export default function SelectField(props: SelectFieldProps) {
  const fieldId = props.id || props.name;
  const hasError = !!props.error;

  return (
    <div class="form-field">
      <label for={fieldId} class="form-field__label">
        {props.label}
        {props.required && <span class="form-field__required">*</span>}
      </label>
      <select
        name={props.name}
        id={fieldId}
        class={`form-field__select ${hasError ? "form-field__select--error" : ""}`}
        value={props.value}
        onChange={props.onChange}
        required={props.required}
        disabled={props.disabled}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${fieldId}-error` : props.helpText ? `${fieldId}-help` : undefined
        }
      >
        <For each={props.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>
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
