import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GridLayoutNodeView } from './grid-layout-node-view';

export interface GridLayoutAttributes {
  columns: number;
  rows?: number;
  gap?: string;
  items: Array<{
    id: string;
    type: 'text' | 'component';
    content: any;
    position: { col: number; row: number; colspan?: number; rowspan?: number };
  }>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gridLayout: {
      insertGridLayout: (attributes: GridLayoutAttributes) => ReturnType;
      addGridItem: (layoutId: string, item: any) => ReturnType;
      updateGridItem: (layoutId: string, itemId: string, updates: any) => ReturnType;
      removeGridItem: (layoutId: string, itemId: string) => ReturnType;
    };
  }
}

export const GridLayoutExtension = Node.create<{}, GridLayoutAttributes>({
  name: 'gridLayout',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: element => parseInt(element.getAttribute('data-columns') || '2'),
        renderHTML: attributes => {
          return {
            'data-columns': attributes.columns,
          };
        },
      },
      rows: {
        default: 1,
        parseHTML: element => parseInt(element.getAttribute('data-rows') || '1'),
        renderHTML: attributes => {
          return {
            'data-rows': attributes.rows,
          };
        },
      },
      gap: {
        default: '1rem',
        parseHTML: element => element.getAttribute('data-gap'),
        renderHTML: attributes => {
          return {
            'data-gap': attributes.gap,
          };
        },
      },
      items: {
        default: [],
        parseHTML: element => {
          const items = element.getAttribute('data-items');
          return items ? JSON.parse(items) : [];
        },
        renderHTML: attributes => {
          return {
            'data-items': JSON.stringify(attributes.items),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="grid-layout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'grid-layout' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GridLayoutNodeView);
  },

  addCommands() {
    return {
      insertGridLayout:
        (attributes: GridLayoutAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
      addGridItem:
        (layoutId: string, item: any) =>
        ({ tr, state }) => {
          // Implementation for adding items to existing grid
          return true;
        },
      updateGridItem:
        (layoutId: string, itemId: string, updates: any) =>
        ({ tr, state }) => {
          // Implementation for updating grid items
          return true;
        },
      removeGridItem:
        (layoutId: string, itemId: string) =>
        ({ tr, state }) => {
          // Implementation for removing grid items
          return true;
        },
    };
  },
});