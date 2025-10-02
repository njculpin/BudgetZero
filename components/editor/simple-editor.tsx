"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import "./simple-editor.css";
import { CharacterCount } from "@tiptap/extension-character-count";
import CodeExtension from "@tiptap/extension-code";
import { Color } from "@tiptap/extension-color";
import { Focus } from "@tiptap/extension-focus";
import { Highlight } from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list-item";
import Placeholder from "@tiptap/extension-placeholder";
import StrikeExtension from "@tiptap/extension-strike";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import UnderlineExtension from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckCircle,
  CheckSquare,
  Clipboard,
  Code,
  Copy,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Indent,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Outdent,
  Palette,
  Quote,
  Redo,
  Scissors,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SimpleEditorProps {
  initialContent?: any;
  onSave?: (content: any) => Promise<void>;
  onContentChange?: (content: any) => void;
  isReadOnly?: boolean;
  projectTitle?: string;
}

export function SimpleEditor({
  initialContent,
  onSave,
  onContentChange,
  isReadOnly = false,
  projectTitle = "Untitled Project",
}: SimpleEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const floatingToolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      UnderlineExtension,
      StrikeExtension,
      CodeExtension,
      HorizontalRule,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color.configure({ types: [TextStyle.name, "heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ListItem,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
      Typography.configure({
        openDoubleQuote: '"',
        closeDoubleQuote: '"',
        openSingleQuote: "'",
        closeSingleQuote: "'",
      }),
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Write a heading...";
          }
          return 'Start writing your rulebook here. Use headings to organize sections like "Game Overview", "Setup", "Gameplay", etc.';
        },
      }),
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
      if (onContentChange) {
        onContentChange(editor.getJSON());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;

      if (empty || isReadOnly) {
        setShowFloatingToolbar(false);
        return;
      }

      // Get the DOM range for the selection
      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      // Calculate toolbar position
      const editorRect = view.dom.getBoundingClientRect();
      const centerX = (start.left + end.left) / 2;
      const top = start.top - 60; // Position above selection

      // Calculate relative position to the editor container
      const relativeTop = Math.max(10, top - editorRect.top);
      const relativeLeft = Math.max(
        10,
        Math.min(centerX - editorRect.left, editorRect.width - 200),
      );

      setToolbarPosition({
        top: relativeTop,
        left: relativeLeft,
      });
      setShowFloatingToolbar(true);
    },
  });

  const handleSave = useCallback(async () => {
    if (!onSave || !editor) return;

    setIsSaving(true);
    try {
      await onSave(editor.getJSON());
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editor]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!onSave || isReadOnly) return;

    const interval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleSave, onSave, isReadOnly]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;

      // Save shortcut
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
        return;
      }

      // Additional shortcuts for formatting
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        switch (event.key) {
          case "H":
            event.preventDefault();
            editor.chain().focus().toggleHighlight().run();
            break;
          case "K": {
            event.preventDefault();
            const url = window.prompt("Enter URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
            break;
          }
          case "X":
            event.preventDefault();
            editor.chain().focus().toggleStrike().run();
            break;
        }
      }

      // List shortcuts
      if ((event.metaKey || event.ctrlKey) && event.altKey) {
        switch (event.key) {
          case "l":
            event.preventDefault();
            editor.chain().focus().toggleBulletList().run();
            break;
          case "o":
            event.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
            break;
          case "t":
            event.preventDefault();
            editor.chain().focus().toggleTaskList().run();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading editor...</div>
      </div>
    );
  }

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
          transform: "translateX(-50%)",
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
          <Underline className="h-4 w-4" />
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
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className="h-8 w-8 p-0"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

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

  return (
    <div className="w-full mx-auto space-y-4 relative">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {editor && (
            <div className="text-xs text-muted-foreground">
              {editor.storage.characterCount.characters()} characters,{" "}
              {editor.storage.characterCount.words()} words
            </div>
          )}
          {lastSaved && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            </div>
          )}
          {isSaving && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-xs text-muted-foreground">Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toolbar */}
      <FloatingToolbar />

      {/* Hidden static toolbar - keeping for advanced features if needed later */}
      <details className="group">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground mb-2">
          Advanced formatting options
        </summary>
        <div className="flex flex-wrap items-center gap-1 p-3 bg-muted/20 rounded-lg">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text formatting */}
          <Button
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("underline") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("strike") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className="h-8 w-8 p-0"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("code") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className="h-8 w-8 p-0"
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <Button
            variant={
              editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className="h-8 w-8 p-0"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className="h-8 w-8 p-0"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className="h-8 w-8 p-0"
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Button
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().sinkListItem("listItem").run()
            }
            disabled={!editor.can().sinkListItem("listItem")}
            className="h-8 w-8 p-0"
            title="Indent List Item"
          >
            <Indent className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().liftListItem("listItem").run()
            }
            disabled={!editor.can().liftListItem("listItem")}
            className="h-8 w-8 p-0"
            title="Outdent List Item"
          >
            <Outdent className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Block elements */}
          <Button
            variant={editor.isActive("blockquote") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0"
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text alignment */}
          <Button
            variant={
              editor.isActive({ textAlign: "left" }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className="h-8 w-8 p-0"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className="h-8 w-8 p-0"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive({ textAlign: "right" }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className="h-8 w-8 p-0"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Colors and Highlighting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setColor("#ff0000").run()}
            className="h-8 w-8 p-0"
            title="Text Color (Red)"
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("highlight") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className="h-8 w-8 p-0"
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Task Lists */}
          <Button
            variant={editor.isActive("taskList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className="h-8 w-8 p-0"
            title="Task List"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Links and Media */}
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
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt("Enter image URL");
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
            className="h-8 w-8 p-0"
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Table */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className="h-8 w-8 p-0"
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Clipboard Operations */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              document.execCommand("copy");
            }}
            className="h-8 w-8 p-0"
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              document.execCommand("paste");
            }}
            className="h-8 w-8 p-0"
            title="Paste"
          >
            <Clipboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              document.execCommand("cut");
            }}
            className="h-8 w-8 p-0"
            title="Cut"
          >
            <Scissors className="h-4 w-4" />
          </Button>
        </div>
      </details>

      {/* Editor */}
      <div className="p-8">
        <EditorContent
          editor={editor}
          className="min-h-[500px] leading-relaxed text-base"
        />
      </div>
    </div>
  );
}
