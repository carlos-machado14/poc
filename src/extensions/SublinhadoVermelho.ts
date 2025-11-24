// SublinhadoVermelho.ts
import { Mark } from '@tiptap/core';

// Esta Mark irá aplicar a classe CSS 'sublinhado-vermelho' ao texto selecionado.
// Esta classe deve definir 'text-decoration: underline;' e 'text-decoration-color: red;'.

export const SublinhadoVermelho = Mark.create({
  name: 'sublinhadoVermelho',

  // Esquema Tiptap: Define a estrutura de como a Mark é armazenada
  // e renderizada para HTML.
  parseHTML() {
    return [
      {
        tag: 'span',
        // O seletor CSS que o Tiptap deve buscar ao carregar o HTML
        // Gerado pelo mammoth, que mapeamos para r[style-name='Sublinhado Vermelho'] => span.sublinhado-vermelho
        getAttrs: (node) => (node as HTMLElement).classList.contains('sublinhado-vermelho') && null,
      },
    ];
  },

  // Define como a Mark é renderizada para HTML
  renderHTML({ mark }) {
    return [
      'span', 
      { 
        class: 'sublinhado-vermelho', // Classe que será aplicada ao <span>
        'data-mark-type': this.name // Opcional: Para fácil identificação
      }, 
      0
    ];
  },
});