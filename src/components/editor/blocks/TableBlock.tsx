import { TableContent } from '../../../types/editor'

interface TableBlockProps {
  content: TableContent
  isEditable: boolean
  onContentChange: (content: TableContent) => void
}

export function TableBlock({ content, isEditable, onContentChange }: TableBlockProps) {
  return (
    <div>
      <p>Table Block - Coming Soon</p>
      <p>Headers: {content.headers?.join(', ')}</p>
    </div>
  )
}