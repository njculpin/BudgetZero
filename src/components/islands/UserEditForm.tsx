import { createSignal, onCleanup } from "solid-js";
import "./UserEditForm.css";

interface UserEditFormProps {
  handle: string;
  name: string;
  bio: string;
  avatarUrl: string;
  userHandle: string;
}

export default function UserEditForm(props: UserEditFormProps) {
  const [handle, setHandle] = createSignal<string>(props.handle);
  const [name, setName] = createSignal<string>(props.name || "");
  const [bio, setBio] = createSignal<string>(props.bio || "");
  const [error, setError] = createSignal<string>("");
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  const [saveStatus, setSaveStatus] = createSignal<string>("");
  const [avatarPreview, setAvatarPreview] = createSignal<string>(props.avatarUrl || "");

  let saveTimeout: number | undefined;

  // Cleanup timeout on component unmount
  onCleanup(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  });

  // Auto-save function
  const saveProfile = async (avatarFile?: File) => {
    setError("");
    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      const formData = new FormData();
      formData.append("handle", handle());
      formData.append("name", name());
      formData.append("bio", bio());

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await fetch("/api/users/update-user", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save changes");
        setSaveStatus("");
        setIsSaving(false);
        return;
      }

      setSaveStatus("Saved");
      setIsSaving(false);

      // Clear status after 2 seconds
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      setError("Failed to save changes");
      setSaveStatus("");
      setIsSaving(false);
    }
  };

  // Debounced save
  const debouncedSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    setSaveStatus("Unsaved changes...");
    saveTimeout = window.setTimeout(() => {
      saveProfile();
    }, 1000);
  };

  // Handle avatar upload immediately
  const handleAvatarSelect = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    await saveProfile(file);
  };

  return (
    <div class="edit-profile-form">
      {/* Save Status Indicator */}
      {saveStatus() && (
        <div class={`edit-profile-form__status edit-profile-form__status--${saveStatus() === 'Saved' ? 'success' : 'pending'}`}>
          {saveStatus()}
        </div>
      )}

      {error() && (
        <div class="edit-profile-form__error" role="alert">
          {error()}
        </div>
      )}

      <div class="edit-profile-form__field">
        {/* Avatar Preview */}
        <div class="avatar-upload__preview-wrapper">
          {avatarPreview() ? (
            <img
              src={avatarPreview()}
              alt="Avatar preview"
              class="avatar-upload__preview"
            />
          ) : (
            <div class="avatar-upload__placeholder">
              {(name() || handle()).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* File Upload */}
        <label for="avatar_file" class="avatar-upload__label">
          <input
            type="file"
            id="avatar_file"
            class="avatar-upload__input"
            accept="image/*"
            onChange={handleAvatarSelect}
            disabled={isSaving()}
          />
          <span class="button button--ghost button--md">
            <span class="button__text">
              {isSaving() ? "Uploading..." : "Choose Image"}
            </span>
          </span>
        </label>
      </div>

      <div class="edit-profile-form__field">
        <label for="handle" class="label">
          Handle
        </label>
        <input
          type="text"
          name="handle"
          id="handle"
          class="input"
          value={handle()}
          onInput={(e: InputEvent) => {
            setHandle((e.currentTarget as HTMLInputElement).value);
            debouncedSave();
          }}
          placeholder="your-handle"
          required
          disabled={isSaving()}
        />
      </div>

      <div class="edit-profile-form__field">
        <label for="name" class="label">
          Display Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          class="input"
          value={name()}
          onInput={(e: InputEvent) => {
            setName((e.currentTarget as HTMLInputElement).value);
            debouncedSave();
          }}
          placeholder="Your Name"
          disabled={isSaving()}
        />
      </div>

      <div class="edit-profile-form__field">
        <label for="bio" class="label">
          Bio
        </label>
        <textarea
          name="bio"
          id="bio"
          class="edit-profile-form__textarea"
          onInput={(e: InputEvent) => {
            setBio((e.currentTarget as HTMLTextAreaElement).value);
            debouncedSave();
          }}
          placeholder="Tell us about yourself..."
          rows={4}
          disabled={isSaving()}
        >{bio()}</textarea>
      </div>
    </div>
  );
}
