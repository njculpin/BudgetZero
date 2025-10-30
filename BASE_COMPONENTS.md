# Base Component Library

Reusable SolidJS components for building consistent forms and UI throughout the application.

## 📦 Installation

All base components are located in `src/components/islands/base/`

Import components:
```typescript
import { FormField, ErrorMessage, LoadingButton } from "@/components/islands/base";
import "@/components/islands/base/base.css";
```

---

## 🎨 Form Field Components

### FormField

Text input field with label, error, and help text support.

**Props:**
```typescript
interface FormFieldProps {
  label: string;              // Field label
  name: string;                // Input name attribute
  id?: string;                 // Input ID (defaults to name)
  type?: string;               // Input type (default: "text")
  value: string | number;      // Current value
  onInput: (e: InputEvent) => void; // Input handler
  placeholder?: string;        // Placeholder text
  required?: boolean;          // Mark as required
  disabled?: boolean;          // Disable input
  error?: string;              // Error message to display
  helpText?: string;           // Help text below input
  autocomplete?: string;       // Autocomplete attribute
  min?: number;                // Min value (for number inputs)
  max?: number;                // Max value (for number inputs)
  step?: number;               // Step value (for number inputs)
}
```

**Usage:**
```tsx
import { createSignal } from "solid-js";
import { FormField } from "@/components/islands/base";

const [email, setEmail] = createSignal("");
const [emailError, setEmailError] = createSignal("");

<FormField
  label="Email Address"
  name="email"
  type="email"
  value={email()}
  onInput={(e) => setEmail(e.currentTarget.value)}
  placeholder="you@example.com"
  required
  error={emailError()}
  helpText="We'll never share your email"
/>
```

### TextAreaField

Multi-line text input with label, error, and help text support.

**Props:**
```typescript
interface TextAreaFieldProps {
  label: string;
  name: string;
  id?: string;
  value: string;
  onInput: (e: InputEvent) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  rows?: number;              // Number of rows (default: 4)
}
```

**Usage:**
```tsx
const [bio, setBio] = createSignal("");

<TextAreaField
  label="Bio"
  name="bio"
  value={bio()}
  onInput={(e) => setBio(e.currentTarget.value)}
  placeholder="Tell us about yourself..."
  rows={6}
  helpText="Maximum 500 characters"
/>
```

### SelectField

Dropdown select field with label, error, and help text support.

**Props:**
```typescript
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
  options: SelectOption[];    // Array of options
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
}
```

**Usage:**
```tsx
const [status, setStatus] = createSignal("draft");

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

<SelectField
  label="Status"
  name="status"
  value={status()}
  onChange={(e) => setStatus(e.currentTarget.value)}
  options={statusOptions}
  helpText="Choose the visibility status"
/>
```

### FileUploadField

File upload field with drag-and-drop support, preview, and validation.

**Props:**
```typescript
interface FileUploadFieldProps {
  label: string;
  name: string;
  id?: string;
  accept?: string;              // File types (e.g., "image/*", ".pdf")
  multiple?: boolean;           // Allow multiple files
  maxSizeMB?: number;           // Max file size (default: 10MB)
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  onFilesSelected: (files: File[]) => void;  // Called when files are selected
  onError?: (error: string) => void;         // Called on validation error
  showPreview?: boolean;        // Show image previews (default: false)
}
```

**Usage:**
```tsx
const [files, setFiles] = createSignal<File[]>([]);
const [uploadError, setUploadError] = createSignal("");

<FileUploadField
  label="Upload Images"
  name="images"
  accept="image/*"
  multiple
  maxSizeMB={5}
  showPreview
  onFilesSelected={(selectedFiles) => setFiles(selectedFiles)}
  onError={(error) => setUploadError(error)}
  helpText="Upload product images (max 5MB each)"
/>
```

### FileUpload (Higher-Level Component)

Complete file upload component with API integration and progress tracking.

**Props:**
```typescript
interface FileUploadProps {
  label: string;
  name: string;
  bucket: StorageBucket;        // Storage bucket: "asset-files", "asset-images", etc.
  prefix?: string;              // Optional path prefix (e.g., productId)
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  required?: boolean;
  helpText?: string;
  showPreview?: boolean;
  onUploadComplete?: (files: UploadedFile[]) => void;  // Called after successful upload
  onUploadError?: (error: string) => void;             // Called on upload error
}

interface UploadedFile {
  path: string;     // Storage path
  url: string;      // Public URL
  size: number;     // File size in bytes
  type: string;     // MIME type
}
```

**Usage:**
```tsx
const [coverImageUrl, setCoverImageUrl] = createSignal("");

<FileUpload
  label="Product Cover Image"
  name="cover_image"
  bucket="product-images"
  prefix={productId}
  accept="image/*"
  maxSizeMB={10}
  showPreview
  onUploadComplete={(files) => {
    setCoverImageUrl(files[0].url);
  }}
  onUploadError={(error) => {
    console.error("Upload failed:", error);
  }}
  helpText="Upload a cover image for your product"
/>
```

**Storage Buckets:**
- `asset-files` - Digital assets (PDFs, ZIPs, 3D models) - Max 100MB
- `asset-images` - Asset preview images - Max 10MB
- `product-images` - Product cover/variant images - Max 10MB
- `user-avatars` - User profile avatars - Max 5MB
- `documents` - PDF documents - Max 50MB

---

## 💬 Feedback Components

### ErrorMessage

Displays error messages with optional dismiss button.

**Props:**
```typescript
interface ErrorMessageProps {
  message: string;            // Error message
  onDismiss?: () => void;     // Optional dismiss handler
}
```

**Usage:**
```tsx
const [error, setError] = createSignal("");

{error() && (
  <ErrorMessage
    message={error()}
    onDismiss={() => setError("")}
  />
)}
```

### SuccessMessage

Displays success messages with optional dismiss button.

**Props:**
```typescript
interface SuccessMessageProps {
  message: string;            // Success message
  onDismiss?: () => void;     // Optional dismiss handler
}
```

**Usage:**
```tsx
const [success, setSuccess] = createSignal("");

{success() && (
  <SuccessMessage
    message={success()}
    onDismiss={() => setSuccess("")}
  />
)}
```

---

## ⏳ Loading Components

### LoadingSpinner

Animated loading spinner.

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";  // Spinner size (default: "md")
  label?: string;              // Optional label below spinner
}
```

**Usage:**
```tsx
<LoadingSpinner size="lg" label="Loading data..." />
```

### LoadingButton

Button with built-in loading state and spinner.

**Props:**
```typescript
interface LoadingButtonProps {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading: boolean;          // Show loading state
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children: JSX.Element;       // Button text/content
  loadingText?: string;        // Text to show when loading
}
```

**Usage:**
```tsx
const [isLoading, setIsLoading] = createSignal(false);

<LoadingButton
  type="submit"
  variant="primary"
  size="md"
  isLoading={isLoading()}
  loadingText="Saving..."
>
  Save Changes
</LoadingButton>
```

---

## 🗨️ Dialog Components

### ConfirmDialog

Modal confirmation dialog for destructive actions.

**Props:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;             // Dialog visibility
  title: string;               // Dialog title
  message: string;             // Confirmation message
  confirmText?: string;        // Confirm button text (default: "Confirm")
  cancelText?: string;         // Cancel button text (default: "Cancel")
  variant?: "danger" | "warning" | "info"; // Visual style (default: "info")
  onConfirm: () => void;       // Confirm handler
  onCancel: () => void;        // Cancel handler
}
```

**Usage:**
```tsx
const [showDeleteDialog, setShowDeleteDialog] = createSignal(false);

const handleDelete = async () => {
  setShowDeleteDialog(false);
  // Perform delete action
};

<button onClick={() => setShowDeleteDialog(true)}>
  Delete Item
</button>

<ConfirmDialog
  isOpen={showDeleteDialog()}
  title="Delete Item"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteDialog(false)}
/>
```

---

## 📚 Complete Form Example

Here's a complete example using multiple base components:

```tsx
import { createSignal } from "solid-js";
import {
  FormField,
  TextAreaField,
  SelectField,
  ErrorMessage,
  LoadingButton,
  ConfirmDialog,
} from "@/components/islands/base";
import "@/components/islands/base/base.css";

export default function MyForm() {
  // Form state
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [status, setStatus] = createSignal("draft");

  // UI state
  const [error, setError] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [showConfirm, setShowConfirm] = createSignal(false);

  // Validation
  const [titleError, setTitleError] = createSignal("");

  const validateTitle = () => {
    if (!title()) {
      setTitleError("Title is required");
      return false;
    }
    setTitleError("");
    return true;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");

    if (!validateTitle()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title(),
          description: description(),
          status: status(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save");
        setIsLoading(false);
        return;
      }

      // Success - redirect or show success message
      const data = await response.json();
      window.location.href = `/items/${data.item.id}`;
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setShowConfirm(false);
    // Perform delete action
  };

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ];

  return (
    <form onSubmit={handleSubmit} class="my-form">
      {error() && (
        <ErrorMessage
          message={error()}
          onDismiss={() => setError("")}
        />
      )}

      <FormField
        label="Title"
        name="title"
        type="text"
        value={title()}
        onInput={(e) => {
          setTitle(e.currentTarget.value);
          setTitleError("");
        }}
        placeholder="Enter title"
        required
        disabled={isLoading()}
        error={titleError()}
        helpText="Give your item a descriptive title"
      />

      <TextAreaField
        label="Description"
        name="description"
        value={description()}
        onInput={(e) => setDescription(e.currentTarget.value)}
        placeholder="Describe your item..."
        rows={6}
        disabled={isLoading()}
        helpText="Provide details about your item"
      />

      <SelectField
        label="Status"
        name="status"
        value={status()}
        onChange={(e) => setStatus(e.currentTarget.value)}
        options={statusOptions}
        disabled={isLoading()}
        helpText="Choose visibility status"
      />

      <div class="form-actions">
        <button
          type="button"
          class="button button--ghost button--md"
          onClick={handleDelete}
          disabled={isLoading()}
        >
          Delete
        </button>

        <LoadingButton
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading()}
          loadingText="Saving..."
        >
          Save Changes
        </LoadingButton>
      </div>

      <ConfirmDialog
        isOpen={showConfirm()}
        title="Delete Item"
        message="Are you sure? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </form>
  );
}
```

---

## 🎨 Styling

All components use BEM CSS and rely on CSS custom properties defined in your global styles:

**Required CSS Variables:**
- `--foreground` - Primary text color
- `--muted-foreground` - Secondary text color
- `--background` - Background color
- `--card` - Card background
- `--border` - Border color
- `--input` - Input border color
- `--ring` - Focus ring color
- `--primary` - Primary button color
- `--primary-foreground` - Primary button text
- `--destructive` - Error/danger color
- `--muted` - Muted background
- Various spacing/sizing variables

**Import the base styles:**
```css
@import "@/components/islands/base/base.css";
```

---

## ♿ Accessibility

All components follow accessibility best practices:

- **Semantic HTML** - Uses appropriate HTML elements
- **ARIA attributes** - Includes aria-labels, aria-invalid, aria-describedby
- **Keyboard navigation** - Full keyboard support
- **Focus management** - Visible focus indicators
- **Screen reader support** - Descriptive labels and status messages
- **Error association** - Errors properly linked to form fields

---

## 📝 Validation Pattern

Recommended validation pattern using Zod on the client:

```tsx
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  email: z.string().email("Invalid email address"),
  status: z.enum(["draft", "published"]),
});

type FormData = z.infer<typeof formSchema>;

// In your component
const validate = (): boolean => {
  try {
    formSchema.parse({
      title: title(),
      email: email(),
      status: status(),
    });
    return true;
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Set individual field errors
      err.errors.forEach((error) => {
        const field = error.path[0];
        if (field === "title") setTitleError(error.message);
        if (field === "email") setEmailError(error.message);
      });
    }
    return false;
  }
};
```

---

## 🚀 Next Steps

With these base components, you can now:

1. ✅ Build consistent forms across the application
2. ✅ Have standardized error handling
3. ✅ Use loading states everywhere
4. ✅ Add confirmations for destructive actions
5. ✅ Handle file uploads with drag-and-drop
6. ✅ Maintain accessibility standards

**Ready to use in:**
- Cart island components (AddToCartButton, CartItemRow, CheckoutButton)
- Checkout forms
- Product/Asset edit forms (with file upload support)
- User profile forms (avatar upload)
- Any new forms you create
