import React, { useCallback, useState, useEffect } from 'react';
import { Editor as TiptapEditor } from '@tiptap/react';

// === HELPER COMPONENTS ===

interface ButtonProps {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ButtonProps> = ({ onClick, isActive, title, children }) => (
  <button
    className={`toolbar-btn ${isActive ? 'is-active' : ''}`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

// === EDITOR TOOLBAR ===

interface EditorToolbarProps {
  editor: TiptapEditor;
  handleOpenDocx: () => void;
  handleOpenDocxViaApi?: () => void;
  handleOpenPdf: () => void;
  handleInsertImage: () => void;
  handleLink: () => void;
  handleInlineCommand: (commandName: string) => void;
}

const FONT_OPTIONS = [
  'Calibri', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 
  'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  editor, 
  handleOpenDocx,
  handleOpenDocxViaApi,
  handleOpenPdf,
  handleInsertImage, 
  handleLink
}) => {
  
  const toggleFormat = useCallback((markName: string) => 
    editor.chain().focus().toggleMark(markName).run(), [editor]);
    
  const setHeading = useCallback((level: number) => 
    editor.chain().focus().toggleHeading({ level: level as any }).run(), [editor]);

  // Estado para o tamanho da fonte
  const [currentFontSize, setCurrentFontSize] = React.useState(11);

  // Obter tamanho atual da fonte (do textStyle, não fontSize diretamente)
  const getCurrentFontSize = useCallback(() => {
    if (!editor) return 11;
    try {
      const textStyleAttrs = editor.getAttributes('textStyle');
      const fontSize = textStyleAttrs?.fontSize || '11pt';
      // Extrair número do tamanho (remove 'pt', 'px', etc)
      const match = fontSize.match(/(\d+)/);
      return match ? parseInt(match[1]) : 11;
    } catch {
      return 11;
    }
  }, [editor]);

  // Atualizar tamanho da fonte quando a seleção mudar
  React.useEffect(() => {
    if (!editor) return;
    
    const updateFontSize = () => {
      const size = getCurrentFontSize();
      setCurrentFontSize(size);
    };

    // Atualizar imediatamente
    updateFontSize();

    editor.on('selectionUpdate', updateFontSize);
    editor.on('transaction', updateFontSize);

    return () => {
      editor.off('selectionUpdate', updateFontSize);
      editor.off('transaction', updateFontSize);
    };
  }, [editor, getCurrentFontSize]);

  const increaseFontSize = useCallback(() => {
    const newSize = Math.min(currentFontSize + 1, 72);
    // Se não há seleção, estender a seleção para o próximo caractere ou aplicar ao próximo texto
    if (editor.state.selection.empty) {
      // Aplicar ao próximo texto que será digitado
      editor.chain().focus().setMark('textStyle', { fontSize: `${newSize}pt` }).run();
    } else {
      // Aplicar ao texto selecionado
      editor.chain().focus().setFontSize(`${newSize}pt`).run();
    }
    setCurrentFontSize(newSize);
  }, [editor, currentFontSize]);

  const decreaseFontSize = useCallback(() => {
    const newSize = Math.max(currentFontSize - 1, 8);
    // Se não há seleção, estender a seleção para o próximo caractere ou aplicar ao próximo texto
    if (editor.state.selection.empty) {
      // Aplicar ao próximo texto que será digitado
      editor.chain().focus().setMark('textStyle', { fontSize: `${newSize}pt` }).run();
    } else {
      // Aplicar ao texto selecionado
      editor.chain().focus().setFontSize(`${newSize}pt`).run();
    }
    setCurrentFontSize(newSize);
  }, [editor, currentFontSize]);

  // Obter heading atual
  const getCurrentHeading = () => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) {
        return `H${i}`;
      }
    }
    return 'H1';
  };

  return (
    <div className="toolbar">
      {/* Dropdown de Fonte */}
      <select
        className="toolbar-select font-select"
        onChange={(e) => {
          const font = e.target.value;
          font === '' 
            ? editor.chain().focus().unsetFontFamily().run() 
            : editor.chain().focus().setFontFamily(font).run();
        }}
        value={editor.getAttributes('textStyle')?.fontFamily || 'Calibri'}
        title="Fonte"
      >
        {FONT_OPTIONS.map(font => (
          <option key={font} value={font}>{font}</option>
        ))}
      </select>

      {/* Tamanho de Fonte com +/- */}
      <div className="font-size-control">
        <button 
          className="toolbar-btn size-btn" 
          onClick={decreaseFontSize}
          title="Diminuir tamanho"
        >
          −
        </button>
        <span className="font-size-display">{currentFontSize}</span>
        <button 
          className="toolbar-btn size-btn" 
          onClick={increaseFontSize}
          title="Aumentar tamanho"
        >
          +
        </button>
      </div>

      {/* Dropdown de Estilos de Cabeçalho */}
      <select
        className="toolbar-select heading-select"
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else if (value.startsWith('h')) {
            const level = parseInt(value.substring(1));
            setHeading(level);
          }
        }}
        value={editor.isActive('paragraph') ? 'paragraph' : getCurrentHeading().toLowerCase()}
        title="Estilo de cabeçalho"
      >
        <option value="paragraph">Parágrafo</option>
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
        <option value="h4">H4</option>
        <option value="h5">H5</option>
        <option value="h6">H6</option>
      </select>

      <div className="toolbar-divider" />

      {/* Botões de Formatação: B, I, U, S */}
      <ToolbarButton 
        onClick={() => toggleFormat('bold')}
        isActive={editor.isActive('bold')}
        title="Negrito (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => toggleFormat('italic')}
        isActive={editor.isActive('italic')}
        title="Itálico (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => toggleFormat('underline')}
        isActive={editor.isActive('underline')}
        title="Sublinhado (Ctrl+U)"
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => toggleFormat('strike')}
        isActive={editor.isActive('strike')}
        title="Riscado"
      >
        <s>S</s>
      </ToolbarButton>

      <div className="toolbar-divider" />

      {/* Seletor de Cor de Texto */}
      <input
        type="color"
        className="toolbar-color-picker"
        onChange={(e) => {
          editor.chain().focus().setColor(e.target.value).run();
        }}
        value={editor.getAttributes('textStyle')?.color || '#000000'}
        title="Cor do texto"
      />

      <div className="toolbar-divider" />

      {/* Alinhamento */}
      {['left', 'center', 'right', 'justify'].map((align) => (
        <ToolbarButton
          key={align}
          onClick={() => editor.chain().focus().setTextAlign(align as any).run()}
          isActive={editor.isActive({ textAlign: align })}
          title={
            align === 'left' ? 'Alinhar à esquerda' :
            align === 'center' ? 'Centralizar' :
            align === 'right' ? 'Alinhar à direita' :
            'Justificar'
          }
        >
          {
            align === 'left' ? '⬅' :
            align === 'center' ? '⬌' :
            align === 'right' ? '➡' :
            '⬌⬌'
          }
        </ToolbarButton>
      ))}

      <div className="toolbar-divider" />

      {/* Listas */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Lista com marcadores"
      >
        •
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Lista numerada"
      >
        1.
      </ToolbarButton>

      <div className="toolbar-divider" />

      {/* Upload de Arquivos */}
      {handleOpenDocxViaApi && (
        <ToolbarButton 
          onClick={handleOpenDocxViaApi} 
          isActive={false} 
          title="Importar DOCX via API (convert-docx-html)"
        >
          📄
        </ToolbarButton>
      )}

      {/* Link, Imagem, Tabela */}
      <ToolbarButton onClick={handleLink} isActive={editor.isActive('link')} title="Inserir Link">
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={handleInsertImage} isActive={false} title="Inserir imagem">
        🖼️
      </ToolbarButton>
      <ToolbarButton onClick={() => {}} isActive={false} title="Inserir tabela">
        ⧉
      </ToolbarButton>

      <div className="toolbar-divider" />

      {/* Desfazer/Refazer */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        title="Desfazer (Ctrl+Z)"
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        title="Refazer (Ctrl+Y)"
      >
        ↷
      </ToolbarButton>
    </div>
  );
};

// === EDITOR SIDEBAR ===

interface EditorSidebarProps {
  editor: TiptapEditor;
  handleBlockStyle: (className: string) => void;
  applyCustomInlineStyle: (markName: string) => void;
}

// Estilos mapeados pelo conversor-docx - baseados nos estilos do App.css
const STYLE_BUTTONS = [
  // Blocos (parágrafos)
  { 
    markName: 'markYellow', 
    label: 'Marca Amarela', 
    textColor: '#000000',
    backgroundColor: '#ffff00',
    type: 'inline' as const
  },
  { 
    markName: 'markGreen', 
    label: 'Marca Verde', 
    textColor: '#000000',
    backgroundColor: '#c5e0b3',
    type: 'inline' as const
  },
  { 
    markName: 'markBlue', 
    label: 'Marca Azul', 
    border: 'none',
    borderColor: 'transparent',
    backgroundColor: '#E3F2FD',
    type: 'inline' as const
  },
  { 
    className: 'bloco-jurisprudencia', 
    label: 'Caixa verde pontilhada', 
    border: '2pt dashed',
    borderColor: '#00A86B',
    backgroundColor: '#e2efd9',
    type: 'block' as const
  },
  { 
    className: 'citacao', 
    label: 'Caixa azul pontilhada', 
    border: '2pt dashed',
    borderColor: '#00A86B',
    backgroundColor: '#EAF5FF',
    type: 'block' as const
  },
  { 
    className: 'bloco-pontilhado-verde', 
    label: 'Pontilhado verde', 
    border: '2pt dashed',
    borderColor: '#00A86B',
    backgroundColor: 'transparent',
    type: 'block' as const
  },
  { 
    markName: 'sublinhadoVermelho', 
    label: 'Grifado Vermelho', 
    textColor: '#000000',
    textDecoration: 'underline',
    textDecorationColor: 'red',
    textDecorationThickness: '2px',
    backgroundColor: '#fff',
    border: 'none',
    type: 'inline' as const
  },
];

// Interface para itens do índice
interface TableOfContentsItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

// Função para extrair cabeçalhos do editor
const extractHeadings = (editor: TiptapEditor): TableOfContentsItem[] => {
  const headings: TableOfContentsItem[] = [];
  
  if (!editor) {
    return headings;
  }
  
  try {
    // Verifica se o editor tem state e doc
    if (!editor.state || !editor.state.doc) {
      return headings;
    }
    
    // Percorre todos os nós do documento usando forEach
    editor.state.doc.forEach((node, pos) => {
      // Verifica se é um heading
      if (node.type.name === 'heading') {
        const level = node.attrs.level as number;
        const text = node.textContent?.trim() || '';
        
        if (text) {
          // Gera um ID único baseado no texto (slug)
          const id = `heading-${pos}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          headings.push({
            id,
            level,
            text,
            pos,
          });
        }
      }
    });
    
    // Se não encontrou com forEach, tenta com descendants
    if (headings.length === 0) {
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level as number;
          const text = node.textContent?.trim() || '';
          
          if (text) {
            const id = `heading-${pos}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            headings.push({
              id,
              level,
              text,
              pos,
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('Erro ao extrair headings:', error);
  }
  
  return headings;
};

// Componente de Índice
const TableOfContents: React.FC<{ editor: TiptapEditor }> = ({ editor }) => {
  const [headings, setHeadings] = useState<TableOfContentsItem[]>([]);
  
  useEffect(() => {
    if (!editor) {
      return;
    }
    
    const updateHeadings = () => {
      const extracted = extractHeadings(editor);
      setHeadings(extracted);
    };
    
    // Atualiza quando o conteúdo muda
    editor.on('update', updateHeadings);
    editor.on('create', updateHeadings);
    
    // Atualiza inicialmente com um delay para garantir que o editor está pronto
    const timeoutId = setTimeout(() => {
      updateHeadings();
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      editor.off('update', updateHeadings);
      editor.off('create', updateHeadings);
    };
  }, [editor]);
  
  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    
    // Move o cursor para a posição do heading e foca
    editor.commands.setTextSelection(pos);
    editor.commands.focus();
    
    // Scroll suave para o elemento após um pequeno delay
    setTimeout(() => {
      const { view } = editor;
      const domAtPos = view.domAtPos(pos);
      
      // Encontra o elemento heading no DOM
      let headingElement: HTMLElement | null = null;
      
      if (domAtPos.node) {
        // Se o nó é um elemento heading
        if (domAtPos.node.nodeType === Node.ELEMENT_NODE) {
          const element = domAtPos.node as HTMLElement;
          if (element.tagName && /^H[1-6]$/.test(element.tagName)) {
            headingElement = element;
          } else {
            // Procura pelo heading pai ou próximo
            let current: HTMLElement | null = element;
            while (current && !headingElement) {
              if (current.tagName && /^H[1-6]$/.test(current.tagName)) {
                headingElement = current;
                break;
              }
              current = current.parentElement;
            }
          }
        }
      }
      
      // Se não encontrou, procura por todos os headings e compara o texto
      if (!headingElement) {
        const editorDom = view.dom;
        const allHeadings = editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const { state } = editor;
        const nodeAtPos = state.doc.nodeAt(pos);
        
        if (nodeAtPos && nodeAtPos.type.name === 'heading') {
          const targetText = nodeAtPos.textContent.trim();
          
          allHeadings.forEach((heading) => {
            if (heading.textContent?.trim() === targetText) {
              headingElement = heading as HTMLElement;
            }
          });
        }
      }
      
      // Faz scroll e destaque
      if (headingElement) {
        headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Destaque temporário
        const originalBg = headingElement.style.backgroundColor;
        headingElement.style.transition = 'background-color 0.3s';
        headingElement.style.backgroundColor = '#fff3cd';
        
        setTimeout(() => {
          headingElement!.style.backgroundColor = originalBg || '';
        }, 1000);
      }
    }, 150);
  };
  
  if (headings.length === 0) {
    return (
      <div className="sidebar-content">
        <p style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
          Nenhum cabeçalho encontrado no documento. 
          <br />
          <small style={{ fontSize: '0.8rem', color: '#999' }}>
            Use H1, H2, H3, etc. no seletor de estilos da toolbar para criar cabeçalhos.
          </small>
        </p>
      </div>
    );
  }
  
  return (
    <div className="sidebar-content">
      <div className="table-of-contents">
        {headings.map((heading, index) => (
          <div
            key={`${heading.id}-${index}`}
            className={`toc-item toc-level-${heading.level}`}
            style={{
              paddingLeft: `${(heading.level - 1) * 12}px`,
              paddingTop: '4px',
              paddingBottom: '4px',
              cursor: 'pointer',
              fontSize: heading.level === 1 ? '0.95rem' : heading.level === 2 ? '0.9rem' : '0.85rem',
              fontWeight: heading.level <= 2 ? '600' : '400',
              color: '#333',
            }}
            onClick={() => scrollToHeading(heading.pos)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {heading.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  editor, 
  handleBlockStyle, 
  applyCustomInlineStyle
}) => {
  const [activeTab, setActiveTab] = useState<'estilos' | 'notas' | 'ancoras' | 'alteracoes' | 'indice'>('estilos');
  
  const isBlockStyleActive = useCallback((className: string) => {
    if (!editor || !editor.state) return false;
    try {
      // Verifica primeiro se está em um heading
      if (editor.isActive('heading')) {
        const headingAttrs = editor.getAttributes('heading');
        const classes = (headingAttrs?.class || '').split(' ').filter((c: string) => c);
        return classes.includes(className);
      }
      // Se não estiver em heading, verifica parágrafo
      const currentAttrs = editor.getAttributes('paragraph');
      const classes = (currentAttrs?.class || '').split(' ').filter((c: string) => c);
      return classes.includes(className);
    } catch (error) {
      return false;
    }
  }, [editor]);
  
  const handleBlockStyleToggle = (className: string) => {
    if (isBlockStyleActive(className)) {
      handleBlockStyle(''); 
    } else {
      handleBlockStyle(className); 
    }
  };

  return (
    <div className="sidebar"> 
      {/* Abas */}
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeTab === 'estilos' ? 'active' : ''}`}
          onClick={() => setActiveTab('estilos')}
        >
          Estilos
        </button>
        <button 
          className={`sidebar-tab ${activeTab === 'indice' ? 'active' : ''}`}
          onClick={() => setActiveTab('indice')}
        >
          Índice
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'estilos' && (
        <div className="sidebar-content">
          {STYLE_BUTTONS.map((style, index) => {
            if (style.type === 'block') {
              const isActive = isBlockStyleActive(style.className);
              return (
                <button
                  key={index}
                  className={`style-button ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleBlockStyleToggle(style.className)}
                  style={{
                    border: style.border === 'none' ? 'none' : `${style.border} ${style.borderColor}`,
                    backgroundColor: style.backgroundColor || '#fff',
                    color: style.textColor || '#333',
                    padding: '12px',
                    borderRadius: '4px',
                  }}
                  title={`Aplicar ${style.label}`}
                >
                  {style.label}
                </button>
              );
            } else {
              const isActive = editor.isActive(style.markName);
              return (
                <button
                  key={index}
                  className={`style-button ${isActive ? 'is-active' : ''}`}
                  onClick={() => applyCustomInlineStyle(style.markName)}
                  style={{
                    color: style.textColor || '#000',
                    backgroundColor: style.backgroundColor || '#fff',
                    border: '1px solid #ddd',
                    padding: '12px',
                    borderRadius: '2px',
                    textDecoration: style.textDecoration || 'none',
                    textDecorationColor: style.textDecorationColor || 'transparent',
                    textDecorationThickness: style.textDecorationThickness || '0px',
                  }}
                  title={`Aplicar ${style.label}`}
                >
                  {style.label}
                </button>
              );
            }
          })}
        </div>
      )}

      {activeTab === 'notas' && (
        <div className="sidebar-content">
          <p>Funcionalidade de Notas em desenvolvimento...</p>
        </div>
      )}

      {activeTab === 'ancoras' && (
        <div className="sidebar-content">
          <p>Funcionalidade de Âncoras em desenvolvimento...</p>
        </div>
      )}

      {activeTab === 'alteracoes' && (
        <div className="sidebar-content">
          <p>Funcionalidade de Alterações em desenvolvimento...</p>
        </div>
      )}

      {activeTab === 'indice' && (
        <TableOfContents editor={editor} />
      )}
    </div>
  );
};
