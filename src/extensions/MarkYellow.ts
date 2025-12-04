import { Mark } from '@tiptap/core';

// Extensão para marcação amarela (mark-yellow) - gerada pelo conversor-docx
export const MarkYellow = Mark.create({
  name: 'markYellow',
  
  addAttributes() {
    return {
      class: {
        default: 'mark-yellow',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span.mark-yellow',
      },
      {
        tag: 'span',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          // Verifica se tem a classe mark-yellow ou background #ffff00
          if (element.classList.contains('mark-yellow')) {
            return null;
          }
          const style = element.getAttribute('style') || '';
          if (style.includes('#ffff00') || style.includes('rgb(255, 255, 0)') || style.includes('yellow')) {
            return null;
          }
          return false;
        },
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

