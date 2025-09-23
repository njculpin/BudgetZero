import { ComponentDefinitionContent } from '../../../types/editor'

interface ComponentDefinitionBlockProps {
  content: ComponentDefinitionContent
  isEditable: boolean
  onContentChange: (content: ComponentDefinitionContent) => void
}

export function ComponentDefinitionBlock({ content, isEditable, onContentChange }: ComponentDefinitionBlockProps) {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      border: '1px solid var(--color-info)',
      borderLeft: '4px solid var(--color-info)',
      background: 'var(--color-info-light)',
      borderRadius: 'var(--border-radius-sm)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-info-dark)' }}>
        🎲 {content.name || 'Component'}
      </h4>
      <p style={{ margin: 0 }}>{content.description || 'Add component description...'}</p>
    </div>
  )
}