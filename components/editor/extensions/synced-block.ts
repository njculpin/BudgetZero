import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { SyncedBlockView } from "../views/synced-block-view";

export interface SyncedBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    syncedBlock: {
      /**
       * Insert a synced block
       */
      insertSyncedBlock: (attributes?: {
        syncId?: string;
        content?: any;
      }) => ReturnType;
      /**
       * Create a new synced block from current selection
       */
      createSyncedBlock: () => ReturnType;
      /**
       * Update synced block content
       */
      updateSyncedBlock: (syncId: string, content: any) => ReturnType;
      /**
       * Delete synced block(s)
       */
      deleteSyncedBlock: (syncId: string, deleteAll?: boolean) => ReturnType;
    };
  }
}

export const SyncedBlock = Node.create<SyncedBlockOptions>({
  name: "syncedBlock",

  group: "block",

  content: "block+",

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
        parseHTML: (element) => element.getAttribute("data-sync-id"),
        renderHTML: (attributes) => {
          if (!attributes.syncId) {
            return {};
          }
          return {
            "data-sync-id": attributes.syncId,
          };
        },
      },
      lastSynced: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-last-synced"),
        renderHTML: (attributes) => {
          if (!attributes.lastSynced) {
            return {};
          }
          return {
            "data-last-synced": attributes.lastSynced,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-sync-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "synced-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SyncedBlockView, {
      contentDOMElementTag: 'div',
    });
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("syncedBlockUpdater"),
        appendTransaction: (transactions, oldState, newState) => {
          // Skip if no real document changes
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          console.log("Sync block plugin: Document changed");
          let newTr = newState.tr;
          let hasUpdates = false;

          // Collect all sync blocks and group by syncId
          const syncGroups = new Map<
            string,
            Array<{ pos: number; node: any }>
          >();

          newState.doc.descendants((node, pos) => {
            if (node.type.name === "syncedBlock") {
              const syncId = node.attrs.syncId;
              if (!syncGroups.has(syncId)) {
                syncGroups.set(syncId, []);
              }
              syncGroups.get(syncId)!.push({ pos, node });
            }
          });

          // For each sync group, check if content differs and sync them
          syncGroups.forEach((blocks, syncId) => {
            if (blocks.length < 2) return; // No need to sync if only one block

            console.log(
              `Checking sync group ${syncId} with ${blocks.length} blocks`,
            );

            // Check if all blocks have the same content
            const firstContent = JSON.stringify(
              blocks[0].node.content.toJSON(),
            );
            const needsSync = blocks.some(
              ({ node }) =>
                JSON.stringify(node.content.toJSON()) !== firstContent,
            );

            if (needsSync) {
              console.log(`Syncing group ${syncId} - content differs`);

              // Use the first block's content as the source of truth
              const sourceContent = blocks[0].node.content;
              const timestamp = new Date().toISOString();

              // Sort blocks by position in reverse order to avoid position invalidation
              const sortedBlocks = [...blocks].sort((a, b) => b.pos - a.pos);

              // Update ALL blocks (including the first one) to have the same timestamp
              sortedBlocks.forEach(({ pos, node }) => {
                console.log(`Updating sync block at position ${pos}`);

                try {
                  // Validate position still exists in current transaction state
                  if (pos >= newTr.doc.content.size || pos < 0) {
                    console.warn(`Position ${pos} is beyond document bounds, skipping`);
                    return;
                  }

                  const nodeAtPos = newTr.doc.nodeAt(pos);
                  if (!nodeAtPos || nodeAtPos.type.name !== "syncedBlock") {
                    console.warn(`No sync block found at position ${pos}, skipping`);
                    return;
                  }

                  // Verify the node has the same syncId
                  if (nodeAtPos.attrs.syncId !== syncId) {
                    console.warn(`Sync ID mismatch at position ${pos}, skipping`);
                    return;
                  }

                  // Update attributes with synchronized timestamp
                  const newAttrs = {
                    ...nodeAtPos.attrs,
                    lastSynced: timestamp,
                  };

                  // Safely update node markup
                  newTr = newTr.setNodeMarkup(pos, undefined, newAttrs);

                  // Replace content for all blocks except the first one (source)
                  if (pos !== blocks[0].pos) {
                    const from = pos + 1;
                    const to = pos + nodeAtPos.nodeSize - 1;

                    // Validate the range is still valid after the markup change
                    if (from < newTr.doc.content.size && to <= newTr.doc.content.size && from < to) {
                      newTr = newTr.replaceWith(from, to, sourceContent);
                    } else {
                      console.warn(`Invalid range [${from}, ${to}] for content replacement, skipping`);
                    }
                  }

                  hasUpdates = true;
                } catch (error) {
                  console.error(`Error updating sync block at position ${pos}:`, error);
                  // Continue processing other blocks even if one fails
                }
              });
            }
          });

          return hasUpdates ? newTr : null;
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertSyncedBlock:
        (attributes = {}) =>
        ({ commands, state }) => {
          // Check if we're inside a synced block
          const { from } = state.selection;
          let isInsideSyncedBlock = false;

          state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
            if (
              node.type.name === "syncedBlock" &&
              pos < from &&
              pos + node.nodeSize > from
            ) {
              isInsideSyncedBlock = true;
              return false; // Stop traversing
            }
          });

          // Prevent nesting synced blocks
          if (isInsideSyncedBlock) {
            return false;
          }

          // Generate unique sync ID if not provided
          const syncId =
            attributes.syncId ||
            `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Create synced block with initial content
          const content = attributes.content || {
            type: "paragraph",
            content: [{ type: "text", text: "Synced block content" }],
          };

          return commands.insertContent({
            type: "syncedBlock",
            attrs: {
              syncId,
              lastSynced: new Date().toISOString(),
            },
            content: [content],
          });
        },

      createSyncedBlock:
        () =>
        ({ commands, state, tr }) => {
          const { from, to } = state.selection;

          // Check if we're inside a synced block
          let isInsideSyncedBlock = false;

          state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
            if (
              node.type.name === "syncedBlock" &&
              pos < from &&
              pos + node.nodeSize > from
            ) {
              isInsideSyncedBlock = true;
              return false; // Stop traversing
            }
          });

          // Prevent nesting synced blocks
          if (isInsideSyncedBlock) {
            return false;
          }

          if (from === to) {
            // No selection, create empty synced block
            return commands.insertSyncedBlock();
          }

          // Get selected content
          const selectedContent = tr.doc.slice(from, to);
          const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Replace selection with synced block
          commands.deleteSelection();
          return commands.insertContent({
            type: "syncedBlock",
            attrs: {
              syncId,
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
            if (
              node.type.name === "syncedBlock" &&
              node.attrs.syncId === syncId
            ) {
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

      deleteSyncedBlock:
        (syncId: string, deleteAll: boolean = false) =>
        ({ commands, state, tr }) => {
          if (deleteAll) {
            // Delete all instances of this synced block
            const positions: number[] = [];

            state.doc.descendants((node, pos) => {
              if (
                node.type.name === "syncedBlock" &&
                node.attrs.syncId === syncId
              ) {
                positions.push(pos);
              }
            });

            // Delete from end to beginning to avoid position shifts
            positions.reverse();
            let newTr = tr;

            positions.forEach((pos) => {
              const node = newTr.doc.nodeAt(pos);
              if (node) {
                newTr = newTr.delete(pos, pos + node.nodeSize);
              }
            });

            if (newTr.docChanged) {
              return commands.command(({ dispatch }) => {
                if (dispatch) {
                  dispatch(newTr);
                }
                return true;
              });
            }
          } else {
            // Delete only the current instance (convert to regular delete)
            return commands.deleteNode("syncedBlock");
          }

          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-s": () => this.editor.commands.createSyncedBlock(),
    };
  },
});
