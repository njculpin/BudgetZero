import { useState } from 'react'
import { ContentBlock, GridPosition } from '../../../types/editor'
import './BlockToolbar.css'

interface BlockToolbarProps {
  block: ContentBlock
  onDelete: () => void
  onStyleChange: (style: Record<string, any>) => void
  onPositionChange: (position: GridPosition) => void
  isSelected: boolean
}

export function BlockToolbar({
  block,
  onDelete,
  onStyleChange,
  onPositionChange,
  isSelected
}: BlockToolbarProps) {
  const [showPositionControls, setShowPositionControls] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this block?')) {
      onDelete()
    }
  }

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement block duplication
    console.log('Duplicate block:', block.id)
  }

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newPosition: GridPosition = {
      ...block.grid_position,
      row: Math.max(1, block.grid_position.row - 1)
    }
    onPositionChange(newPosition)
  }

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newPosition: GridPosition = {
      ...block.grid_position,
      row: block.grid_position.row + 1
    }
    onPositionChange(newPosition)
  }

  const handleWidthChange = (e: React.MouseEvent, change: number) => {
    e.stopPropagation()
    const newColSpan = Math.max(1, Math.min(12, block.grid_position.colSpan + change))
    const newPosition: GridPosition = {
      ...block.grid_position,
      colSpan: newColSpan
    }
    onPositionChange(newPosition)
  }

  const handleSaveAsTemplate = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement save as template
    console.log('Save as template:', block.id)
  }

  if (!isSelected) {
    return (
      <div className="block-toolbar block-toolbar--hover">
        <button
          className="toolbar-button"
          onClick={handleDeleteClick}
          title="Delete block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="block-toolbar block-toolbar--selected">
      {/* Main toolbar */}
      <div className="toolbar-section toolbar-section--main">
        <button
          className="toolbar-button"
          onClick={handleDuplicateClick}
          title="Duplicate block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        <button
          className="toolbar-button"
          onClick={handleSaveAsTemplate}
          title="Save as template"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        </button>

        <button
          className={`toolbar-button ${showPositionControls ? 'toolbar-button--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            setShowPositionControls(!showPositionControls)
          }}
          title="Position controls"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M9 9h6v6H9z" />
          </svg>
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-button toolbar-button--danger"
          onClick={handleDeleteClick}
          title="Delete block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      {/* Position controls */}
      {showPositionControls && (
        <div className="toolbar-section toolbar-section--position">
          <div className="position-group">
            <label className="position-label">Position</label>
            <div className="position-controls">
              <button
                className="toolbar-button toolbar-button--small"
                onClick={handleMoveUp}
                title="Move up"
              >
                ↑
              </button>
              <button
                className="toolbar-button toolbar-button--small"
                onClick={handleMoveDown}
                title="Move down"
              >
                ↓
              </button>
            </div>
          </div>

          <div className="position-group">
            <label className="position-label">Width</label>
            <div className="position-controls">
              <button
                className="toolbar-button toolbar-button--small"
                onClick={(e) => handleWidthChange(e, -1)}
                title="Decrease width"
                disabled={block.grid_position.colSpan <= 1}
              >
                −
              </button>
              <span className="width-display">
                {block.grid_position.colSpan}/12
              </span>
              <button
                className="toolbar-button toolbar-button--small"
                onClick={(e) => handleWidthChange(e, 1)}
                title="Increase width"
                disabled={block.grid_position.colSpan >= 12}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}