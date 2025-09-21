import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Button } from '../ui'
import { TemplateSelector } from './TemplateSelector'
import { RulebookVersionHistory } from './RulebookVersionHistory'
import { PDFExportDialog } from './PDFExportDialog'
import { RulebookSharingDialog } from './RulebookSharingDialog'
import { exportRulebookToPDF, getExportableElement, cleanupExportElement } from '../../utils/pdfExport'
import { RulebookTemplate } from '../../utils/rulebookTemplates'
import { useRulebook, useAutoSaveRulebook, useUpdateRulebook } from '../../hooks/useRulebooks'
import { useAuth } from '../../hooks/useAuth'
import { useRulebookCollaboration } from '../../hooks/useRulebookCollaboration'
import { CollaborationIndicators } from './CollaborationIndicators'
import { RulebookVersion } from '../../lib/supabase'

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

interface RulebookEditorProps {
  projectId: string
  content?: string
  onUpdate?: (content: string) => void
  editable?: boolean
  gameCategory?: string
}

export function RulebookEditor({
  projectId,
  content = '',
  onUpdate,
  editable = true,
  gameCategory
}: RulebookEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showPDFDialog, setShowPDFDialog] = useState(false)
  const [showSharingDialog, setShowSharingDialog] = useState(false)
  const [rulebookTitle, setRulebookTitle] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const { data: user } = useAuth()
  const { data: rulebook, isLoading: rulebookLoading } = useRulebook(projectId)
  const { saveRulebook, isSaving } = useAutoSaveRulebook(projectId, rulebook?.id)
  const updateRulebookMutation = useUpdateRulebook()

  // Real-time collaboration
  const {
    collaborators,
    recentChanges,
    isConnected,
    broadcastContentChange,
    broadcastCursorMove,
    broadcastTypingStart,
    broadcastTypingStop
  } = useRulebookCollaboration(projectId, rulebook?.id)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'rulebook-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'rulebook-link',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
    ],
    content: rulebook?.content || content || `
      <h1>Game Rules</h1>
      <h2>Overview</h2>
      <p>Welcome to your collaborative rulebook editor! Start writing your game rules here.</p>

      <h2>Components</h2>
      <ul>
        <li>Game board</li>
        <li>Player pieces</li>
        <li>Cards</li>
        <li>Dice</li>
      </ul>

      <h2>Setup</h2>
      <p>Describe how to set up the game...</p>

      <h2>Gameplay</h2>
      <p>Explain the core gameplay mechanics...</p>

      <h2>Winning</h2>
      <p>How does a player win?</p>
    `,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onUpdate?.(html)
      debouncedSave(html)

      // Broadcast typing start for collaboration
      if (editable && rulebook) {
        broadcastTypingStart()
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Broadcast cursor position for collaboration
      if (editable && rulebook) {
        const { from } = editor.state.selection
        broadcastCursorMove(from)
      }
    },
  })

  // Debounced auto-save function
  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      if (!editable || !user) return

      try {
        await saveRulebook(rulebookTitle || 'Untitled Rulebook', content)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 2000),
    [saveRulebook, rulebookTitle, editable, user]
  )

  // Initialize title from existing rulebook
  useEffect(() => {
    if (rulebook?.title && !rulebookTitle) {
      setRulebookTitle(rulebook.title)
    }
  }, [rulebook?.title, rulebookTitle])

  // Update editor content when rulebook loads
  useEffect(() => {
    if (editor && rulebook?.content && editor.getHTML() !== rulebook.content) {
      editor.commands.setContent(rulebook.content)
    }
  }, [editor, rulebook?.content])

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  }

  const exportToPDF = async () => {
    if (!editorRef.current || !editor) return

    setIsExporting(true)
    try {
      const exportElement = getExportableElement(editorRef.current)
      await exportRulebookToPDF(exportElement, {
        filename: `${projectId}-rulebook.pdf`,
        quality: 0.95,
        scale: 2,
        format: 'a4',
        orientation: 'portrait'
      })
      cleanupExportElement(exportElement)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleTemplateSelect = (template: RulebookTemplate) => {
    if (editor) {
      editor.commands.setContent(template.content)
      onUpdate?.(template.content)
    }
    setShowTemplateSelector(false)
  }

  const createVersion = async () => {
    if (!editor || !rulebook) return

    const changeSummary = window.prompt('Describe the changes in this version:')
    if (changeSummary === null) return // User cancelled

    try {
      await updateRulebookMutation.mutateAsync({
        id: rulebook.id,
        projectId,
        updates: {
          content: editor.getHTML()
        },
        createVersion: true,
        changeSummary: changeSummary || 'Version created'
      })
      alert('Version created successfully!')
    } catch (error) {
      console.error('Failed to create version:', error)
      alert('Failed to create version. Please try again.')
    }
  }

  const restoreVersion = async (version: RulebookVersion) => {
    if (!editor) return

    const confirmed = window.confirm(
      `Are you sure you want to restore to version ${version.version}? This will replace the current content.`
    )
    if (!confirmed) return

    try {
      editor.commands.setContent(version.content)
      await saveRulebook(rulebookTitle || 'Untitled Rulebook', version.content)
      setShowVersionHistory(false)
      setLastSaved(new Date())
      alert('Version restored successfully!')
    } catch (error) {
      console.error('Failed to restore version:', error)
      alert('Failed to restore version. Please try again.')
    }
  }

  if (rulebookLoading) {
    return <div>Loading rulebook...</div>
  }

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div className="rulebook-editor" style={{ position: 'relative' }}>
      {/* Collaboration Indicators */}
      {editable && rulebook && (
        <CollaborationIndicators
          collaborators={collaborators}
          recentChanges={recentChanges}
          isConnected={isConnected}
        />
      )}

      {editable && (
        <div className="rulebook-editor__toolbar">
          {/* Title and Save Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            borderBottom: '1px solid var(--color-gray-200)',
            backgroundColor: 'white'
          }}>
            <input
              type="text"
              value={rulebookTitle}
              onChange={(e) => setRulebookTitle(e.target.value)}
              placeholder="Rulebook Title"
              style={{
                border: 'none',
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                backgroundColor: 'transparent',
                outline: 'none',
                flex: 1,
                color: 'var(--color-gray-800)'
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gray-600)'
            }}>
              {isSaving && <span>💾 Saving...</span>}
              {!isSaving && lastSaved && (
                <span>✅ Saved {lastSaved.toLocaleTimeString()}</span>
              )}
              {!isSaving && !lastSaved && rulebook && (
                <span>📄 Loaded</span>
              )}
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            borderBottom: '1px solid var(--color-gray-200)',
            backgroundColor: 'var(--color-gray-50)',
            alignItems: 'center'
          }}>
            {/* Template Selection */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setShowTemplateSelector(true)}
              >
                📋 Templates
              </Button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-gray-300)' }} />

            {/* Text Formatting */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button
                size="small"
                variant={editor.isActive('bold') ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold"
              >
                <strong>B</strong>
              </Button>
              <Button
                size="small"
                variant={editor.isActive('italic') ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic"
              >
                <em>I</em>
              </Button>
              <Button
                size="small"
                variant={editor.isActive('strike') ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="Strikethrough"
              >
                <span style={{ textDecoration: 'line-through' }}>S</span>
              </Button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-gray-300)' }} />

            {/* Headings */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button
                size="small"
                variant={editor.isActive('heading', { level: 1 }) ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
              >
                H1
              </Button>
              <Button
                size="small"
                variant={editor.isActive('heading', { level: 2 }) ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
              >
                H2
              </Button>
              <Button
                size="small"
                variant={editor.isActive('heading', { level: 3 }) ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
              >
                H3
              </Button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-gray-300)' }} />

            {/* Lists */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button
                size="small"
                variant={editor.isActive('bulletList') ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List"
              >
                • List
              </Button>
              <Button
                size="small"
                variant={editor.isActive('orderedList') ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
              >
                1. List
              </Button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-gray-300)' }} />

            {/* Text Alignment */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button
                size="small"
                variant={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                title="Align Left"
              >
                ←
              </Button>
              <Button
                size="small"
                variant={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                title="Align Center"
              >
                ↔
              </Button>
              <Button
                size="small"
                variant={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                title="Align Right"
              >
                →
              </Button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-gray-300)' }} />

            {/* Insert Elements */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <Button
                size="small"
                variant="secondary"
                onClick={addImage}
                title="Insert Image"
              >
                📷
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={addLink}
                title="Insert Link"
              >
                🔗
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={addTable}
                title="Insert Table"
              >
                📋
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Insert Horizontal Rule"
              >
                ─
              </Button>
              <Button
                size="small"
                variant={editor.isActive('blockquote') ? 'primary' : 'secondary'}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                title="Quote"
              >
                "
              </Button>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-gray-300)' }} />

            {/* Version Control */}
            {rulebook && (
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setShowVersionHistory(true)}
                  title="View Version History"
                >
                  📋 History
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={createVersion}
                  disabled={updateRulebookMutation.isPending}
                  title="Save Current Version"
                >
                  💾 Version
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setShowSharingDialog(true)}
                  title="Share Rulebook"
                >
                  🔗 Share
                </Button>
              </div>
            )}

            {/* Push PDF Export to the right */}
            <div style={{ marginLeft: 'auto' }}>
              <Button
                size="small"
                variant="success"
                onClick={() => setShowPDFDialog(true)}
                title="Export to PDF"
              >
                📄 Export PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rulebook-editor__content" ref={editorRef}>
        <EditorContent
          editor={editor}
          style={{
            minHeight: editable ? '400px' : 'auto',
            padding: 'var(--spacing-lg)',
            outline: 'none'
          }}
        />
      </div>

      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
          gameCategory={gameCategory}
        />
      )}

      {showVersionHistory && rulebook && (
        <RulebookVersionHistory
          rulebookId={rulebook.id}
          onClose={() => setShowVersionHistory(false)}
          onRestoreVersion={restoreVersion}
        />
      )}

      {showPDFDialog && editorRef.current && (
        <PDFExportDialog
          editorElement={editorRef.current}
          projectId={projectId}
          rulebookTitle={rulebookTitle}
          onClose={() => setShowPDFDialog(false)}
        />
      )}

      {showSharingDialog && (
        <RulebookSharingDialog
          projectId={projectId}
          rulebookTitle={rulebookTitle}
          onClose={() => setShowSharingDialog(false)}
        />
      )}
    </div>
  )
}