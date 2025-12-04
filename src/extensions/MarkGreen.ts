import { Mark } from '@tiptap/core';

// Extensão para marcação verde (mark-green)
export const MarkGreen = Mark.create({
  name: 'markGreen',
  
  addAttributes() {
    return {
      class: {
        default: 'mark-green',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span.mark-green',
      },
      {
        tag: 'span',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          // Verifica se tem a classe mark-green ou background #c5e0b3
          if (element.classList.contains('mark-green')) {
            return null;
          }
          const style = element.getAttribute('style') || '';
          if (style.includes('#c5e0b3') || style.includes('rgb(197, 224, 179)')) {
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

