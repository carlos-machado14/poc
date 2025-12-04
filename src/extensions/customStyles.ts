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

// Extensão para Destaque 1 (texto vermelho)
export const Destaque1 = Mark.create({
  name: 'destaque1',
  addAttributes() {
    return {
      style: {
        default: 'color: #FF0000;',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          return element.style.color === 'rgb(255, 0, 0)' || element.style.color === '#FF0000' || element.style.color === '#ff0000' ? null : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, style: 'color: #FF0000;' }, 0];
  },
});

// Extensão para Destaque 2 (texto laranja)
export const Destaque2 = Mark.create({
  name: 'destaque2',
  addAttributes() {
    return {
      style: {
        default: 'color: #FF8C00;',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          return element.style.color === 'rgb(255, 140, 0)' || element.style.color === '#FF8C00' || element.style.color === '#ff8c00' ? null : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, style: 'color: #FF8C00;' }, 0];
  },
});