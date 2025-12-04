import { TableCell } from '@tiptap/extension-table-cell';

export const TableCellWithAttributes = TableCell.extend({
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
      bgcolor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('bgcolor'),
        renderHTML: (attributes: { bgcolor?: string | null }) => {
          if (!attributes.bgcolor) {
            return {};
          }
          return {
            bgcolor: attributes.bgcolor,
          };
        },
      },
      valign: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('valign'),
        renderHTML: (attributes: { valign?: string | null }) => {
          if (!attributes.valign) {
            return {};
          }
          return {
            valign: attributes.valign,
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

