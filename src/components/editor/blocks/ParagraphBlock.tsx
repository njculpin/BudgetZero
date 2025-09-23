import { useState, useRef, useEffect } from 'react'
import { ParagraphContent } from '../../../types/editor'

interface ParagraphBlockProps {
  content: ParagraphContent
  isEditable: boolean
  onContentChange: (content: ParagraphContent) => void
}

export function ParagraphBlock({ content, isEditable, onContentChange }: ParagraphBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(content.text || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setText(content.text || '')
  }, [content.text])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [isEditing])

  const handleClick = () => {
    if (isEditable && !isEditing) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false)
      onContentChange({ ...content, text })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setText(content.text || '')
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Type something..."
        className="paragraph-editor"
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          background: 'transparent',
          textAlign: content.alignment || 'left'
        }}
      />
    )
  }

  return (
    <p
      onClick={handleClick}
      style={{
        margin: 0,
        textAlign: content.alignment || 'left',
        cursor: isEditable ? 'text' : 'default',
        minHeight: '1.5em',
        wordBreak: 'break-word'
      }}
      className={`paragraph-content ${!content.text ? 'paragraph-content--empty' : ''}`}
    >
      {content.text || (isEditable ? 'Click to add text...' : '')}
    </p>
  )
}