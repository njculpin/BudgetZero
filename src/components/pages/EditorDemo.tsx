import { useState } from 'react'
import { ContentBlock, CreateBlockInput, GridPosition, BLOCK_TYPES_CONFIG } from '../../types/editor'
import { BlockEditor } from '../editor/core/BlockEditor'
import { DashboardLayout } from '../layouts'

// Mock blocks for demo
const mockBlocks: ContentBlock[] = [
  {
    id: 'block-1',
    page_id: 'demo-page',
    type: 'heading',
    content: { text: 'Welcome to the Enhanced Block Editor', level: 1 },
    style_config: {},
    grid_position: { row: 1, col: 1, rowSpan: 1, colSpan: 12 },
    order_index: 0,
    is_template: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'block-2',
    page_id: 'demo-page',
    type: 'paragraph',
    content: { text: 'This is a demonstration of the new Notion-like block-based editor for game development. Try clicking "/" to add new blocks!' },
    style_config: {},
    grid_position: { row: 2, col: 1, rowSpan: 1, colSpan: 12 },
    order_index: 1,
    is_template: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'block-3',
    page_id: 'demo-page',
    type: 'rule_snippet',
    content: {
      title: 'Movement Rule',
      description: 'How players move around the board',
      ruleText: 'Players can move up to 3 spaces per turn in any direction.',
      category: 'movement',
      tags: ['basic', 'movement']
    },
    style_config: {},
    grid_position: { row: 3, col: 1, rowSpan: 1, colSpan: 6 },
    order_index: 2,
    is_template: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'block-4',
    page_id: 'demo-page',
    type: 'component_definition',
    content: {
      name: 'Game Board',
      description: 'The main playing surface',
      specifications: [
        { property: 'Size', value: '20x20 grid' },
        { property: 'Material', value: 'Cardboard' }
      ]
    },
    style_config: {},
    grid_position: { row: 3, col: 7, rowSpan: 1, colSpan: 6 },
    order_index: 3,
    is_template: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export function EditorDemo() {
  const [blocks, setBlocks] = useState<ContentBlock[]>(mockBlocks)

  const handleBlockCreate = (input: CreateBlockInput) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      page_id: input.page_id,
      type: input.type,
      content: input.content || BLOCK_TYPES_CONFIG[input.type].defaultContent,
      style_config: {},
      grid_position: input.grid_position || {
        row: Math.max(...blocks.map(b => b.grid_position.row + b.grid_position.rowSpan), 1),
        col: 1,
        rowSpan: 1,
        colSpan: 12
      },
      order_index: blocks.length,
      is_template: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setBlocks(prev => [...prev, newBlock])
  }

  const handleBlockUpdate = (blockId: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(block =>
      block.id === blockId
        ? { ...block, ...updates, updated_at: new Date().toISOString() }
        : block
    ))
  }

  const handleBlockDelete = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId))
  }

  const handleBlockMove = (blockId: string, newPosition: GridPosition) => {
    handleBlockUpdate(blockId, { grid_position: newPosition })
  }

  return (
    <DashboardLayout currentPage="editor-demo">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1>Block Editor Demo</h1>
          <p style={{ color: 'var(--color-gray-600)' }}>
            Test the new Notion-like editor for game development projects
          </p>
          <div style={{
            background: 'var(--color-info-light)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius-md)',
            marginTop: 'var(--spacing-lg)'
          }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
              <strong>Try these features:</strong><br />
              • Click on any block to edit it<br />
              • Press "/" to open the block menu<br />
              • Drag blocks to rearrange them<br />
              • Use the toolbar to adjust block settings
            </p>
          </div>
        </div>

        <div style={{
          background: 'var(--color-background)',
          border: '1px solid var(--color-gray-300)',
          borderRadius: 'var(--border-radius-lg)',
          minHeight: '600px'
        }}>
          <BlockEditor
            pageId="demo-page"
            blocks={blocks}
            onBlockCreate={handleBlockCreate}
            onBlockUpdate={handleBlockUpdate}
            onBlockDelete={handleBlockDelete}
            onBlockMove={handleBlockMove}
            isEditable={true}
            gridColumns={12}
          />
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
            Current blocks: {blocks.length} |
            Block types available: {Object.keys(BLOCK_TYPES_CONFIG).length}
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}