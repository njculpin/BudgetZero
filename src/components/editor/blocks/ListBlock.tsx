import { ListContent } from '../../../types/editor'

interface ListBlockProps {
  content: ListContent
  isEditable: boolean
  onContentChange: (content: ListContent) => void
}

export function ListBlock({ content, isEditable, onContentChange }: ListBlockProps) {
  return (
    <div>
      <p>List Block - Coming Soon</p>
      <p>Type: {content.type || 'bulleted'}</p>
    </div>
  )
}