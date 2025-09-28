"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { SyncedBlock } from "./extensions/synced-block";
import { Underline } from "@tiptap/extension-underline";
import { Strike } from "@tiptap/extension-strike";
import { Highlight } from "@tiptap/extension-highlight";
import { Link } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  GripVertical,
  Link2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Link as LinkIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import "./block-editor.css";

interface BlockEditorProps {
  initialContent?: any;
  onSave?: (content: any) => Promise<void>;
  onContentChange?: (content: any) => void;
  isReadOnly?: boolean;
  projectTitle?: string;
}

export function BlockEditor({
  initialContent,
  onSave,
  onContentChange,
  isReadOnly = false,
  projectTitle = "Untitled Project",
}: BlockEditorProps) {
  const [hoveredBlock, setHoveredBlock] = useState<Element | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Element | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
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
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Heading";
          }
          return "Type '/' for commands";
        },
      }),
      Dropcursor.configure({
        color: "#3b82f6",
        width: 2,
      }),
      Gapcursor,
      SyncedBlock,
      Underline,
      Strike,
      Highlight,
      Link.configure({
        openOnClick: false,
      }),
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
      const { from, to, empty } = editor.state.selection;

      if (empty || isReadOnly) {
        setShowFloatingToolbar(false);
        return;
      }

      // Get the DOM range for the selection
      const { view } = editor;
      const start = view.coordsAtPos(from);

      // Calculate toolbar position relative to editor container
      const editorRect = view.dom.getBoundingClientRect();
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

  // Helper function to find the actual block position in TipTap
  const findBlockPosition = useCallback(
    (blockElement: Element) => {
      if (!editor) return null;

      // Get all top-level blocks in the editor
      const proseMirrorEl = editorRef.current?.querySelector(".ProseMirror");
      if (!proseMirrorEl) return null;

      const allBlocks = Array.from(proseMirrorEl.children);
      const blockIndex = allBlocks.indexOf(blockElement);

      if (blockIndex === -1) return null;

      // Calculate position by iterating through nodes
      let pos = 1; // Start after doc opening
      const doc = editor.state.doc;

      for (let i = 0; i < blockIndex; i++) {
        const node = doc.child(i);
        pos += node.nodeSize;
      }

      return { pos, blockIndex, node: doc.child(blockIndex) };
    },
    [editor]
  );

  // Handle drop with improved position calculation
  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (!editor) return;

      console.log("Drop event triggered");

      // Clean up visual indicators immediately
      document.querySelectorAll(".drag-over").forEach((el) => {
        el.classList.remove("drag-over");
      });
      document.querySelectorAll(".drop-line").forEach((el) => {
        el.remove();
      });

      // Get drag data with validation
      const draggedData = e.dataTransfer?.getData("application/x-block-data");
      if (!draggedData) {
        console.log("No valid drag data found");
        return;
      }

      let draggedInfo;
      try {
        draggedInfo = JSON.parse(draggedData);
      } catch (error) {
        console.log("Invalid drag data format");
        return;
      }

      // Get the dragged element from global reference
      const draggedElement = (window as any).__draggedBlockElement;
      if (!draggedElement) {
        console.log("No dragged element reference");
        return;
      }

      // Find target block more reliably
      const target = e.target as Element;
      const proseMirrorEl = editorRef.current?.querySelector(".ProseMirror");
      if (!proseMirrorEl) return;

      // Find the closest block element
      let targetBlock = target;
      while (targetBlock && targetBlock.parentElement !== proseMirrorEl) {
        targetBlock = targetBlock.parentElement as Element;
        if (!targetBlock || targetBlock === proseMirrorEl) {
          console.log("No valid target block found");
          return;
        }
      }

      // Don't drop on self
      if (targetBlock === draggedElement) {
        console.log("Cannot drop on self");
        return;
      }

      try {
        // Use TipTap's posAtDOM for accurate position detection
        const draggedPos = editor.view.posAtDOM(draggedElement as Node, 0);
        const targetPos = editor.view.posAtDOM(targetBlock as Node, 0);

        if (
          draggedPos === null ||
          targetPos === null ||
          draggedPos === -1 ||
          targetPos === -1
        ) {
          console.log("Could not determine positions");
          return;
        }

        // Determine if we're dropping above or below the target
        const rect = targetBlock.getBoundingClientRect();
        const mouseY = e.clientY;
        const blockMiddle = rect.top + rect.height / 2;
        const dropAbove = mouseY < blockMiddle;

        // Get the actual nodes
        const draggedNode = editor.state.doc.nodeAt(draggedPos);
        const targetNode = editor.state.doc.nodeAt(targetPos);

        if (!draggedNode || !targetNode) {
          console.log("Could not find nodes");
          return;
        }

        // Calculate the final drop position
        let dropPos;
        if (dropAbove) {
          dropPos = targetPos;
        } else {
          // Drop after the target block
          dropPos = targetPos + targetNode.nodeSize;
        }

        // Adjust position if dragging from before the drop position
        if (draggedPos < dropPos) {
          dropPos -= draggedNode.nodeSize;
        }

        // Don't move if positions are effectively the same
        if (Math.abs(draggedPos - dropPos) < draggedNode.nodeSize) {
          console.log("Same position, skipping");
          return;
        }

        console.log(`Moving block from ${draggedPos} to ${dropPos}`);

        // Execute the move using TipTap's transaction system
        const transaction = editor.state.tr;

        // Cut the dragged node
        const nodeToMove = draggedNode;
        const cutFrom = draggedPos;
        const cutTo = draggedPos + nodeToMove.nodeSize;

        // Create the transaction
        const newTransaction = transaction
          .delete(cutFrom, cutTo)
          .insert(dropPos, nodeToMove);

        // Apply the transaction
        editor.view.dispatch(newTransaction);

        console.log("Block moved successfully");
      } catch (error) {
        console.error("Error moving block:", error);
      }
    },
    [editor]
  );

  // Handle mouse events for block hovering
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!editorRef.current || isReadOnly) return;

      const target = e.target as Element;
      const blockElement = target.closest(".ProseMirror > *");

      if (blockElement && blockElement !== hoveredBlock) {
        setHoveredBlock(blockElement);
      }
    },
    [hoveredBlock, isReadOnly]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredBlock(null);
  }, []);

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!editorRef.current || isReadOnly) return;

      // Focus block controls with Ctrl/Cmd + Shift + H
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
        e.preventDefault();
        const focusedElement = document.activeElement;
        const blockElement = focusedElement?.closest(
          ".ProseMirror > *"
        ) as Element;

        if (blockElement) {
          setHoveredBlock(blockElement);
          // Focus the first control button
          setTimeout(() => {
            const firstButton = document.querySelector(
              '[role="toolbar"] button'
            );
            if (firstButton instanceof HTMLElement) {
              firstButton.focus();
            }
          }, 0);
        }
      }

      // Escape to hide controls
      if (e.key === "Escape" && hoveredBlock) {
        e.preventDefault();
        setHoveredBlock(null);
        // Return focus to editor
        if (editor) {
          editor.commands.focus();
        }
      }
    },
    [hoveredBlock, isReadOnly, editor]
  );

  // Handle dragover with improved target detection
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";

    const target = e.target as Element;
    const proseMirrorEl = editorRef.current?.querySelector(".ProseMirror");
    if (!proseMirrorEl) return;

    // Find the closest block element more reliably
    let targetBlock: Element | null = target;
    while (targetBlock && targetBlock.parentElement !== proseMirrorEl) {
      targetBlock = targetBlock.parentElement as Element;
      if (!targetBlock || targetBlock === proseMirrorEl) {
        targetBlock = null;
        break;
      }
    }

    // Remove previous drop indicators
    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });

    // Remove previous drop lines
    document.querySelectorAll(".drop-line").forEach((el) => {
      el.remove();
    });

    if (targetBlock && editorRef.current) {
      // Get mouse position relative to target block
      const rect = targetBlock.getBoundingClientRect();
      const mouseY = e.clientY;
      const blockMiddle = rect.top + rect.height / 2;

      // Determine if we're dropping above or below the target
      const dropAbove = mouseY < blockMiddle;

      // Create drop line indicator
      const dropLine = document.createElement("div");
      dropLine.className = "drop-line";
      dropLine.style.cssText = `
        position: absolute;
        left: 48px;
        right: 32px;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
        border-radius: 2px;
        z-index: 30;
        pointer-events: none;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        animation: pulse 1s infinite;
      `;

      // Position the drop line
      const editorRect = editorRef.current.getBoundingClientRect();
      const contentContainer = editorRef.current.querySelector(".max-w-4xl");
      const containerRect = contentContainer?.getBoundingClientRect();

      if (containerRect) {
        const relativeTop = dropAbove
          ? rect.top - containerRect.top - 2
          : rect.bottom - containerRect.top + 2;

        dropLine.style.top = `${relativeTop}px`;
      }

      // Add drop line to content container
      if (contentContainer) {
        contentContainer.appendChild(dropLine);
      }

      // Add subtle highlight to target block
      targetBlock.classList.add("drag-over");
    }
  }, []);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (!editorElement) return;

    editorElement.addEventListener("mousemove", handleMouseMove);
    editorElement.addEventListener("mouseleave", handleMouseLeave);
    editorElement.addEventListener("drop", handleDrop);
    editorElement.addEventListener("dragover", handleDragOver);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      editorElement.removeEventListener("mousemove", handleMouseMove);
      editorElement.removeEventListener("mouseleave", handleMouseLeave);
      editorElement.removeEventListener("drop", handleDrop);
      editorElement.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleMouseMove,
    handleMouseLeave,
    handleDrop,
    handleDragOver,
    handleKeyDown,
  ]);

  // Get block position for controls
  const getBlockPosition = (blockElement: Element) => {
    if (!editorRef.current) return { top: 0, left: 0 };

    const editorRect = editorRef.current.getBoundingClientRect();
    const blockRect = blockElement.getBoundingClientRect();

    // Find the content container (with pl-12 class)
    const contentContainer = editorRef.current.querySelector(".max-w-4xl");
    const contentRect = contentContainer?.getBoundingClientRect();

    // Calculate position so the RIGHT edge of controls aligns with LEFT edge of text
    // pl-12 = 48px padding, text starts at content left + padding
    const isMobile = window.innerWidth < 768;
    const controlsWidth = isMobile ? 140 : 156; // Width of the control toolbar (3 buttons + drag handle)
    const paddingLeft = 48; // pl-12 = 48px

    // Position controls so their right edge touches the left edge of text content
    const textStartPosition = contentRect
      ? contentRect.left - editorRect.left + paddingLeft // Where text actually starts
      : paddingLeft; // Fallback

    const leftOffset = textStartPosition - controlsWidth;

    return {
      top: blockRect.top - editorRect.top,
      left: leftOffset,
    };
  };

  // Handle adding new block
  const addBlockBelow = (blockElement: Element) => {
    if (!editor) return;

    try {
      // Find the position after this block
      const pos = editor.view.posAtDOM(blockElement, 0);

      // Check if position is valid
      if (pos === null || pos === -1 || pos < 0) {
        // Fallback: add at the end of the document
        const docSize = editor.state.doc.content.size;
        editor
          .chain()
          .focus()
          .insertContentAt(docSize, { type: "paragraph" })
          .setTextSelection(docSize + 1)
          .run();
        return;
      }

      // Validate position is within document bounds
      if (pos >= editor.state.doc.content.size) {
        // Position is out of bounds, add at end
        const docSize = editor.state.doc.content.size;
        editor
          .chain()
          .focus()
          .insertContentAt(docSize, { type: "paragraph" })
          .setTextSelection(docSize + 1)
          .run();
        return;
      }

      const resolvedPos = editor.state.doc.resolve(pos);
      const after = resolvedPos.after();

      // Ensure 'after' position is valid
      if (after <= editor.state.doc.content.size) {
        editor
          .chain()
          .focus()
          .insertContentAt(after, { type: "paragraph" })
          .setTextSelection(after + 1)
          .run();
      } else {
        // Fallback to end of document
        const docSize = editor.state.doc.content.size;
        editor
          .chain()
          .focus()
          .insertContentAt(docSize, { type: "paragraph" })
          .setTextSelection(docSize + 1)
          .run();
      }
    } catch (error) {
      console.error("Error adding block:", error);
      // Ultimate fallback: add at end of document
      const docSize = editor.state.doc.content.size;
      editor
        .chain()
        .focus()
        .insertContentAt(docSize, { type: "paragraph" })
        .setTextSelection(docSize + 1)
        .run();
    }
  };

  // Handle creating synced block from current block
  const createSyncedBlock = (blockElement: Element) => {
    if (!editor) return;

    try {
      // Find the position of this block
      const pos = editor.view.posAtDOM(blockElement, 0);

      if (pos === null || pos === -1 || pos < 0) {
        console.warn("Invalid block position for synced block creation");
        return;
      }

      // Get the resolved position to find the actual block
      const resolvedPos = editor.state.doc.resolve(pos);
      const blockPos = resolvedPos.before(resolvedPos.depth);
      const node = editor.state.doc.nodeAt(blockPos);

      if (!node) {
        console.warn("No block node found at position");
        return;
      }

      // Only convert block-level nodes to synced blocks
      if (!node.isBlock) {
        console.warn("Cannot convert non-block node to synced block");
        return;
      }

      // Create synced block from current content
      const syncId = `sync-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Replace current block with synced block containing the same content
      const nodeSize = node.nodeSize;
      const blockContent = node.toJSON();

      editor
        .chain()
        .focus()
        .deleteRange({ from: blockPos, to: blockPos + nodeSize })
        .insertContentAt(blockPos, {
          type: "syncedBlock",
          attrs: {
            syncId,
            isOriginal: true,
            lastSynced: new Date().toISOString(),
          },
          content: [blockContent],
        })
        .run();

      console.log("Created synced block with ID:", syncId);
    } catch (error) {
      console.error("Error creating synced block:", error);
    }
  };

  // Handle drag start with improved data handling
  const handleDragStart = (e: React.DragEvent, blockElement: Element) => {
    console.log("Drag start triggered on:", blockElement);

    if (!editor) {
      console.log("No editor available");
      return;
    }

    e.dataTransfer.effectAllowed = "move";
    setSelectedBlock(blockElement);

    try {
      // Store reference to the dragged element
      const dragData = {
        draggedElement: blockElement,
        timestamp: Date.now(), // For validation
      };

      // Set drag data
      e.dataTransfer.setData(
        "application/x-block-data",
        JSON.stringify({ draggedElement: true }) // Simple marker since we can't serialize DOM elements
      );

      // Store the actual element reference globally for the drop handler
      (window as any).__draggedBlockElement = blockElement;

      // Add visual feedback
      blockElement.classList.add("dragging");
      blockElement.classList.add("block-selected");

      // Create a custom drag image for better UX
      const dragImage = blockElement.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = "0.8";
      dragImage.style.transform = "rotate(2deg)";
      dragImage.style.border = "2px solid #3b82f6";
      dragImage.style.borderRadius = "4px";
      dragImage.style.background = "white";
      dragImage.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      dragImage.style.maxWidth = "300px";

      // Temporarily add to DOM for drag image
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px";
      dragImage.style.left = "-1000px";
      document.body.appendChild(dragImage);

      e.dataTransfer.setDragImage(dragImage, 20, 20);

      // Clean up drag image after a short delay
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 100);

      console.log("Drag start successful");
    } catch (error) {
      console.error("Error starting drag:", error);
    }
  };

  // Handle drag end
  const handleDragEnd = (blockElement: Element) => {
    blockElement.classList.remove("dragging");
    blockElement.classList.remove("block-selected");
    setSelectedBlock(null);

    // Clean up global reference
    (window as any).__draggedBlockElement = null;

    // Clean up any remaining drop indicators
    document.querySelectorAll(".drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });

    // Clean up drop line indicators
    document.querySelectorAll(".drop-line").forEach((el) => {
      el.remove();
    });
  };

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

  // Block Controls Component
  const BlockControls = () => {
    if (!hoveredBlock || isReadOnly) return null;

    const position = getBlockPosition(hoveredBlock);

    return (
      <div
        className="absolute z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg border shadow-sm p-1"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        role="toolbar"
        aria-label="Block editing controls"
      >
        {/* Plus button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-70 hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          onClick={() => addBlockBelow(hoveredBlock)}
          title="Add block below"
          aria-label="Add new block below this one"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Synced block button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-70 hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          onClick={() => createSyncedBlock(hoveredBlock)}
          title="Create synced block"
          aria-label="Convert this block to a synced block"
        >
          <Link2 className="h-4 w-4" />
        </Button>

        {/* Drag handle */}
        <div
          className="h-8 w-8 p-1 opacity-70 hover:opacity-100 focus:opacity-100 cursor-grab active:cursor-grabbing flex items-center justify-center rounded hover:bg-gray-100 select-none"
          draggable={true}
          onDragStart={(e) => {
            handleDragStart(e, hoveredBlock);
          }}
          onDragEnd={(e) => {
            handleDragEnd(hoveredBlock);
          }}
          onMouseDown={(e) => {
            // Prevent text selection when starting drag
            e.preventDefault();
          }}
          title="Drag to move block"
          role="button"
          tabIndex={0}
          aria-label="Drag to reorder this block"
          style={{ touchAction: "none" }} // Prevent touch scrolling
        >
          <GripVertical className="h-4 w-4 pointer-events-none" />
        </div>
      </div>
    );
  };

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
        {/* Block Controls */}
        <BlockControls />

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

              {/* Keyboard shortcut tip */}
              <div>
                <span>💡 Tip: Press </span>
                <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">
                  Ctrl+Shift+H
                </kbd>
                <span> while in a block to access controls with keyboard</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
