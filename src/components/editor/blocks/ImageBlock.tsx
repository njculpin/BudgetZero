import { ImageContent } from '../../../types/editor'

interface ImageBlockProps {
  content: ImageContent
  isEditable: boolean
  onContentChange: (content: ImageContent) => void
}

export function ImageBlock({ content, isEditable, onContentChange }: ImageBlockProps) {
  return (
    <div style={{ padding: 'var(--spacing-md)', border: '2px dashed var(--color-gray-300)', textAlign: 'center' }}>
      {content.url ? (
        <img src={content.url} alt={content.alt} style={{ maxWidth: '100%' }} />
      ) : (
        <p>Image Block - Click to add image</p>
      )}
    </div>
  )
}