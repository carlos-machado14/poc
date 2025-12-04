import { Table } from '@tiptap/extension-table';

export const TableWithAttributes = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width'),
        renderHTML: (attributes: { width?: string | null }) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      cellpadding: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('cellpadding'),
        renderHTML: (attributes: { cellpadding?: string | null }) => {
          if (!attributes.cellpadding) {
            return {};
          }
          return {
            cellpadding: attributes.cellpadding,
          };
        },
      },
      cellspacing: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('cellspacing'),
        renderHTML: (attributes: { cellspacing?: string | null }) => {
          if (!attributes.cellspacing) {
            return {};
          }
          return {
            cellspacing: attributes.cellspacing,
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style'),
        renderHTML: (attributes: { style?: string | null }) => {
          if (!attributes.style) {
            return {};
          }
          return {
            style: attributes.style,
          };
        },
      },
    };
  },
});

