import { useState, useRef, useEffect } from 'react'
import { HeadingContent } from '../../../types/editor'

interface HeadingBlockProps {
  content: HeadingContent
  isEditable: boolean
  onContentChange: (content: HeadingContent) => void
}

export function HeadingBlock({ content, isEditable, onContentChange }: HeadingBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(content.text || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setText(content.text || '')
  }, [content.text])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
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
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setText(content.text || '')
    }
  }

  const level = content.level || 1
  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  const getHeadingStyle = () => {
    const baseStyle = {
      margin: 0,
      textAlign: content.alignment || 'left' as const,
      cursor: isEditable ? 'text' : 'default' as const,
      wordBreak: 'break-word' as const
    }

    switch (level) {
      case 1:
        return { ...baseStyle, fontSize: '2rem', fontWeight: '700', lineHeight: 1.2 }
      case 2:
        return { ...baseStyle, fontSize: '1.5rem', fontWeight: '600', lineHeight: 1.3 }
      case 3:
        return { ...baseStyle, fontSize: '1.25rem', fontWeight: '600', lineHeight: 1.4 }
      case 4:
        return { ...baseStyle, fontSize: '1.125rem', fontWeight: '600', lineHeight: 1.4 }
      case 5:
        return { ...baseStyle, fontSize: '1rem', fontWeight: '600', lineHeight: 1.5 }
      case 6:
        return { ...baseStyle, fontSize: '0.875rem', fontWeight: '600', lineHeight: 1.5 }
      default:
        return baseStyle
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={`Heading ${level}`}
        style={{
          ...getHeadingStyle(),
          width: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit'
        }}
      />
    )
  }

  return (
    <Tag
      onClick={handleClick}
      style={getHeadingStyle()}
      className={`heading-content heading-content--level-${level} ${!content.text ? 'heading-content--empty' : ''}`}
    >
      {content.text || (isEditable ? `Heading ${level}` : '')}
    </Tag>
  )
}