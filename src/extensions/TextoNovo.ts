// extensions/TextoNovo.ts (EXEMPLO)
import { Mark, mergeAttributes } from '@tiptap/core';

export const TextoNovo = Mark.create({
  name: 'textoNovo',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'texto-novo', // A classe CSS que será aplicada
      },
    };
  },

  // IMPORTANTE: Isso diz ao Tiptap para reconhecer <span class="texto-novo">
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (node) => (node as HTMLElement).classList.contains('texto-novo') && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});