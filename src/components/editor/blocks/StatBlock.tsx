import { StatBlockContent } from '../../../types/editor'

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