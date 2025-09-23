import { useState, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { ContentBlock, GridPosition } from '../../../types/editor'
import { ParagraphBlock } from '../blocks/ParagraphBlock'
import { HeadingBlock } from '../blocks/HeadingBlock'
import { ListBlock } from '../blocks/ListBlock'
import { QuoteBlock } from '../blocks/QuoteBlock'
import { ImageBlock } from '../blocks/ImageBlock'
import { TableBlock } from '../blocks/TableBlock'
import { DividerBlock } from '../blocks/DividerBlock'
import { RuleSnippetBlock } from '../blocks/RuleSnippetBlock'
import { ComponentDefinitionBlock } from '../blocks/ComponentDefinitionBlock'
import { StatBlock } from '../blocks/StatBlock'
import { ExamplePlayBlock } from '../blocks/ExamplePlayBlock'
import { DesignerNoteBlock } from '../blocks/DesignerNoteBlock'
import { BlockToolbar } from './BlockToolbar'
import './BlockRenderer.css'

interface BlockRendererProps {
  block: ContentBlock
  isSelected: boolean
  isDragging: boolean
  isEditable: boolean
  onSelect: (blockId: string) => void
  onUpdate: (updates: Partial<ContentBlock>) => void
  onDelete: () => void
  onDragStart: (blockId: string) => void
  onDragEnd: () => void
  onDrop: (blockId: string, newPosition: GridPosition) => void
}

export function BlockRenderer({
  block,
  isSelected,
  isDragging,
  isEditable,
  onSelect,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  onDrop
}: BlockRendererProps) {
  const [isHovered, setIsHovered] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)

  // Drag and drop setup
  const [{ opacity }, drag] = useDrag({
    type: 'block',
    item: { id: block.id, type: block.type },
    begin: () => onDragStart(block.id),
    end: () => onDragEnd(),
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    })
  })

  const [, drop] = useDrop({
    accept: 'block',
    hover: (item: { id: string }, monitor) => {
      if (item.id === block.id) return

      const hoverBoundingRect = blockRef.current?.getBoundingClientRect()
      if (!hoverBoundingRect) return

      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return

      // Calculate new position based on drop position
      const newPosition: GridPosition = {
        ...block.grid_position,
        row: block.grid_position.row // Simplified - could calculate based on position
      }

      onDrop(item.id, newPosition)
    }
  })

  // Combine drag and drop refs
  drag(drop(blockRef))

  const handleBlockClick = () => {
    if (isEditable) {
      onSelect(block.id)
    }
  }

  const handleContentUpdate = (content: Record<string, any>) => {
    onUpdate({ content })
  }

  const handleStyleUpdate = (style_config: Record<string, any>) => {
    onUpdate({ style_config })
  }

  const handlePositionUpdate = (grid_position: GridPosition) => {
    onUpdate({ grid_position })
  }

  // Render the appropriate block component based on type
  const renderBlockContent = () => {
    const commonProps = {
      content: block.content,
      isEditable,
      onContentChange: handleContentUpdate
    }

    switch (block.type) {
      case 'paragraph':
        return <ParagraphBlock {...commonProps} />
      case 'heading':
        return <HeadingBlock {...commonProps} />
      case 'list':
        return <ListBlock {...commonProps} />
      case 'quote':
        return <QuoteBlock {...commonProps} />
      case 'image':
        return <ImageBlock {...commonProps} />
      case 'table':
        return <TableBlock {...commonProps} />
      case 'divider':
        return <DividerBlock {...commonProps} />
      case 'rule_snippet':
        return <RuleSnippetBlock {...commonProps} />
      case 'component_definition':
        return <ComponentDefinitionBlock {...commonProps} />
      case 'stat_block':
        return <StatBlock {...commonProps} />
      case 'example_play':
        return <ExamplePlayBlock {...commonProps} />
      case 'designer_note':
        return <DesignerNoteBlock {...commonProps} />
      default:
        return (
          <div className="unknown-block">
            <p>Unknown block type: {block.type}</p>
          </div>
        )
    }
  }

  const gridStyle = {
    gridColumn: `${block.grid_position.col} / span ${block.grid_position.colSpan}`,
    gridRow: `${block.grid_position.row} / span ${block.grid_position.rowSpan}`,
    opacity
  }

  return (
    <div
      ref={blockRef}
      className={`block-renderer ${isSelected ? 'block-renderer--selected' : ''} ${isDragging ? 'block-renderer--dragging' : ''} block-type--${block.type}`}
      style={gridStyle}
      onClick={handleBlockClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-block-id={block.id}
      data-block-type={block.type}
      data-testid={`block-${block.id}`}
    >
      {/* Block toolbar */}
      {isEditable && (isSelected || isHovered) && (
        <BlockToolbar
          block={block}
          onDelete={onDelete}
          onStyleChange={handleStyleUpdate}
          onPositionChange={handlePositionUpdate}
          isSelected={isSelected}
        />
      )}

      {/* Block content */}
      <div className="block-content">
        {renderBlockContent()}
      </div>

      {/* Drag handle */}
      {isEditable && isHovered && (
        <div className="drag-handle" title="Drag to move block">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
            <circle cx="6" cy="2" r="1" fill="currentColor" />
            <circle cx="10" cy="2" r="1" fill="currentColor" />
            <circle cx="2" cy="6" r="1" fill="currentColor" />
            <circle cx="6" cy="6" r="1" fill="currentColor" />
            <circle cx="10" cy="6" r="1" fill="currentColor" />
            <circle cx="2" cy="10" r="1" fill="currentColor" />
            <circle cx="6" cy="10" r="1" fill="currentColor" />
            <circle cx="10" cy="10" r="1" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  )
}