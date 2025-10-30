import { createSignal } from "solid-js";
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
  const [avatarUrl, setAvatarUrl] = createSignal<string>(props.avatarUrl || "");
  const [error, setError] = createSignal<string>("");
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("handle", handle());
      formData.append("name", name());
      formData.append("bio", bio());
      formData.append("avatar_url", avatarUrl());

      const response = await fetch("/api/users/update-user", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update profile. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success - get redirect URL from response
      const data = await response.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div class="card edit-profile-card">
      <div class="card-header">
        <h2 class="card-title">Edit Profile</h2>
        <p class="card-description">Update your public profile information</p>
      </div>

      <div class="card-content">
        <form onSubmit={handleSubmit} class="edit-profile-form">
          {error() && (
            <div class="edit-profile-form__error" role="alert">
              {error()}
            </div>
          )}

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
              onInput={(e: InputEvent) =>
                setHandle((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="your-handle"
              required
              disabled={isLoading()}
            />
            <p class="edit-profile-form__help">
              Your unique username. This will be part of your profile URL.
            </p>
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
              onInput={(e: InputEvent) =>
                setName((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="Your Name"
              disabled={isLoading()}
            />
            <p class="edit-profile-form__help">
              Your full name or display name.
            </p>
          </div>

          <div class="edit-profile-form__field">
            <label for="bio" class="label">
              Bio
            </label>
            <textarea
              name="bio"
              id="bio"
              class="edit-profile-form__textarea"
              value={bio()}
              onInput={(e: InputEvent) =>
                setBio((e.currentTarget as HTMLTextAreaElement).value)
              }
              placeholder="Tell us about yourself..."
              rows={4}
              disabled={isLoading()}
            />
            <p class="edit-profile-form__help">
              A short description about yourself and what you create.
            </p>
          </div>

          <div class="edit-profile-form__field">
            <label for="avatar_url" class="label">
              Avatar URL
            </label>
            <input
              type="url"
              name="avatar_url"
              id="avatar_url"
              class="input"
              value={avatarUrl()}
              onInput={(e: InputEvent) =>
                setAvatarUrl((e.currentTarget as HTMLInputElement).value)
              }
              placeholder="https://example.com/avatar.jpg"
              disabled={isLoading()}
            />
            <p class="edit-profile-form__help">
              URL to your profile picture. Avatar upload coming soon!
            </p>
          </div>

          <div class="edit-profile-form__actions">
            <a href={`/users/${props.userHandle}`}>
              <button type="button" class="button button--ghost button--md">
                <span class="button__text">Cancel</span>
              </button>
            </a>
            <button
              type="submit"
              class="button button--primary button--md"
              disabled={isLoading()}
            >
              <span class="button__text">
                {isLoading() ? "Saving..." : "Save Changes"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
