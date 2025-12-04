// SublinhadoVermelho.ts
import { Mark } from '@tiptap/core';

// Esta Mark irá aplicar a classe CSS 'sublinhado-vermelho' ao texto selecionado.
// Esta classe deve definir 'text-decoration: underline;' e 'text-decoration-color: red;'.

export const SublinhadoVermelho = Mark.create({
  name: 'sublinhadoVermelho',

  addAttributes() {
    return {
      class: {
        default: 'sublinhado-vermelho',
      },
    };
  },

  // Esquema Tiptap: Define a estrutura de como a Mark é armazenada
  // e renderizada para HTML.
  parseHTML() {
    return [
      {
        tag: 'span.sublinhado-vermelho',
      },
      {
        tag: 'span',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          // Verifica se tem a classe mark-yellow ou background #ffff00
          if (element.classList.contains('sublinhado-vermelho')) {
            return null;
          }
          const style = element.getAttribute('style') || '';
          if (style.includes('text-decoration: underline;') && style.includes('text-decoration-color: red;')) {
            return null;
          }
          return false;
        },
      },
    ];
  },

  // Define como a Mark é renderizada para HTML
  renderHTML({ HTMLAttributes }) {
    // O TipTap automaticamente injeta os atributos definidos em addAttributes nos HTMLAttributes
    return ['span', HTMLAttributes, 0];
  },
});