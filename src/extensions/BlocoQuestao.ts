// src/extensions/BlocoQuestao.ts
import { Node, mergeAttributes } from '@tiptap/core';

export const BlocoQuestao = Node.create({
  name: 'blocoQuestao',

  group: 'block', // É um bloco, como um parágrafo
  content: 'inline*', // Pode conter texto, negrito, links...

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'bloco-questao',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'p',
        // Só ativa se a tag <p> tiver a classe exata 'bloco-questao'
        getAttrs: (node) => (node as HTMLElement).classList.contains('bloco-questao') && null,
      },
      {
        tag: 'div', // Suporte caso o Mammoth mande como div
        getAttrs: (node) => (node as HTMLElement).classList.contains('bloco-questao') && null,
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Renderiza como <p class="bloco-questao">
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});