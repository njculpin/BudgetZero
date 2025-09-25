'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionManager, RulebookSection } from './section-manager';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Save,
  Eye,
  Users,
  CheckCircle,
  Code,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface RulebookEditorProps {
  initialContent?: any;
  onSave?: (content: any, sections?: RulebookSection[]) => Promise<void>;
  onContentChange?: (content: any, sections?: RulebookSection[]) => void;
  isReadOnly?: boolean;
  projectTitle?: string;
  initialSections?: RulebookSection[];
}

export function RulebookEditor({
  initialContent,
  onSave,
  onContentChange,
  isReadOnly = false,
  projectTitle = "Untitled Project",
  initialSections
}: RulebookEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [sections, setSections] = useState<RulebookSection[]>(initialSections || [
    { id: 'overview', title: 'Overview', type: 'section', isVisible: true, isExpanded: true, order: 0, children: [] },
    { id: 'components', title: 'Components', type: 'section', isVisible: true, isExpanded: true, order: 1, children: [] },
    { id: 'setup', title: 'Setup', type: 'section', isVisible: true, isExpanded: true, order: 2, children: [] },
    { id: 'gameplay', title: 'How to Play', type: 'section', isVisible: true, isExpanded: true, order: 3, children: [] },
  ]);
  const [activeSection, setActiveSection] = useState<RulebookSection | undefined>(sections[0]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
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
          return 'Start writing your game rules...';
        },
      }),
    ],
    content: initialContent || {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: projectTitle }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Overview' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Describe your game here...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Components' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'List your game components' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Setup' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Explain how to set up the game...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'How to Play' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Describe the gameplay...' }]
        },
      ]
    },
    editable: !isReadOnly && !isPreview,
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getJSON(), sections);
      }
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return;

    setIsSaving(true);
    try {
      await onSave(editor.getJSON(), sections);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave, sections]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!onSave || isReadOnly) return;

    const interval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleSave, onSave, isReadOnly]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading editor...</div>
      </div>
    );
  }

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const insertHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run();
  };

  const handleSectionSelect = (section: RulebookSection) => {
    setActiveSection(section);
    // Focus the editor when selecting a section
    editor?.chain().focus().run();
  };

  const handleSectionsChange = (newSections: RulebookSection[]) => {
    setSections(newSections);
    if (onContentChange) {
      onContentChange(editor?.getJSON(), newSections);
    }
  };

  return (
    <div className="w-full h-screen flex gap-6">
      {/* Sidebar for section management */}
      <div className="w-80 flex-shrink-0">
        <SectionManager
          sections={sections}
          activeSection={activeSection}
          onSectionsChange={handleSectionsChange}
          onSectionSelect={handleSectionSelect}
        />
      </div>

      {/* Main editor area */}
      <div className="flex-1 space-y-6 min-w-0">
      {/* Toolbar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 mr-2">
              <Button
                variant={isPreview ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  setIsPreview(false);
                  editor.setEditable(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant={isPreview ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsPreview(true);
                  editor.setEditable(false);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </div>

            {!isPreview && (
              <>
                <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 mr-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                      >
                        <Undo className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Undo (Ctrl+Z)</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                      >
                        <Redo className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Redo (Ctrl+Y)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 mr-2">
                  <Button
                    variant={editor.isActive('heading', { level: 1 }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  >
                    <Heading1 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('heading', { level: 2 }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    <Heading2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('heading', { level: 3 }) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    <Heading3 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 mr-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={editor.isActive('bold') ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bold (Ctrl+B)</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={editor.isActive('italic') ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Italic (Ctrl+I)</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={editor.isActive('strike') ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                      >
                        <Strikethrough className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Strikethrough</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={editor.isActive('code') ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => editor.chain().focus().toggleCode().run()}
                      >
                        <Code className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Inline Code</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 mr-2">
                  <Button
                    variant={editor.isActive('bulletList') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('orderedList') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={editor.isActive('blockquote') ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 mr-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addTable}
                      >
                        <TableIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Insert Table</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={insertHorizontalRule}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Horizontal Rule</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {lastSaved && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
            >
              <Users className="w-4 h-4 mr-1" />
              Share
            </Button>
            {onSave && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Editor */}
      <Card className="min-h-[600px]">
        <div className="p-6">
          <EditorContent
            editor={editor}
            className={`prose prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h1:border-b prose-h1:pb-3 prose-h1:mb-6 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-table:text-sm prose-table:border-collapse prose-th:bg-muted prose-th:font-semibold prose-th:p-3 prose-td:p-3 prose-td:border-b prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:pl-4 prose-blockquote:italic prose-strong:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded max-w-none ${isPreview ? 'prose-lg' : ''}`}
          />
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
}