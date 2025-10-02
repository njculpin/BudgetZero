"use client";

import { Highlight } from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Box,
  Code,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Plus,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { addAssetToProjectAction } from "@/lib/actions/asset-integration-actions";
import { AssetPickerModal } from "./asset-picker-modal";
import { AssetReference } from "./extensions/asset-reference";
import { SyncedBlock } from "./extensions/synced-block";
import "./block-editor.css";

interface BlockEditorProps {
  initialContent?: any;
  onSave?: (content: any) => Promise<void>;
  onContentChange?: (content: any) => void;
  isReadOnly?: boolean;
  projectTitle?: string;
  projectId?: string;
}

export function BlockEditor({
  initialContent,
  onSave,
  onContentChange,
  isReadOnly = false,
  projectTitle = "Untitled Project",
  projectId,
}: BlockEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const floatingToolbarRef = useRef<HTMLDivElement>(null);

  // Debounced auto-save function
  const debouncedSave = useMemo(() => {
    if (!onSave) return null;

    let timeoutId: NodeJS.Timeout;
    return (content: any) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (isReadOnly) return;
        setIsSaving(true);
        try {
          await onSave(content);
          setLastSaved(new Date());
        } catch (error) {
          console.error("Auto-save failed:", error);
        } finally {
          setIsSaving(false);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    };
  }, [onSave, isReadOnly]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          openOnClick: false,
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Heading";
          }
          return "Type '/' for commands";
        },
      }),
      SyncedBlock,
      AssetReference,
      Highlight,
      TextStyle,
    ],
    content: initialContent || {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: projectTitle }],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    },
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      if (onContentChange) {
        onContentChange(content);
      }
      // Trigger auto-save
      if (debouncedSave && !isReadOnly) {
        debouncedSave(content);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, empty } = editor.state.selection;

      if (empty || isReadOnly) {
        setShowFloatingToolbar(false);
        return;
      }

      // Get the DOM range for the selection
      const { view } = editor;
      const start = view.coordsAtPos(from);

      // Calculate toolbar position relative to editor container
      const editorContainer = editorRef.current;
      const contentContainer = editorContainer?.querySelector(".max-w-4xl");
      const contentRect = contentContainer?.getBoundingClientRect();

      if (!editorContainer || !contentRect) {
        setShowFloatingToolbar(false);
        return;
      }

      const containerRect = editorContainer.getBoundingClientRect();

      // Position toolbar so:
      // - Left edge aligns with left edge of text content (accounting for pl-12 padding)
      // - Bottom edge aligns with top of text selection
      const paddingLeft = 48; // pl-12 = 48px
      const leftPosition = contentRect.left - containerRect.left + paddingLeft;
      const topPosition = start.top - containerRect.top - 60;

      setToolbarPosition({
        top: topPosition,
        left: leftPosition,
      });
      setShowFloatingToolbar(true);
    },
  });

  // Floating Toolbar Component
  const FloatingToolbar = () => {
    if (!showFloatingToolbar || !editor) return null;

    return (
      <div
        ref={floatingToolbarRef}
        className="absolute z-50 flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"
        style={{
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`,
        }}
      >
        {/* Bold */}
        <Button
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>

        {/* Italic */}
        <Button
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>

        {/* Underline */}
        <Button
          variant={editor.isActive("underline") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        {/* Strikethrough */}
        <Button
          variant={editor.isActive("strike") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8 p-0"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Code */}
        <Button
          variant={editor.isActive("code") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className="h-8 w-8 p-0"
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* Highlight */}
        <Button
          variant={editor.isActive("highlight") ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHighlight({ color: "#ffff00" }).run()
          }
          className="h-8 w-8 p-0"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        {/* Add Asset (only if projectId is provided) */}
        {projectId && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAssetPicker(true)}
              className="h-8 w-8 p-0"
              title="Add model to project"
            >
              <Box className="h-4 w-4" />
            </Button>
          </>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Bullet List */}
        <Button
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        {/* Ordered List */}
        <Button
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <Button
          variant={editor.isActive("link") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            const url = window.prompt("Enter URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Handle asset selection
  async function handleAssetSelect(asset: any) {
    if (!editor || !projectId) return;

    try {
      // Add asset to project in database
      const result = await addAssetToProjectAction(projectId, asset.id);

      if (!result.success) {
        console.error("Failed to add asset to project:", result.error);
        return;
      }

      // Insert asset reference into editor
      editor
        .chain()
        .focus()
        .insertAssetReference({
          assetId: asset.id,
          assetName: asset.name,
          assetType: "model",
          thumbnailUrl: asset.thumbnail_url,
          creatorName: asset.creator?.full_name || asset.creator?.username,
          licenseType: asset.license_type,
        })
        .run();
    } catch (error) {
      console.error("Error adding asset:", error);
    }
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div ref={editorRef} className="relative">
        {/* Floating Toolbar */}
        <FloatingToolbar />

        {/* Editor */}
        <div className="max-w-4xl mx-auto pl-12 pr-8 py-8">
          <EditorContent
            editor={editor}
            className="min-h-[500px] leading-relaxed text-base block-editor"
          />
        </div>

        {/* Click to add block at bottom */}
        {!isReadOnly && (
          <div
            className="max-w-4xl mx-auto pl-12 pr-8 pb-8"
            onClick={() => {
              if (editor) {
                const lastPos = editor.state.doc.content.size;
                editor
                  .chain()
                  .focus()
                  .insertContentAt(lastPos, { type: "paragraph" })
                  .setTextSelection(lastPos + 1)
                  .run();
              }
            }}
          >
            <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 cursor-pointer py-2">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Click to add content</span>
            </div>

            {/* Save status and keyboard shortcut help */}
            <div className="text-xs text-slate-400 mt-2 border-t pt-2 space-y-1">
              {/* Auto-save status */}
              <div className="flex items-center gap-2">
                {isSaving && (
                  <>
                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span>Saving...</span>
                  </>
                )}
                {lastSaved && !isSaving && (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                )}
              </div>

              {/* Editor tip */}
              <div>
                <span>💡 Tip: Select text to see formatting options</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Asset Picker Modal */}
      {projectId && (
        <AssetPickerModal
          open={showAssetPicker}
          onClose={() => setShowAssetPicker(false)}
          onSelect={handleAssetSelect}
          projectId={projectId}
        />
      )}
    </div>
  );
}
