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
              
              if (!style) {
                // Também verifica se há bgcolor como atributo (HTML antigo)
                const bgcolor = element.getAttribute('bgcolor');
                if (bgcolor) {
                  return bgcolor;
                }
                return null;
              }
              
              // Procura por background-color: #cor ou background: #cor
              // Suporta tanto background-color quanto background
              // Regex melhorado para capturar corretamente mesmo com múltiplos estilos
              // Captura a cor até encontrar ; ou fim da string (non-greedy)
              const bgColorMatch = style.match(/background(?:-color)?\s*:\s*([^;]+?)(?:\s*;|$)/i);
              if (bgColorMatch && bgColorMatch[1]) {
                let color = bgColorMatch[1].trim();
                
                // Remove espaços extras e retorna a cor
                // Se a cor já começa com #, retorna como está
                if (color.startsWith('#')) {
                  return color;
                }
                
                // Garante que cores hexadecimais tenham # se necessário
                // Testa se é uma cor hexadecimal válida (3 ou 6 dígitos)
                if (/^[0-9a-f]{3}$/i.test(color)) {
                  return `#${color}`;
                }
                if (/^[0-9a-f]{6}$/i.test(color)) {
                  return `#${color}`;
                }
                
                // Se parece ser uma cor RGB ou nome de cor, retorna como está
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

