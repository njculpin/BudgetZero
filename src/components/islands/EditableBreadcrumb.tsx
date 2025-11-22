import { createSignal, Show } from "solid-js";
import "./editable-breadcrumb.css";

interface EditableBreadcrumbProps {
  entityId: string;
  entityType: "asset" | "product" | "document";
  currentTitle: string;
  breadcrumbItems: Array<{
    label: string;
    href: string;
  }>;
}

export default function EditableBreadcrumb(props: EditableBreadcrumbProps) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [title, setTitle] = createSignal(props.currentTitle);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  let inputRef: HTMLInputElement | undefined;

  const getEndpoint = () => {
    switch (props.entityType) {
      case "asset":
        return "/api/assets/update-asset";
      case "product":
        return "/api/products/update-product";
      case "document":
        return "/api/documents/update-document";
    }
  };

  const getParamName = () => {
    switch (props.entityType) {
      case "asset":
        return "assetId";
      case "product":
        return "productId";
      case "document":
        return "documentId";
    }
  };

  const getUrlSegment = () => {
    switch (props.entityType) {
      case "asset":
        return "assets";
      case "product":
        return "products";
      case "document":
        return "documents";
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setError("");
    // Focus input after render
    setTimeout(() => inputRef?.focus(), 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTitle(props.currentTitle);
    setError("");
  };

  const saveTitle = async () => {
    const newTitle = title().trim();
    if (!newTitle) {
      setError("Title cannot be empty");
      return;
    }

    if (newTitle === props.currentTitle) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append(getParamName(), props.entityId);
      formData.append("title", newTitle);

      const response = await fetch(getEndpoint(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update title");
      }

      const data = await response.json();

      // Get the new handle from response and redirect
      const newHandle = data[props.entityType]?.handle || data.handle;
      if (newHandle) {
        window.location.href = `/${getUrlSegment()}/${newHandle}`;
      } else {
        // Fallback: just update the title and close edit mode
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <nav class="editable-breadcrumb" aria-label="Breadcrumb">
      <ol class="editable-breadcrumb__list">
        {props.breadcrumbItems.map((item) => (
          <li class="editable-breadcrumb__item">
            <a href={item.href} class="editable-breadcrumb__link">
              {item.label}
            </a>
          </li>
        ))}
        <li class="editable-breadcrumb__item editable-breadcrumb__item--current">
          <Show
            when={isEditing()}
            fallback={
              <button
                type="button"
                class="editable-breadcrumb__title-btn"
                onClick={startEditing}
                title="Click to edit title"
              >
                <span class="editable-breadcrumb__current">{title()}</span>
                <svg
                  class="editable-breadcrumb__edit-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            }
          >
            <div class="editable-breadcrumb__edit-form">
              <input
                ref={inputRef}
                type="text"
                class="editable-breadcrumb__input"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  // Small delay to allow button clicks
                  setTimeout(() => {
                    if (isEditing() && !isLoading()) {
                      cancelEditing();
                    }
                  }, 150);
                }}
                disabled={isLoading()}
                placeholder="Enter title..."
              />
              <button
                type="button"
                class="editable-breadcrumb__save-btn"
                onClick={saveTitle}
                disabled={isLoading()}
                title="Save"
              >
                {isLoading() ? (
                  <span class="editable-breadcrumb__spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                class="editable-breadcrumb__cancel-btn"
                onClick={cancelEditing}
                disabled={isLoading()}
                title="Cancel"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <Show when={error()}>
              <span class="editable-breadcrumb__error">{error()}</span>
            </Show>
          </Show>
        </li>
      </ol>
    </nav>
  );
}
