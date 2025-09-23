import { ExamplePlayContent } from '../../../types/editor'

interface ExamplePlayBlockProps {
  content: ExamplePlayContent
  isEditable: boolean
  onContentChange: (content: ExamplePlayContent) => void
}

export function ExamplePlayBlock({ content, isEditable, onContentChange }: ExamplePlayBlockProps) {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      border: '1px solid var(--color-success)',
      borderLeft: '4px solid var(--color-success)',
      background: 'var(--color-success-light)',
      borderRadius: 'var(--border-radius-sm)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-success-dark)' }}>
        🎮 {content.title || 'Example Play'}
      </h4>
      <p style={{ margin: 0 }}>{content.scenario || 'Add play example...'}</p>
    </div>
  )
}