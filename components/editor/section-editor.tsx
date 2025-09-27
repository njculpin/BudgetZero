'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import StrikeExtension from '@tiptap/extension-strike';
import CodeExtension from '@tiptap/extension-code';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TextAlign from '@tiptap/extension-text-align';
import { ReusableComponentExtension } from './tiptap-component-extension';
import { GridLayoutExtension } from './grid-layout-extension';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCallback, useEffect, useState } from 'react';
import { RulebookSection } from './page-section-manager';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Grid3X3,
  Undo,
  Redo,
  MoreHorizontal,
  ChevronDown,
  Keyboard
} from 'lucide-react';

interface SectionEditorProps {
  section: RulebookSection;
  onContentChange?: (sectionId: string, content: any) => void;
  isReadOnly?: boolean;
  isVisible?: boolean;
  onInsertComponent?: (componentId: string, componentType: string, componentTitle: string, componentContent: string, componentSettings: any) => void;
}

export function SectionEditor({
  section,
  onContentChange,
  isReadOnly = false,
  isVisible = true,
  onInsertComponent
}: SectionEditorProps) {
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      UnderlineExtension,
      StrikeExtension,
      CodeExtension,
      HorizontalRule,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Write a heading...';
          }
          return `Start writing your ${section.title.toLowerCase()} content here. Use the toolbar above or try keyboard shortcuts like Ctrl+B for bold, Ctrl+2 for heading, or ? for help.`;
        },
      }),
      ReusableComponentExtension,
      GridLayoutExtension,
    ],
    content: section.content || {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: section.title }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }
      ]
    },
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(section.id, editor.getJSON());
      }
    },
  });

  // Update content when section content changes
  useEffect(() => {
    if (editor && section.content && JSON.stringify(editor.getJSON()) !== JSON.stringify(section.content)) {
      editor.commands.setContent(section.content);
    }
  }, [section.content, editor]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            editor.chain().focus().toggleBold().run();
            break;
          case 'i':
            event.preventDefault();
            editor.chain().focus().toggleItalic().run();
            break;
          case 'u':
            if (event.shiftKey) {
              event.preventDefault();
              editor.chain().focus().toggleUnderline().run();
            }
            break;
          case 'k':
            event.preventDefault();
            editor.chain().focus().toggleCode().run();
            break;
          case '1':
            event.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            break;
          case '2':
            event.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            break;
          case '3':
            event.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            break;
          case 'l':
            if (event.shiftKey) {
              event.preventDefault();
              editor.chain().focus().toggleBulletList().run();
            }
            break;
          case 'o':
            if (event.shiftKey) {
              event.preventDefault();
              editor.chain().focus().toggleOrderedList().run();
            }
            break;
          case 'q':
            if (event.shiftKey) {
              event.preventDefault();
              editor.chain().focus().toggleBlockquote().run();
            }
            break;
          case 'g':
            if (event.shiftKey) {
              event.preventDefault();
              editor.chain().focus().insertGridLayout({
                columns: 2,
                rows: 1,
                gap: '1rem',
                items: []
              }).run();
            }
            break;
          case 'm':
            if (event.shiftKey) {
              event.preventDefault();
              setShowAdvancedTools(!showAdvancedTools);
            }
            break;
        }
      } else {
        // Non-modifier key shortcuts
        switch (event.key) {
          case '?':
            event.preventDefault();
            setShowKeyboardHelp(!showKeyboardHelp);
            break;
          case 'F1':
            event.preventDefault();
            setShowKeyboardHelp(!showKeyboardHelp);
            break;
          case 'Escape':
            if (showKeyboardHelp || showAdvancedTools) {
              event.preventDefault();
              setShowKeyboardHelp(false);
              setShowAdvancedTools(false);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, showAdvancedTools, showKeyboardHelp]);

  // Method to insert a reusable component
  const insertReusableComponent = useCallback((componentId: string, componentType: string, componentTitle: string, componentContent: string, componentSettings: any) => {
    if (editor) {
      editor.chain().focus().insertReusableComponent({
        componentId,
        componentType,
        componentTitle,
        componentContent,
        componentSettings
      }).run();
    }
  }, [editor]);

  // Expose insertion method to parent
  useEffect(() => {
    if (onInsertComponent && insertReusableComponent) {
      // Store the insertion method for the parent component to use
      (window as any)[`insertIntoSection_${section.id}`] = insertReusableComponent;
    }
    return () => {
      delete (window as any)[`insertIntoSection_${section.id}`];
    };
  }, [onInsertComponent, insertReusableComponent, section.id]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading editor for {section.title}...</div>
      </div>
    );
  }

  return (
    <Card
      className={`flex-1 min-h-[500px] transition-all duration-200 border-0 shadow-none bg-transparent ${isVisible ? 'block' : 'hidden'}`}
    >
      <div className="p-8">
        <div className="mb-8 pb-4 border-b border-border/20">
          <h3 className="text-xl font-medium text-foreground/80 tracking-tight">
            {section.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Draft in progress</p>
        </div>

        {/* Simplified Toolbar */}
        {editor && (
          <div className="mb-6 p-3 bg-muted/20 backdrop-blur-sm rounded-lg border-muted/40 border">
            <div className="flex flex-wrap items-center gap-1">
              {/* Undo/Redo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="h-8 w-8 p-0"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="h-8 w-8 p-0"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Essential text formatting */}
              <Button
                variant={editor.isActive('bold') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="h-8 w-8 p-0"
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('italic') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="h-8 w-8 p-0"
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Common headings */}
              <Button
                variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="h-8 w-8 p-0"
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className="h-8 w-8 p-0"
                title="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Lists */}
              <Button
                variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="h-8 w-8 p-0"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="h-8 w-8 p-0"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Grid Layout - Essential for positioning */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().insertGridLayout({
                  columns: 2,
                  rows: 1,
                  gap: '1rem',
                  items: []
                }).run()}
                className="h-8 w-8 p-0"
                title="Insert Grid Layout"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Keyboard shortcuts help */}
              <Button
                variant={showKeyboardHelp ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                className="h-8 w-8 p-0"
                title="Keyboard shortcuts (? or F1)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>

              {/* More tools toggle */}
              <Button
                variant={showAdvancedTools ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                className="h-8 px-2 gap-1"
                title="More formatting options (Ctrl+Shift+M)"
              >
                <MoreHorizontal className="h-4 w-4" />
                <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedTools ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Advanced tools - hidden by default */}
            {showAdvancedTools && (
              <div className="mt-3 pt-3 border-t border-muted/30">
                <div className="flex flex-wrap items-center gap-1">
                  {/* Additional text formatting */}
                  <Button
                    variant={editor.isActive('underline') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className="h-8 w-8 p-0"
                    title="Underline"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('strike') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className="h-8 w-8 p-0"
                    title="Strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('code') ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className="h-8 w-8 p-0"
                    title="Inline Code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-1" />

                  {/* Additional heading */}
                  <Button
                    variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className="h-8 w-8 p-0"
                    title="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-1" />

                  {/* Block elements */}
                  <Button
                    variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
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
                    variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className="h-8 w-8 p-0"
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className="h-8 w-8 p-0"
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className="h-8 w-8 p-0"
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6 mx-1" />

                  {/* Table */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="h-8 w-8 p-0"
                    title="Insert Table"
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Keyboard shortcuts help panel */}
            {showKeyboardHelp && (
              <div className="mt-3 pt-3 border-t border-muted/30">
                <h4 className="text-sm font-medium mb-3 text-foreground">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Bold</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+B</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Italic</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+I</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Underline</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+U</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Code</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+K</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Bullet List</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+L</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Numbered List</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+O</kbd>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Heading 1</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+1</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Heading 2</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+2</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Heading 3</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+3</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Quote</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+Q</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Grid Layout</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+G</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>More Tools</span>
                      <kbd className="bg-muted px-1 rounded">Ctrl+Shift+M</kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <EditorContent
          editor={editor}
          className="prose prose-slate max-w-none focus:outline-none min-h-[400px] px-6 py-8"
        />
      </div>
    </Card>
  );
}