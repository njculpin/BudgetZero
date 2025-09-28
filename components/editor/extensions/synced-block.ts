import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SyncedBlockView } from '../views/synced-block-view';

export interface SyncedBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    syncedBlock: {
      /**
       * Insert a synced block
       */
      insertSyncedBlock: (attributes?: { syncId?: string; content?: any }) => ReturnType;
      /**
       * Create a new synced block from current selection
       */
      createSyncedBlock: () => ReturnType;
      /**
       * Update synced block content
       */
      updateSyncedBlock: (syncId: string, content: any) => ReturnType;
    };
  }
}

export const SyncedBlock = Node.create<SyncedBlockOptions>({
  name: 'syncedBlock',

  group: 'block',

  content: 'block+',

  isolating: true,

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      syncId: {
        default: null,
        parseHTML: element => element.getAttribute('data-sync-id'),
        renderHTML: attributes => {
          if (!attributes.syncId) {
            return {};
          }
          return {
            'data-sync-id': attributes.syncId,
          };
        },
      },
      isOriginal: {
        default: true,
        parseHTML: element => element.getAttribute('data-is-original') === 'true',
        renderHTML: attributes => ({
          'data-is-original': attributes.isOriginal,
        }),
      },
      lastSynced: {
        default: null,
        parseHTML: element => element.getAttribute('data-last-synced'),
        renderHTML: attributes => {
          if (!attributes.lastSynced) {
            return {};
          }
          return {
            'data-last-synced': attributes.lastSynced,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-sync-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'synced-block',
    }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SyncedBlockView);
  },

  addCommands() {
    return {
      insertSyncedBlock:
        (attributes = {}) =>
        ({ commands, state }) => {
          // Generate unique sync ID if not provided
          const syncId = attributes.syncId || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Create synced block with initial content
          const content = attributes.content || {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Synced block content' }],
          };

          return commands.insertContent({
            type: 'syncedBlock',
            attrs: {
              syncId,
              isOriginal: true,
              lastSynced: new Date().toISOString(),
            },
            content: [content],
          });
        },

      createSyncedBlock:
        () =>
        ({ commands, state, tr }) => {
          const { from, to } = state.selection;

          if (from === to) {
            // No selection, create empty synced block
            return commands.insertSyncedBlock();
          }

          // Get selected content
          const selectedContent = tr.doc.slice(from, to);
          const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Replace selection with synced block
          return commands
            .deleteSelection()
            .insertContent({
              type: 'syncedBlock',
              attrs: {
                syncId,
                isOriginal: true,
                lastSynced: new Date().toISOString(),
              },
              content: selectedContent.content.toJSON(),
            });
        },

      updateSyncedBlock:
        (syncId: string, content: any) =>
        ({ commands, state, tr }) => {
          // Find all synced blocks with this syncId
          const updates: { pos: number; node: any }[] = [];

          state.doc.descendants((node, pos) => {
            if (node.type.name === 'syncedBlock' && node.attrs.syncId === syncId) {
              updates.push({ pos, node });
            }
          });

          // Update all instances
          let newTr = tr;
          updates.forEach(({ pos, node }) => {
            const newAttrs = {
              ...node.attrs,
              lastSynced: new Date().toISOString(),
            };

            newTr = newTr.setNodeMarkup(pos, undefined, newAttrs);

            // Update content
            const contentStart = pos + 1;
            const contentEnd = pos + node.nodeSize - 1;
            newTr = newTr.replaceWith(contentStart, contentEnd, content);
          });

          if (newTr.docChanged) {
            return commands.command(({ dispatch }) => {
              if (dispatch) {
                dispatch(newTr);
              }
              return true;
            });
          }

          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-s': () => this.editor.commands.createSyncedBlock(),
    };
  },
});