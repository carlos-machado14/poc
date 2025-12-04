import TextAlign from '@tiptap/extension-text-align';

export const TextAlignWithAlignAttribute = TextAlign.extend({
  addGlobalAttributes() {
    return [
      {
        types: this.options.types || ['heading', 'paragraph'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              // Primeiro tenta pegar do atributo align (HTML antigo)
              const alignAttr = element.getAttribute('align');
              if (alignAttr && ['left', 'center', 'right', 'justify'].includes(alignAttr)) {
                return alignAttr;
              }
              // Se não tiver, tenta pegar do style
              const style = element.getAttribute('style');
              if (style) {
                const match = style.match(/text-align:\s*([^;]+)/);
                if (match) {
                  return match[1].trim();
                }
              }
              // Por último, tenta pegar do data-text-align
              return element.getAttribute('data-text-align');
            },
            renderHTML: (attributes: { textAlign?: string | null }) => {
              if (!attributes.textAlign) {
                return {};
              }
              // Retorna tanto o style quanto o atributo align para compatibilidade
              return {
                style: `text-align: ${attributes.textAlign}`,
                align: attributes.textAlign,
              };
            },
          },
        },
      },
    ];
  },
}).configure({
  types: ['heading', 'paragraph'],
});

