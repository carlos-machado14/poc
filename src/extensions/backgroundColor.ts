import { Extension } from '@tiptap/core';

export const BackgroundColor = Extension.create({
  name: 'backgroundColor',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              // Tenta pegar background-color ou background do style
              const style = element.getAttribute('style') || '';
              // Procura por background-color: #cor ou background: #cor
              // Suporta tanto background-color quanto background
              const bgColorMatch = style.match(/background(?:-color)?:\s*([^;]+)/i);
              if (bgColorMatch) {
                const color = bgColorMatch[1].trim();
                // Remove espaços extras e retorna a cor
                return color;
              }
              // Também verifica se há bgcolor como atributo (HTML antigo)
              const bgcolor = element.getAttribute('bgcolor');
              if (bgcolor) {
                return bgcolor;
              }
              return null;
            },
            renderHTML: (attributes: { backgroundColor?: string | null }) => {
              if (!attributes.backgroundColor) {
                return {};
              }
              return {
                style: `background-color: ${attributes.backgroundColor}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setBackgroundColor: (backgroundColor: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { backgroundColor })
          .run();
      },
      unsetBackgroundColor: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { backgroundColor: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

