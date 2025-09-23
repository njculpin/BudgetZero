import { useState, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ContentBlock, GridPosition, BlockType, CreateBlockInput } from '../../../types/editor'
import { BlockRenderer } from './BlockRenderer'
import { BlockMenu } from './BlockMenu'
import { EditorGrid } from './EditorGrid'
import './BlockEditor.css'

interface BlockEditorProps {
  pageId: string
  blocks: ContentBlock[]
  onBlockCreate: (block: CreateBlockInput) => void
  onBlockUpdate: (blockId: string, updates: Partial<ContentBlock>) => void
  onBlockDelete: (blockId: string) => void
  onBlockMove: (blockId: string, newPosition: GridPosition) => void
  isEditable?: boolean
  gridColumns?: number
}

export function BlockEditor({
  pageId,
  blocks,
  onBlockCreate,
  onBlockUpdate,
  onBlockDelete,
  onBlockMove,
  isEditable = true,
  gridColumns = 12
}: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>()
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ x: number; y: number }>()
  const [draggedBlockId, setDraggedBlockId] = useState<string>()

  const handleBlockSelect = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
  }, [])

  const handleBlockMenuShow = useCallback((position: { x: number; y: number }) => {
    if (!isEditable) return
    setBlockMenuPosition(position)
    setShowBlockMenu(true)
  }, [isEditable])

  const handleBlockMenuHide = useCallback(() => {
    setShowBlockMenu(false)
    setBlockMenuPosition(undefined)
  }, [])

  const handleBlockCreate = useCallback((type: BlockType, position?: GridPosition) => {
    const newBlock: CreateBlockInput = {
      page_id: pageId,
      type,
      content: {},
      grid_position: position || {
        row: Math.max(...blocks.map(b => b.grid_position.row + b.grid_position.rowSpan), 1),
        col: 1,
        rowSpan: 1,
        colSpan: gridColumns
      }
    }
    onBlockCreate(newBlock)
    handleBlockMenuHide()
  }, [pageId, blocks, gridColumns, onBlockCreate, handleBlockMenuHide])

  const handleBlockDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId)
  }, [])

  const handleBlockDragEnd = useCallback(() => {
    setDraggedBlockId(undefined)
  }, [])

  const handleBlockDrop = useCallback((blockId: string, newPosition: GridPosition) => {
    onBlockMove(blockId, newPosition)
    setDraggedBlockId(undefined)
  }, [onBlockMove])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isEditable) return

    if (e.key === 'Delete' && selectedBlockId) {
      onBlockDelete(selectedBlockId)
      setSelectedBlockId(undefined)
    } else if (e.key === 'Escape') {
      setSelectedBlockId(undefined)
      handleBlockMenuHide()
    } else if (e.key === '/' && !selectedBlockId) {
      // Show block menu at cursor position
      const rect = e.currentTarget.getBoundingClientRect()
      handleBlockMenuShow({ x: rect.left + 50, y: rect.top + 50 })
    }
  }, [isEditable, selectedBlockId, onBlockDelete, handleBlockMenuHide, handleBlockMenuShow])

  // Sort blocks by order_index for consistent rendering
  const sortedBlocks = [...blocks].sort((a, b) => a.order_index - b.order_index)

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="block-editor"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        data-testid="block-editor"
      >
        <EditorGrid
          columns={gridColumns}
          onGridClick={handleBlockMenuShow}
          isEditable={isEditable}
        >
          {sortedBlocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              isDragging={draggedBlockId === block.id}
              isEditable={isEditable}
              onSelect={handleBlockSelect}
              onUpdate={(updates) => onBlockUpdate(block.id, updates)}
              onDelete={() => onBlockDelete(block.id)}
              onDragStart={handleBlockDragStart}
              onDragEnd={handleBlockDragEnd}
              onDrop={handleBlockDrop}
            />
          ))}
        </EditorGrid>

        {showBlockMenu && blockMenuPosition && (
          <BlockMenu
            position={blockMenuPosition}
            onBlockCreate={handleBlockCreate}
            onClose={handleBlockMenuHide}
          />
        )}

        {isEditable && blocks.length === 0 && (
          <div className="empty-editor">
            <div className="empty-editor__content">
              <p>Start writing by typing "/" to see available blocks</p>
              <p>Or click anywhere to add your first block</p>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  )
}