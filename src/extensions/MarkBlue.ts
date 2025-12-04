import { Mark } from '@tiptap/core';

// Extensão para marcação azul (mark-blue) - gerada pelo conversor-docx
export const MarkBlue = Mark.create({
  name: 'markBlue',
  
  addAttributes() {
    return {
      class: {
        default: 'mark-blue',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span.mark-blue',
      },
      {
        tag: 'span',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          // Verifica se tem a classe mark-blue ou background #deeaf6
          if (element.classList.contains('mark-blue')) {
            return null;
          }
          const style = element.getAttribute('style') || '';
          if (style.includes('#deeaf6') || style.includes('rgb(222, 234, 246)')) {
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

