import { ReactNode, useCallback } from 'react'
import { useDrop } from 'react-dnd'
import { GridPosition } from '../../../types/editor'
import './EditorGrid.css'

interface EditorGridProps {
  children: ReactNode
  columns: number
  onGridClick?: (position: { x: number; y: number }) => void
  onBlockDrop?: (position: GridPosition) => void
  isEditable?: boolean
  showGrid?: boolean
}

export function EditorGrid({
  children,
  columns,
  onGridClick,
  onBlockDrop,
  isEditable = true,
  showGrid = false
}: EditorGridProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ['block', 'template'],
    drop: (item: { id: string; type: string }, monitor) => {
      if (!monitor.didDrop() && onBlockDrop) {
        const offset = monitor.getClientOffset()
        if (offset) {
          const gridPosition = calculateGridPosition(offset, columns)
          onBlockDrop(gridPosition)
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop()
    })
  })

  const handleGridClick = useCallback((e: React.MouseEvent) => {
    if (!isEditable || !onGridClick) return

    // Only trigger if clicking on the grid itself, not on blocks
    if (e.target === e.currentTarget) {
      onGridClick({ x: e.clientX, y: e.clientY })
    }
  }, [isEditable, onGridClick])

  const gridStyle = {
    '--grid-columns': columns,
    '--column-width': `${100 / columns}%`
  } as React.CSSProperties

  return (
    <div
      ref={drop}
      className={`editor-grid ${showGrid ? 'editor-grid--visible' : ''} ${isOver ? 'editor-grid--drop-active' : ''}`}
      style={gridStyle}
      onClick={handleGridClick}
      data-testid="editor-grid"
    >
      {children}

      {/* Grid overlay for visual feedback when dragging */}
      {isOver && isEditable && (
        <div className="grid-overlay">
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="grid-column" />
          ))}
        </div>
      )}
    </div>
  )
}

// Helper function to calculate grid position from mouse coordinates
function calculateGridPosition(
  offset: { x: number; y: number },
  columns: number
): GridPosition {
  // This is a simplified calculation - in a real implementation,
  // you'd want to account for the actual grid container position and size
  const containerRect = document.querySelector('.editor-grid')?.getBoundingClientRect()

  if (!containerRect) {
    return { row: 1, col: 1, rowSpan: 1, colSpan: columns }
  }

  const relativeX = offset.x - containerRect.left
  const relativeY = offset.y - containerRect.top

  const columnWidth = containerRect.width / columns
  const col = Math.max(1, Math.min(columns, Math.floor(relativeX / columnWidth) + 1))
  const row = Math.max(1, Math.floor(relativeY / 60) + 1) // Assuming 60px row height

  return {
    row,
    col,
    rowSpan: 1,
    colSpan: Math.min(6, columns - col + 1) // Default to half width or remaining space
  }
}