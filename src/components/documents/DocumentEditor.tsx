import { createSignal, onMount, onCleanup, For } from "solid-js";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { subscribeToDocumentContent } from "@/lib/realtime/document-content-subscription";
import "./document-editor.css";

interface DocumentEditorProps {
  documentId: string;
  initialContent: string | null;
  canEdit: boolean;
  userId?: string;
  userName?: string | null;
  userHandle?: string | null;
}

interface PresenceUser {
  userId: string;
  userName: string | null;
  userHandle: string | null;
}

interface TipTapContent {
  type: string;
  content?: TipTapContent[];
}

export default function DocumentEditor(props: DocumentEditorProps) {
  let editorContainer: HTMLDivElement | undefined;
  let editor: Editor | null = null;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let broadcastContent: ((content: Record<string, unknown>, userId: string) => void) | null = null;
  let updatePresence: ((presence: { userId: string; userName: string | null; userHandle: string | null }) => void) | null = null;
  let unsubscribeRealtime: (() => void) | null = null;
  let isRemoteUpdate = false; // Flag to prevent broadcasting remote updates
  let imageInputRef: HTMLInputElement | undefined;

  const [isSaving, setIsSaving] = createSignal(false);
  const [lastSaved, setLastSaved] = createSignal<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false);
  const [activeEditors, setActiveEditors] = createSignal<PresenceUser[]>([]);
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const [isUploadingImage, setIsUploadingImage] = createSignal(false);

  const saveContent = async () => {
    if (!editor || !props.canEdit) return;

    const content = editor.getJSON();
    setIsSaving(true);

    try {
      const response = await fetch("/api/documents/update-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Explicitly include cookies
        body: JSON.stringify({
          documentId: props.documentId,
          content,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to save document:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
      }
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    setHasUnsavedChanges(true);
    saveTimeout = setTimeout(() => {
      saveContent();
    }, 1000); // Auto-save after 1 second of inactivity
  };

  // Broadcast local changes to other editors
  const broadcastUpdate = () => {
    if (!editor || !props.userId || isRemoteUpdate) return;
    const content = editor.getJSON();
    broadcastContent?.(content as Record<string, unknown>, props.userId);
  };

  onMount(async () => {
    // Add keyboard listener for fullscreen escape
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
    }

    if (!editorContainer) return;

    // Parse initial content
    let content: TipTapContent = { type: "doc", content: [{ type: "paragraph" }] };
    if (props.initialContent) {
      try {
        content = JSON.parse(props.initialContent) as TipTapContent;
      } catch {
        // If parsing fails, use default empty content
      }
    }

    editor = new Editor({
      element: editorContainer,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4],
          },
        }),
        Placeholder.configure({
          placeholder: "Start writing your document...",
        }),
        Link.configure({
          openOnClick: false,
        }),
        Image,
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content,
      editable: props.canEdit,
      onUpdate: () => {
        if (props.canEdit && !isRemoteUpdate) {
          debouncedSave();
          broadcastUpdate();
        }
      },
    });

    // Set up realtime collaboration if user is authenticated
    if (props.userId && props.canEdit) {
      try {
        const realtime = await subscribeToDocumentContent(
          props.documentId,
          props.userId,
          {
            onContentUpdate: (remoteContent) => {
              if (!editor) return;
              // Prevent infinite loops by setting flag
              isRemoteUpdate = true;

              // Save cursor position
              const { from, to } = editor.state.selection;

              // Update content from remote user
              editor.commands.setContent(remoteContent);

              // Try to restore cursor position
              try {
                const docSize = editor.state.doc.content.size;
                const safeFrom = Math.min(from, docSize - 1);
                const safeTo = Math.min(to, docSize - 1);
                editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
              } catch {
                // If selection restoration fails, just continue
              }

              isRemoteUpdate = false;
            },
            onPresenceUpdate: (presenceMap) => {
              const editors: PresenceUser[] = [];
              presenceMap.forEach((presence) => {
                editors.push({
                  userId: presence.userId,
                  userName: presence.userName,
                  userHandle: presence.userHandle,
                });
              });
              setActiveEditors(editors);
            },
          }
        );

        broadcastContent = realtime.broadcastContent;
        updatePresence = realtime.updatePresence;
        unsubscribeRealtime = realtime.unsubscribe;

        // Announce our presence
        updatePresence({
          userId: props.userId,
          userName: props.userName ?? null,
          userHandle: props.userHandle ?? null,
        });
      } catch (error) {
        console.warn("Failed to set up realtime collaboration:", error);
      }
    }
  });

  onCleanup(() => {
    // Remove keyboard listener
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown);
    }
    if (editor) {
      editor.destroy();
    }
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    if (unsubscribeRealtime) {
      unsubscribeRealtime();
    }
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen());
    // Focus editor when entering fullscreen
    if (!isFullscreen()) {
      setTimeout(() => editor?.commands.focus(), 100);
    }
  };

  // Handle Escape key to exit fullscreen
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isFullscreen()) {
      setIsFullscreen(false);
    }
  };

  // Toolbar button handlers
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();
  const toggleHeading = (level: 1 | 2 | 3 | 4) =>
    editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const setHorizontalRule = () => editor?.chain().focus().setHorizontalRule().run();
  const undo = () => editor?.chain().focus().undo().run();
  const redo = () => editor?.chain().focus().redo().run();

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleImageUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("documentId", props.documentId);
      formData.append("files", file);

      const response = await fetch("/api/documents/upload-attachments", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to upload image:", data.error);
        alert("Failed to upload image");
        return;
      }

      const result = await response.json();
      const uploadedImage = result.attachments[0];

      // Insert the uploaded image into the editor
      if (uploadedImage?.file_url) {
        editor?.chain().focus().setImage({ src: uploadedImage.file_url }).run();
      }

      // Clear the input
      input.value = "";
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerImageUpload = () => {
    imageInputRef?.click();
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div class="document-editor" classList={{ "document-editor--fullscreen": isFullscreen() }}>
      {props.canEdit && (
        <div class="document-editor__toolbar">
          <div class="document-editor__toolbar-group">
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={undo}
              title="Undo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={redo}
              title="Redo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </button>
          </div>

          <div class="document-editor__toolbar-divider" />

          <div class="document-editor__toolbar-group">
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={() => toggleHeading(1)}
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={() => toggleHeading(2)}
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={() => toggleHeading(3)}
              title="Heading 3"
            >
              H3
            </button>
          </div>

          <div class="document-editor__toolbar-divider" />

          <div class="document-editor__toolbar-group">
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleBold}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleItalic}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleStrike}
              title="Strikethrough"
            >
              <s>S</s>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleCode}
              title="Code"
            >
              <code>&lt;/&gt;</code>
            </button>
          </div>

          <div class="document-editor__toolbar-divider" />

          <div class="document-editor__toolbar-group">
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleBulletList}
              title="Bullet List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleOrderedList}
              title="Numbered List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v4" />
                <path d="M4 10h2" />
                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
              </svg>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleBlockquote}
              title="Quote"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
              </svg>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={toggleCodeBlock}
              title="Code Block"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          </div>

          <div class="document-editor__toolbar-divider" />

          <div class="document-editor__toolbar-group">
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={addLink}
              title="Add Link"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={triggerImageUpload}
              disabled={isUploadingImage()}
              title={isUploadingImage() ? "Uploading image..." : "Upload Image"}
            >
              {isUploadingImage() ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="document-editor__spinner">
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style="display: none;"
            />
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={insertTable}
              title="Insert Table"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
            <button
              type="button"
              class="document-editor__toolbar-btn"
              onClick={setHorizontalRule}
              title="Horizontal Rule"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <div class="document-editor__toolbar-spacer" />

          <button
            type="button"
            class="document-editor__toolbar-btn document-editor__fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen() ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
          >
            {isFullscreen() ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            )}
          </button>

          {activeEditors().length > 0 && (
            <div class="document-editor__presence">
              <For each={activeEditors()}>
                {(editor) => (
                  <div class="document-editor__presence-avatar" title={editor.userName || editor.userHandle || "Unknown"}>
                    {(editor.userName || editor.userHandle || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </For>
              <span class="document-editor__presence-count">
                {activeEditors().length} editing
              </span>
            </div>
          )}

          <div class="document-editor__save-status">
            {isSaving() && <span class="document-editor__saving">Saving...</span>}
            {!isSaving() && hasUnsavedChanges() && (
              <span class="document-editor__unsaved">Unsaved changes</span>
            )}
            {!isSaving() && !hasUnsavedChanges() && lastSaved() && (
              <span class="document-editor__saved">Saved at {formatTime(lastSaved()!)}</span>
            )}
          </div>
        </div>
      )}

      <div
        ref={editorContainer}
        class="document-editor__content"
        classList={{ "document-editor__content--readonly": !props.canEdit }}
      />
    </div>
  );
}
