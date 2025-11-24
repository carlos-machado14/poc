import { Mark } from '@tiptap/core';

// Extensão para texto amarelo (inline)
export const TextoAmarelo = Mark.create({
  name: 'textoAmarelo',
  
  // O Tiptap vai injetar esse atributo por padrão no HTMLAttributes
  addAttributes() {
    return {
      class: {
        default: 'texto-amarelo',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        // Seletor CSS baseado na classe renderizada
        tag: 'span.texto-amarelo',
      },
    ];
  },
  
  // [CORREÇÃO AQUI] Remove a classe redundante do array de atributos
  renderHTML({ HTMLAttributes }) {
    // Usa APENAS HTMLAttributes (que já contêm a classe) e o '0' para o conteúdo filho
    return ['span', HTMLAttributes, 0];
  },
});

// Extensão para texto verde (inline)
export const TextoVerde = Mark.create({
  name: 'textoVerde',
  addAttributes() {
    return {
      class: {
        default: 'texto-verde',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span.texto-verde',
      },
    ];
  },
  // [CORREÇÃO AQUI]
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

// Extensão para negrito customizado
export const NegritoCustom = Mark.create({
  name: 'negritoCustom',
  addAttributes() {
    return {
      class: {
        default: 'negrito',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span.negrito',
      },
    ];
  },
  // [CORREÇÃO AQUI]
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});