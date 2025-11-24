import React, { useCallback } from 'react';
// É necessário importar o tipo Editor do Tiptap para tipagem correta
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
    // As classes 'toolbar-btn' e 'is-active' são esperadas em seu arquivo CSS (ex: App.css)
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
  handleOpenPdf: () => void;
  handleInsertImage: () => void;
  handleLink: () => void; // Handler de link dedicado
  handleInlineCommand: (commandName: string) => void; // Para comandos Tiptap (bold, italic) - não usado diretamente
}

// Lista de fontes
const FONT_OPTIONS = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 
    'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'
];

// Lista de tamanhos
const SIZE_OPTIONS = [
    '8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', 
    '28px', '32px', '36px', '48px', '72px'
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
    editor, 
    handleOpenDocx,
    handleOpenPdf,
    handleInsertImage, 
    handleLink
}) => {
    
    // Wrapper para toggleMark com useCallback
    const toggleFormat = useCallback((markName: string) => 
        editor.chain().focus().toggleMark(markName).run(), [editor]);
        
    // Wrapper para toggleHeading com useCallback
    const setHeading = useCallback((level: number) => 
        editor.chain().focus().toggleHeading({ level: level as any }).run(), [editor]);

    return (
    <div className="toolbar">
        {/* Arquivo e Mídia */}
        <ToolbarButton onClick={handleOpenDocx} isActive={false} title="Abrir arquivo DOCX">📄</ToolbarButton>
        <ToolbarButton onClick={handleOpenPdf} isActive={false} title="Abrir arquivo PDF">📕</ToolbarButton>
        <ToolbarButton onClick={handleInsertImage} isActive={false} title="Inserir imagem">🖼️</ToolbarButton>
        <ToolbarButton onClick={handleLink} isActive={editor.isActive('link')} title="Inserir Link">🔗</ToolbarButton>

        <div className="toolbar-divider" />

        {/* Estilos Inline (Nativo Tiptap) */}
        <ToolbarButton 
            onClick={() => toggleFormat('bold')}
            isActive={editor.isActive('bold')}
            title="Negrito (Ctrl+B)"
        >
            <strong>N</strong>
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
            <u>S</u>
        </ToolbarButton>
        <ToolbarButton 
            onClick={() => toggleFormat('strike')}
            isActive={editor.isActive('strike')}
            title="Riscado"
        >
            <s>S</s>
        </ToolbarButton>
        <ToolbarButton 
            onClick={() => toggleFormat('highlight')}
            isActive={editor.isActive('highlight')}
            title="Destaque"
        >
            🖍️
        </ToolbarButton>
        
        <div className="toolbar-divider" />
        
        {/* Headings */}
        <ToolbarButton 
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph') && !editor.isActive('heading')}
            title="Parágrafo padrão"
        >
            P
        </ToolbarButton>
        {[1, 2, 3].map((level) => (
            <ToolbarButton
                key={level}
                onClick={() => setHeading(level)}
                isActive={editor.isActive('heading', { level })}
                title={`Título ${level}`}
            >
                H{level}
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
        
        {/* Fonte e Tamanho */}
        <select
            className="toolbar-select"
            onChange={(e) => {
                const font = e.target.value;
                font === '' 
                    ? editor.chain().focus().unsetFontFamily().run() 
                    : editor.chain().focus().setFontFamily(font).run();
            }}
            value={editor.getAttributes('textStyle')?.fontFamily || ''}
            title="Fonte"
        >
            <option value="">Fonte</option>
            {FONT_OPTIONS.map(font => (
                <option key={font} value={font}>{font}</option>
            ))}
        </select>

        <select
            className="toolbar-select"
            onChange={(e) => {
                const size = e.target.value;
                if (size === '') {
                    if (editor.isActive('fontSize')) {
                        editor.chain().focus().unsetFontSize().run();
                    }
                } else {
                    editor.chain().focus().setFontSize(size).run();
                }
            }}
            value={editor.getAttributes('fontSize')?.fontSize || ''} 
            title="Tamanho da fonte"
        >
            <option value="">Tamanho</option>
            {SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
            ))}
        </select>
        
    </div>
    );
};


// === EDITOR SIDEBAR ===

interface EditorSidebarProps {
    editor: TiptapEditor;
    handleBlockStyle: (className: string) => void;
    applyCustomInlineStyle: (markName: string) => void;
}

const BLOCK_STYLES = [
    { className: 'bloco-verde', label: 'Bloco Verde Tracejado', title: 'Aplicar bloco verde tracejado' },
    { className: 'bloco-azul', label: 'Bloco Azul Claro', title: 'Aplicar bloco azul claro' },
    { className: 'bloco-neutro', label: 'Bloco Neutro', title: 'Aplicar bloco neutro' },
];

const INLINE_STYLES = [
    { markName: 'textoAmarelo', label: 'Texto Amarelo' },
    { markName: 'textoVerde', label: 'Texto Verde' },
    { markName: 'negritoCustom', label: 'Negrito Custom' },
];

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
    editor, 
    handleBlockStyle, 
    applyCustomInlineStyle
}) => {
    
    // 1. HELPER: Checa se a classe de bloco customizado está ativa
    const isBlockStyleActive = useCallback((className: string) => {
        if (!editor || !editor.state) return false;
        
        try {
            // Obter os atributos do nó de parágrafo pai da seleção
            const currentAttrs = editor.getAttributes('paragraph');
            // Checa se a classe customizada existe
            return (currentAttrs?.class || '').includes(className);
        } catch (error) {
            return false;
        }
    }, [editor]);
    
    // 2. HANDLER: Função que aplica OU REMOVE a classe de bloco customizado
    const handleBlockStyleToggle = (className: string) => {
        // Se o estilo *já* estiver ativo, chamamos `handleBlockStyle('')` para remover TUDO (retornar ao padrão).
        // Se você quisesse a remoção individual de uma única classe, a lógica em `updateParagraphClassCommand` precisaria de uma checagem adicional.
        // A nossa `updateParagraphClassCommand` é projetada para remover todos os 'bloco-*' antes de adicionar o novo.
        
        if (isBlockStyleActive(className)) {
             // Se já está ativo, passamos uma string vazia para remover TODOS os blocos
             handleBlockStyle(''); 
        } else {
             // Caso contrário, aplica o novo bloco (que implicitamente remove outros blocos por `updateParagraphClassCommand`)
             handleBlockStyle(className); 
        }
    };
    
    // O botão 'Parágrafo Padrão' permanece como remoção forçada
    const handleRemoveBlockStyle = () => handleBlockStyle('');

    // O applyCustomInlineStyle já usa editor.chain().focus().toggleMark(markName).run() no Editor.tsx, 
    // então a lógica de toggle já está implementada para as marcas inline!

    return (
        <div className="sidebar"> 
          <h3>Estilos</h3>

          {/* ESTILOS DE BLOCO (Agora com Toggle) */}
          {BLOCK_STYLES.map(({ className, label, title }) => (
            <button
                key={className}
                className={`style-button btn-preview-${className} ${isBlockStyleActive(className) ? 'is-active' : ''}`}
                // Usa o novo toggle handler
                onClick={() => handleBlockStyleToggle(className)} 
                title={title}
            >
                {label}
            </button>
          ))}
          
            {/* BOTÃO PARA REMOVER TODOS ESTILOS DE BLOCO */}
            <button
                className="style-button btn-preview-remove-bloco"
                onClick={handleRemoveBlockStyle}
                title="Voltar para Parágrafo Padrão (Remove qualquer bloco)"
                style={{ marginTop: '0.5rem', marginBottom: '1rem', opacity: 0.8 }}
            >
                Parágrafo Padrão
            </button>


            {/* ESTILOS INLINE CUSTOMIZADOS (Já com Toggle em applyCustomInlineStyle) */}
            {INLINE_STYLES.map(({ markName, label }) => (
                <button
                    key={markName}
                    // A checagem `editor.isActive(markName)` faz a classe `is-active` alternar automaticamente.
                    className={`style-button btn-preview-${markName} ${editor.isActive(markName) ? 'is-active' : ''}`} 
                    // Chama a função que já usa toggleMark do Tiptap (implementado em Editor.tsx)
                    onClick={() => applyCustomInlineStyle(markName)} 
                    title={`Aplicar/Remover ${label.toLowerCase()}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};