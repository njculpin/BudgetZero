import { DesignerNoteContent } from '../../../types/editor'

interface DesignerNoteBlockProps {
  content: DesignerNoteContent
  isEditable: boolean
  onContentChange: (content: DesignerNoteContent) => void
}

export function DesignerNoteBlock({ content, isEditable, onContentChange }: DesignerNoteBlockProps) {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      border: '1px solid var(--color-secondary)',
      borderLeft: '4px solid var(--color-secondary)',
      background: 'var(--color-secondary-light)',
      borderRadius: 'var(--border-radius-sm)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-secondary-dark)' }}>
        💡 Designer Note
      </h4>
      <p style={{ margin: 0 }}>{content.note || 'Add design note...'}</p>
    </div>
  )
}