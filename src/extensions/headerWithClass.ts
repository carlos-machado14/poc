import Header from '@tiptap/extension-heading';

export const HeaderWithClass = Header.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const classAttr = element.getAttribute('class');
          return classAttr || null;
        },
        renderHTML: (attributes: { class?: string | null }) => {
          if (!attributes.class) {
            return {};
          }
          return {
            class: attributes.class,
          };
        },
      },
    };
  },
});

