interface DividerBlockProps {
  content: Record<string, any>
  isEditable: boolean
  onContentChange: (content: Record<string, any>) => void
}

export function DividerBlock({ content, isEditable, onContentChange }: DividerBlockProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-md) 0'
    }}>
      <hr style={{
        width: '100%',
        border: 'none',
        borderTop: '2px solid var(--color-gray-300)',
        margin: 0
      }} />
    </div>
  )
}