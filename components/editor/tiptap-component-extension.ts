import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ReusableComponent } from './reusable-component';
import { ComponentNodeView } from './component-node-view';

export interface ComponentAttributes {
  componentId: string;
  componentType: ReusableComponent['type'];
  componentTitle: string;
  componentContent: string;
  componentSettings: ReusableComponent['settings'];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    reusableComponent: {
      insertReusableComponent: (attributes: ComponentAttributes) => ReturnType;
    };
  }
}

export const ReusableComponentExtension = Node.create<{}, ComponentAttributes>({
  name: 'reusableComponent',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      componentId: {
        default: '',
        parseHTML: element => element.getAttribute('data-component-id'),
        renderHTML: attributes => {
          if (!attributes.componentId) {
            return {};
          }
          return {
            'data-component-id': attributes.componentId,
          };
        },
      },
      componentType: {
        default: 'reminder',
        parseHTML: element => element.getAttribute('data-component-type'),
        renderHTML: attributes => {
          if (!attributes.componentType) {
            return {};
          }
          return {
            'data-component-type': attributes.componentType,
          };
        },
      },
      componentTitle: {
        default: '',
        parseHTML: element => element.getAttribute('data-component-title'),
        renderHTML: attributes => {
          if (!attributes.componentTitle) {
            return {};
          }
          return {
            'data-component-title': attributes.componentTitle,
          };
        },
      },
      componentContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-component-content'),
        renderHTML: attributes => {
          if (!attributes.componentContent) {
            return {};
          }
          return {
            'data-component-content': attributes.componentContent,
          };
        },
      },
      componentSettings: {
        default: {},
        parseHTML: element => {
          const settings = element.getAttribute('data-component-settings');
          return settings ? JSON.parse(settings) : {};
        },
        renderHTML: attributes => {
          if (!attributes.componentSettings) {
            return {};
          }
          return {
            'data-component-settings': JSON.stringify(attributes.componentSettings),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="reusable-component"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'reusable-component' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ComponentNodeView);
  },

  addCommands() {
    return {
      insertReusableComponent:
        (attributes: ComponentAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});