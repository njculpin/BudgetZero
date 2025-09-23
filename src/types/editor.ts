// Enhanced Editor Types for Block-Based Content System

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'quote'
  | 'image'
  | 'table'
  | 'divider'
  | 'rule_snippet'
  | 'component_definition'
  | 'stat_block'
  | 'example_play'
  | 'designer_note'
  | 'template'

export type PageTemplateType =
  | 'blank'
  | 'rules_section'
  | 'component_spec'
  | 'quick_start'
  | 'playtesting_notes'
  | 'design_rationale'

export interface GridPosition {
  row: number
  col: number
  rowSpan: number
  colSpan: number
}

export interface ProjectSection {
  id: string
  project_id: string
  name: string
  description?: string
  icon: string
  order_index: number
  is_archived: boolean
  created_at: string
  updated_at: string
  pages?: ProjectPage[]
}

export interface ProjectPage {
  id: string
  section_id: string
  title: string
  template_type: PageTemplateType
  order_index: number
  is_archived: boolean
  last_edited_by?: string
  created_at: string
  updated_at: string
  blocks?: ContentBlock[]
}

export interface StyleConfig {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  margin?: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  opacity?: number
  zIndex?: number
}

export interface ContentBlock {
  id: string
  page_id: string
  type: BlockType
  content: BlockContent
  style_config: StyleConfig
  grid_position: GridPosition
  order_index: number
  is_template: boolean
  template_name?: string
  template_category?: string
  created_at: string
  updated_at: string
}

export interface BlockTemplate {
  id: string
  project_id: string
  name: string
  description?: string
  category: string
  type: BlockType
  content: BlockContent
  style_config: StyleConfig
  usage_count: number
  tags: string[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface CursorPosition {
  blockId?: string
  offset?: number
  x?: number
  y?: number
}

export interface PageCollaboration {
  id: string
  page_id: string
  user_id: string
  cursor_position?: CursorPosition
  is_editing: boolean
  last_seen: string
}

// Block content type definitions
export interface ParagraphContent {
  text: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
}

export interface HeadingContent {
  text: string
  level: 1 | 2 | 3 | 4 | 5 | 6
  alignment?: 'left' | 'center' | 'right'
}

export interface ListContent {
  items: Array<{
    id: string
    text: string
    level: number
  }>
  type: 'bulleted' | 'numbered' | 'checklist'
}

export interface QuoteContent {
  text: string
  author?: string
  citation?: string
}

export interface ImageContent {
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
  alignment?: 'left' | 'center' | 'right'
}

export interface TableContent {
  headers: string[]
  rows: string[][]
  hasHeaders: boolean
}

export interface RuleSnippetContent {
  title: string
  description: string
  ruleText: string
  category: string
  tags: string[]
  examples?: string[]
}

export interface ComponentDefinitionContent {
  name: string
  description: string
  specifications: Array<{
    property: string
    value: string
    notes?: string
  }>
  image?: string
}

export interface StatBlockContent {
  title: string
  stats: Array<{
    name: string
    value: string | number
    description?: string
  }>
  type?: 'character' | 'item' | 'ability' | 'custom'
}

export interface ExamplePlayContent {
  title: string
  scenario: string
  steps: Array<{
    player?: string
    action: string
    result: string
  }>
  outcome: string
}

export interface DesignerNoteContent {
  note: string
  type: 'idea' | 'concern' | 'alternative' | 'decision'
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
}

// Union type for all block content
export type BlockContent =
  | ParagraphContent
  | HeadingContent
  | ListContent
  | QuoteContent
  | ImageContent
  | TableContent
  | RuleSnippetContent
  | ComponentDefinitionContent
  | StatBlockContent
  | ExamplePlayContent
  | DesignerNoteContent

// Editor events and state
export interface EditorState {
  selectedBlockId?: string
  isEditing: boolean
  isDragging: boolean
  draggedBlockId?: string
  showBlockMenu: boolean
  blockMenuPosition?: { x: number; y: number }
  collaborators: PageCollaboration[]
}

export interface BlockMenuAction {
  id: string
  label: string
  icon: string
  blockType?: BlockType
  action: () => void
}

export interface DraggedBlock {
  id: string
  type: BlockType
  content: BlockContent
  grid_position: GridPosition
}

// Editor configuration
export interface EditorConfig {
  gridColumns: number
  gridGap: number
  minBlockHeight: number
  maxBlockHeight?: number
  autoSave: boolean
  autoSaveInterval: number
  collaborationEnabled: boolean
  templatesEnabled: boolean
}

// Template categories for game development
export const TEMPLATE_CATEGORIES = {
  RULES: 'rules',
  COMPONENTS: 'components',
  MECHANICS: 'mechanics',
  EXAMPLES: 'examples',
  NOTES: 'notes',
  GENERAL: 'general'
} as const

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[keyof typeof TEMPLATE_CATEGORIES]

// Block creation helpers
export interface CreateBlockInput {
  page_id: string
  type: BlockType
  content: BlockContent
  grid_position?: Partial<GridPosition>
  order_index?: number
}

export interface UpdateBlockInput {
  id: string
  content?: Partial<BlockContent>
  style_config?: Partial<StyleConfig>
  grid_position?: Partial<GridPosition>
  order_index?: number
}

// Drag and drop types
export interface DragItem {
  type: 'block' | 'template'
  id: string
  blockType: BlockType
  content?: BlockContent
  sourcePosition?: GridPosition
}

export interface DropTarget {
  page_id: string
  position: GridPosition
  isValid: boolean
}

// Export utilities and constants
export const DEFAULT_GRID_POSITION: GridPosition = {
  row: 1,
  col: 1,
  rowSpan: 1,
  colSpan: 12
}

export const BLOCK_TYPES_CONFIG: Record<BlockType, {
  label: string
  icon: string
  category: string
  defaultContent: BlockContent
  minHeight: number
}> = {
  paragraph: {
    label: 'Paragraph',
    icon: '📝',
    category: 'text',
    defaultContent: { text: '', alignment: 'left' },
    minHeight: 60
  },
  heading: {
    label: 'Heading',
    icon: 'H',
    category: 'text',
    defaultContent: { text: '', level: 1, alignment: 'left' },
    minHeight: 40
  },
  list: {
    label: 'List',
    icon: '•',
    category: 'text',
    defaultContent: { items: [{ id: '1', text: '', level: 0 }], type: 'bulleted' },
    minHeight: 80
  },
  quote: {
    label: 'Quote',
    icon: '"',
    category: 'text',
    defaultContent: { text: '' },
    minHeight: 80
  },
  image: {
    label: 'Image',
    icon: '🖼️',
    category: 'media',
    defaultContent: { url: '', alt: '', alignment: 'center' },
    minHeight: 200
  },
  table: {
    label: 'Table',
    icon: '⊞',
    category: 'layout',
    defaultContent: { headers: ['Column 1', 'Column 2'], rows: [['', '']], hasHeaders: true },
    minHeight: 120
  },
  divider: {
    label: 'Divider',
    icon: '―',
    category: 'layout',
    defaultContent: {},
    minHeight: 20
  },
  rule_snippet: {
    label: 'Rule Snippet',
    icon: '📋',
    category: 'game',
    defaultContent: { title: '', description: '', ruleText: '', category: '', tags: [] },
    minHeight: 120
  },
  component_definition: {
    label: 'Component',
    icon: '🎲',
    category: 'game',
    defaultContent: { name: '', description: '', specifications: [] },
    minHeight: 150
  },
  stat_block: {
    label: 'Stat Block',
    icon: '📊',
    category: 'game',
    defaultContent: { title: '', stats: [], type: 'custom' },
    minHeight: 100
  },
  example_play: {
    label: 'Example Play',
    icon: '🎮',
    category: 'game',
    defaultContent: { title: '', scenario: '', steps: [], outcome: '' },
    minHeight: 200
  },
  designer_note: {
    label: 'Designer Note',
    icon: '💡',
    category: 'notes',
    defaultContent: { note: '', type: 'idea', priority: 'medium' },
    minHeight: 80
  },
  template: {
    label: 'Template',
    icon: '📄',
    category: 'template',
    defaultContent: {},
    minHeight: 60
  }
}