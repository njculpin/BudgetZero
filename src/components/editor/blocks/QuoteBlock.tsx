import { QuoteContent } from '../../../types/editor'

interface QuoteBlockProps {
  content: QuoteContent
  isEditable: boolean
  onContentChange: (content: QuoteContent) => void
}

export function QuoteBlock({ content, isEditable, onContentChange }: QuoteBlockProps) {
  return (
    <blockquote style={{
      margin: 0,
      padding: 'var(--spacing-md)',
      borderLeft: '4px solid var(--color-primary)',
      background: 'var(--color-gray-50)',
      fontStyle: 'italic'
    }}>
      <p style={{ margin: 0 }}>{content.text || 'Quote text...'}</p>
      {content.author && (
        <cite style={{
          display: 'block',
          marginTop: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-600)'
        }}>
          — {content.author}
        </cite>
      )}
    </blockquote>
  )
}