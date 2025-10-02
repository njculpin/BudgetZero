import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AssetReferenceView } from "../views/asset-reference-view";

export interface AssetReferenceOptions {
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    assetReference: {
      /**
       * Insert an asset reference
       */
      insertAssetReference: (attributes: {
        assetId: string;
        assetName: string;
        assetType: string;
        thumbnailUrl?: string;
        creatorName?: string;
        licenseType?: string;
      }) => ReturnType;
      /**
       * Update asset reference
       */
      updateAssetReference: (
        assetId: string,
        attributes: Partial<{
          assetName: string;
          assetType: string;
          thumbnailUrl: string;
          creatorName: string;
          licenseType: string;
        }>,
      ) => ReturnType;
      /**
       * Delete asset reference
       */
      deleteAssetReference: (assetId: string) => ReturnType;
    };
  }
}

export const AssetReference = Node.create<AssetReferenceOptions>({
  name: "assetReference",

  group: "block",

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      assetId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-asset-id"),
        renderHTML: (attributes) => {
          if (!attributes.assetId) {
            return {};
          }
          return {
            "data-asset-id": attributes.assetId,
          };
        },
      },
      assetName: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-asset-name"),
        renderHTML: (attributes) => {
          return {
            "data-asset-name": attributes.assetName,
          };
        },
      },
      assetType: {
        default: "model",
        parseHTML: (element) => element.getAttribute("data-asset-type"),
        renderHTML: (attributes) => {
          return {
            "data-asset-type": attributes.assetType,
          };
        },
      },
      thumbnailUrl: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-thumbnail-url"),
        renderHTML: (attributes) => {
          if (!attributes.thumbnailUrl) {
            return {};
          }
          return {
            "data-thumbnail-url": attributes.thumbnailUrl,
          };
        },
      },
      creatorName: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-creator-name"),
        renderHTML: (attributes) => {
          return {
            "data-creator-name": attributes.creatorName,
          };
        },
      },
      licenseType: {
        default: "free",
        parseHTML: (element) => element.getAttribute("data-license-type"),
        renderHTML: (attributes) => {
          return {
            "data-license-type": attributes.licenseType,
          };
        },
      },
      addedAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-added-at"),
        renderHTML: (attributes) => {
          if (!attributes.addedAt) {
            return {};
          }
          return {
            "data-added-at": attributes.addedAt,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-asset-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "asset-reference",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssetReferenceView);
  },

  addCommands() {
    return {
      insertAssetReference:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "assetReference",
            attrs: {
              ...attributes,
              addedAt: new Date().toISOString(),
            },
          });
        },

      updateAssetReference:
        (assetId, attributes) =>
        ({ state, tr, commands }) => {
          let updated = false;

          state.doc.descendants((node, pos) => {
            if (
              node.type.name === "assetReference" &&
              node.attrs.assetId === assetId
            ) {
              const newAttrs = {
                ...node.attrs,
                ...attributes,
              };

              tr.setNodeMarkup(pos, undefined, newAttrs);
              updated = true;
            }
          });

          if (updated) {
            return commands.command(({ dispatch }) => {
              if (dispatch) {
                dispatch(tr);
              }
              return true;
            });
          }

          return false;
        },

      deleteAssetReference:
        (assetId) =>
        ({ state, tr, commands }) => {
          const positions: number[] = [];

          state.doc.descendants((node, pos) => {
            if (
              node.type.name === "assetReference" &&
              node.attrs.assetId === assetId
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

          return false;
        },
    };
  },
});
