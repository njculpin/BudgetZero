import { RuleSnippetContent } from '../../../types/editor'
interface RuleSnippetBlockProps {
  content: RuleSnippetContent
  isEditable: boolean
  onContentChange: (content: RuleSnippetContent) => void
}

export function RuleSnippetBlock({ content, isEditable, onContentChange }: RuleSnippetBlockProps) {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      border: '1px solid var(--color-warning)',
      borderLeft: '4px solid var(--color-warning)',
      background: 'var(--color-warning-light)',
      borderRadius: 'var(--border-radius-sm)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-warning-dark)' }}>
        📋 {content.title || 'Rule Snippet'}
      </h4>
      <p style={{ margin: 0 }}>{content.ruleText || 'Add rule text...'}</p>
    </div>
  )
}

// Component Definition Block
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

// Stat Block
interface StatBlockProps {
  content: StatBlockContent
  isEditable: boolean
  onContentChange: (content: StatBlockContent) => void
}

export function StatBlock({ content, isEditable, onContentChange }: StatBlockProps) {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      border: '1px solid var(--color-gray-400)',
      background: 'var(--color-gray-50)',
      borderRadius: 'var(--border-radius-sm)'
    }}>
      <h4 style={{ margin: '0 0 var(--spacing-sm) 0' }}>
        📊 {content.title || 'Stat Block'}
      </h4>
      <p style={{ margin: 0 }}>Stats: {content.stats?.length || 0} defined</p>
    </div>
  )
}

// Example Play Block
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

// Designer Note Block
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