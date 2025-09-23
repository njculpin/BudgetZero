import { useState, useEffect, useRef } from 'react'
import { BlockType, BLOCK_TYPES_CONFIG, GridPosition } from '../../../types/editor'
import './BlockMenu.css'

interface BlockMenuProps {
  position: { x: number; y: number }
  onBlockCreate: (type: BlockType, position?: GridPosition) => void
  onClose: () => void
}

interface BlockCategory {
  id: string
  label: string
  blocks: BlockType[]
}

const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    id: 'text',
    label: 'Text',
    blocks: ['paragraph', 'heading', 'list', 'quote']
  },
  {
    id: 'game',
    label: 'Game Content',
    blocks: ['rule_snippet', 'component_definition', 'stat_block', 'example_play']
  },
  {
    id: 'media',
    label: 'Media',
    blocks: ['image', 'table']
  },
  {
    id: 'layout',
    label: 'Layout',
    blocks: ['divider']
  },
  {
    id: 'notes',
    label: 'Notes',
    blocks: ['designer_note']
  }
]

export function BlockMenu({ position, onBlockCreate, onClose }: BlockMenuProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter blocks based on search term
  const filteredBlocks = BLOCK_CATEGORIES.reduce((acc, category) => {
    const filteredCategoryBlocks = category.blocks.filter(blockType => {
      const config = BLOCK_TYPES_CONFIG[blockType]
      return config.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             blockType.toLowerCase().includes(searchTerm.toLowerCase())
    })

    if (filteredCategoryBlocks.length > 0) {
      acc.push({
        ...category,
        blocks: filteredCategoryBlocks
      })
    }

    return acc
  }, [] as BlockCategory[])

  // Get all filtered blocks in a flat array for keyboard navigation
  const allFilteredBlocks = filteredBlocks.reduce((acc, category) => {
    return [...acc, ...category.blocks]
  }, [] as BlockType[])

  useEffect(() => {
    // Focus search input when menu opens
    searchInputRef.current?.focus()

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    // Reset selected index when search results change
    setSelectedIndex(0)
  }, [searchTerm])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allFilteredBlocks.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (allFilteredBlocks[selectedIndex]) {
          handleBlockSelect(allFilteredBlocks[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  const handleBlockSelect = (blockType: BlockType) => {
    onBlockCreate(blockType)
    onClose()
  }

  // Position the menu, accounting for screen boundaries
  const menuStyle = {
    left: position.x,
    top: position.y,
    transform: 'translate(-50%, 0)'
  }

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = position.x
      let adjustedY = position.y

      // Adjust horizontal position
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 20
      }
      if (rect.left < 0) {
        adjustedX = 20
      }

      // Adjust vertical position
      if (rect.bottom > viewportHeight) {
        adjustedY = position.y - rect.height
      }

      if (adjustedX !== position.x || adjustedY !== position.y) {
        if (menuRef.current) {
          menuRef.current.style.left = `${adjustedX}px`
          menuRef.current.style.top = `${adjustedY}px`
          menuRef.current.style.transform = 'none'
        }
      }
    }
  }, [position.x, position.y])

  let blockIndex = 0

  return (
    <div
      ref={menuRef}
      className="block-menu"
      style={menuStyle}
      onKeyDown={handleKeyDown}
      data-testid="block-menu"
    >
      <div className="block-menu__header">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search blocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block-menu__search"
        />
      </div>

      <div className="block-menu__content">
        {filteredBlocks.length === 0 ? (
          <div className="block-menu__no-results">
            <p>No blocks found for "{searchTerm}"</p>
          </div>
        ) : (
          filteredBlocks.map((category) => (
            <div key={category.id} className="block-menu__category">
              <h4 className="block-menu__category-title">{category.label}</h4>
              <div className="block-menu__blocks">
                {category.blocks.map((blockType) => {
                  const config = BLOCK_TYPES_CONFIG[blockType]
                  const isSelected = blockIndex === selectedIndex
                  const currentIndex = blockIndex++

                  return (
                    <button
                      key={blockType}
                      className={`block-menu__block ${isSelected ? 'block-menu__block--selected' : ''}`}
                      onClick={() => handleBlockSelect(blockType)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <span className="block-menu__block-icon">{config.icon}</span>
                      <span className="block-menu__block-label">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="block-menu__footer">
        <p className="block-menu__hint">
          ↑↓ to navigate • Enter to select • Esc to close
        </p>
      </div>
    </div>
  )
}