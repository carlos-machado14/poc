import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
// Extensões - as mesmas do editor para garantir consistência de visualização
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { getNote, getFile } from '../db';
import { TextoAmarelo, TextoVerde, NegritoCustom } from '../extensions/customStyles';
import { ParagraphWithClass } from '../extensions/paragraphWithClass';
import { FontSize } from '../extensions/fontSize';
import '../App.css';
import './Viewer.css';

// Constantes de persistência (serão prefixadas com fileId se disponível)
const getStorageKey = (baseKey: string, fileId?: string) => {
  return fileId ? `${baseKey}_${fileId}` : baseKey;
};

// Definição da interface Marking (Simplificação do campo `startPath/endPath` - são muito instáveis para grandes refatorações)
interface Marking {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  comment?: string;
  createdAt: number;
  markerId: string;
}

interface ViewerProps {
  onBack: () => void;
  fileId?: string;
}

// =========================================================================
// FUNÇÕES AUXILIARES PARA PERSISTÊNCIA E DOM (movendo algumas lógicas para fora do componente)

/**
 * Salva as marcações no localStorage
 */
const saveMarkings = (markings: Marking[], fileId?: string) => {
  const key = getStorageKey('viewer_markings', fileId);
  localStorage.setItem(key, JSON.stringify(markings));
};

/**
 * Carrega as marcações do localStorage
 */
const loadMarkings = (fileId?: string): Marking[] => {
  const key = getStorageKey('viewer_markings', fileId);
  const savedMarkings = localStorage.getItem(key);
  return savedMarkings ? JSON.parse(savedMarkings) : [];
};

/**
 * Normaliza o HTML (remoção de quebras de linha e espaços múltiplos) para comparação.
 */
const normalizeHtmlContent = (html: string) => html.replace(/[\n\r\t]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Tenta encontrar a posição de `marking.text` em `content` e envolvê-la com a tag <mark>.
 * Este é um método de fallback após uma edição.
 * ATENÇÃO: Se houver várias ocorrências idênticas do texto, ele marcará a primeira.
 */
const applyMarkingToContentFallback = (content: string, marking: Marking): string => {
    
    // Tentar encontrar o texto sem a tag <mark> ao redor
    const markStartTag = `<mark data-marking-id="mark-${marking.markerId}" style="background-color: ${marking.color}; cursor: pointer;" title="${marking.comment || 'Sem comentário'}">`;
    const markEndTag = `</mark>`;

    let index = content.indexOf(marking.text);

    // Iterar para encontrar a primeira ocorrência que não está *já* marcada
    while (index !== -1) {
        // Verifica se a substring antes do texto selecionado termina em `>` de </mark>
        const before = content.substring(0, index);
        const lastClosingMark = before.lastIndexOf('</mark>');

        if (
            // A última marcação fechada deve vir antes da última marcação aberta 
            // (Para cobrir o caso onde o texto está no meio de outra marcação - é complexo, mas necessário)
            // Abordagem simples: O texto não deve ser uma substring de um [title="..."...]
             before.lastIndexOf(`<mark data-marking-id`) < lastClosingMark
        ) {
            // O texto não está imediatamente precedido por um `<mark>` ou `</mark>`
            
            // Aqui substituímos e terminamos a iteração
            return content.substring(0, index) + markStartTag + marking.text + markEndTag + content.substring(index + marking.text.length);
        }
        
        // Se a busca falhou, tenta a próxima ocorrência
        index = content.indexOf(marking.text, index + 1);
    }

    return content;
};


// =========================================================================

const Viewer: React.FC<ViewerProps> = ({ onBack, fileId }) => {
  const [markings, setMarkings] = useState<Marking[]>(loadMarkings(fileId));
  const [selectedMarking, setSelectedMarking] = useState<Marking | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [markingColor, setMarkingColor] = useState('#FFF36A');
  const [fileName, setFileName] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const savedRangeRef = useRef<Range | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        paragraph: false, // Desabilitar Parágrafo padrão 
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      ParagraphWithClass, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }), Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      Image.configure({ inline: true, allowBase64: true }), TextStyle,
      FontFamily.configure({ types: ['textStyle'] }), FontSize,
      TextoAmarelo, TextoVerde, NegritoCustom,
    ],
    content: '',
    editable: false, // O visualizador deve ser *sempre* não-editável
  });

  // Salvar a cor selecionada (persistência simples para melhor UX)
  useEffect(() => {
    const savedColor = localStorage.getItem('viewer_marking_color');
    if (savedColor) {
      setMarkingColor(savedColor);
    }
  }, []);

  // Handler para cor, persistindo o valor
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setMarkingColor(newColor);
    localStorage.setItem('viewer_marking_color', newColor);
  };
  
  // Função para limpar todas as tags <mark> existentes no HTML
  const stripMarkingTags = useCallback((html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Tenta ser mais seguro, usando atributos para identificar o elemento
    tempDiv.querySelectorAll('[data-marking-id]').forEach(mark => {
        const parent = mark.parentNode;
        // Move o conteúdo para fora do <mark> e deleta o <mark>
        while (mark.firstChild) {
            parent?.insertBefore(mark.firstChild, mark);
        }
        parent?.removeChild(mark);
    });

    return tempDiv.innerHTML;
  }, []);

  // Função central para aplicar todas as marcações salvas ao conteúdo original
  const reapplyMarkings = useCallback((content: string, currentMarkings: Marking[]) => {
    if (!content) return '';

    // Remove qualquer marcação anterior que possa ter restado para aplicar do zero
    let strippedContent = stripMarkingTags(content);
    
    let contentWithMarks = strippedContent;
    
    // Aplica cada marcação de forma segura (fallback)
    // O problema de mapeamento de offset de DOM é inerente ao Tiptap/ProseMirror.
    // Usar uma função de busca simples por texto (como applyMarkingToContentFallback) é a maneira 
    // mais resiliente após grandes edições, assumindo que o texto selecionado se manteve único.

    currentMarkings.forEach(marking => {
        contentWithMarks = applyMarkingToContentFallback(contentWithMarks, marking);
    });

    return contentWithMarks;
  }, [stripMarkingTags]);

  // Carregar conteúdo atualizado e aplicar marcações
  useEffect(() => {
    const loadContent = async () => {
      if (!editor) return;

      let currentContent = '';
      
      if (fileId) {
        // Carregar arquivo específico
        const file = await getFile(fileId);
        if (file) {
          currentContent = file.content;
          setFileName(file.name);
        }
      } else {
        // Fallback: carregar nota antiga (compatibilidade)
        const note = await getNote();
        currentContent = note?.content || '';
      }

      const loadedMarkings = loadMarkings(fileId);
      setMarkings(loadedMarkings);

      // Chaves de storage específicas por arquivo
      const STORAGE_ORIGINAL_CONTENT_KEY = getStorageKey('viewer_original_content', fileId);
      const STORAGE_CONTENT_WITH_MARKINGS_KEY = getStorageKey('viewer_content_with_markings', fileId);
      const STORAGE_SCROLL_POSITION_KEY = getStorageKey('viewer_scroll_position', fileId);

      // Normalizar e comparar com o conteúdo original salvo
      const savedOriginalContent = localStorage.getItem(STORAGE_ORIGINAL_CONTENT_KEY);
      const currentNormalized = normalizeHtmlContent(currentContent);
      const savedNormalized = savedOriginalContent ? normalizeHtmlContent(savedOriginalContent) : '';
      
      let contentToSet = currentContent;
      
      if (savedNormalized !== currentNormalized || !savedOriginalContent) {
        // CONTEÚDO NOVO/ATUALIZADO (Editor foi alterado)
        setOriginalContent(currentContent);
        localStorage.setItem(STORAGE_ORIGINAL_CONTENT_KEY, currentContent);
        
        if (loadedMarkings.length > 0) {
          contentToSet = reapplyMarkings(currentContent, loadedMarkings);
        }
        localStorage.setItem(STORAGE_CONTENT_WITH_MARKINGS_KEY, contentToSet);

      } else {
        // CONTEÚDO ESTÁVEL (Editor não foi alterado desde o último visualizador)
        setOriginalContent(savedOriginalContent);
        const savedContentWithMarkings = localStorage.getItem(STORAGE_CONTENT_WITH_MARKINGS_KEY);
        
        if (savedContentWithMarkings && loadedMarkings.length > 0) {
          // Usar conteúdo com marcações já aplicado (performance)
          contentToSet = savedContentWithMarkings;
        } else if (loadedMarkings.length > 0) {
          // Conteúdo original está lá, mas o HTML marcado não (erro ou primeiro load)
          contentToSet = reapplyMarkings(savedOriginalContent, loadedMarkings);
          localStorage.setItem(STORAGE_CONTENT_WITH_MARKINGS_KEY, contentToSet);
        }
      }

      editor.commands.setContent(contentToSet);

      // Restaurar posição de scroll (otimizado com requestAnimationFrame)
      requestAnimationFrame(() => {
        const savedScrollPosition = localStorage.getItem(STORAGE_SCROLL_POSITION_KEY);
        if (savedScrollPosition && contentContainerRef.current) {
          contentContainerRef.current.scrollTop = parseInt(savedScrollPosition, 10);
        }
      });
    };

    if (editor) {
      loadContent();
    }
  }, [editor, fileId, reapplyMarkings]);


  // Salvar posição de scroll (usando debounce seria melhor, mas `scroll` funciona)
  useEffect(() => {
    const handleScroll = () => {
      if (contentContainerRef.current) {
        const scrollPosition = contentContainerRef.current.scrollTop;
        const STORAGE_SCROLL_POSITION_KEY = getStorageKey('viewer_scroll_position', fileId);
        localStorage.setItem(STORAGE_SCROLL_POSITION_KEY, scrollPosition.toString());
      }
    };

    const container = contentContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [fileId]);

  // Handle Text Selection (usado para NOVA ou EDITAR marcação)
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !viewerRef.current) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    const targetElement = viewerRef.current.querySelector('.ProseMirror') as HTMLElement;
    
    // Ignorar seleção fora da área do editor ou seleção vazia/pequena
    if (!targetElement.contains(range.commonAncestorContainer) || !selectedText) return;

    // Verificar se está em um elemento já marcado (EDITAR)
    let parent: Node | null = range.commonAncestorContainer;
    while (parent && parent !== viewerRef.current) {
      if (parent.nodeType === Node.ELEMENT_NODE) {
        const element = parent as HTMLElement;
        // Simplificação: o alvo será a tag <mark> criada no Viewer
        if (element.tagName === 'MARK' && element.hasAttribute('data-marking-id')) { 
          const markerId = element.getAttribute('data-marking-id');
          const existingMarking = markings.find(m => m.markerId === markerId);
          
          if (existingMarking) {
            setSelectedMarking(existingMarking);
            setCommentText(existingMarking.comment || '');
            setShowCommentModal(true);
            return; // Termina, pois estamos editando
          }
        }
      }
      parent = parent.parentNode;
    }
    
    // NENHUMA MARCAÇÃO existente encontrada: (NOVA MARCAÇÃO)
    if (selectedText.length < 2) return;
    
    // Salvar o range DOM. O range não tem 'offset' estável como TipTap
    savedRangeRef.current = range.cloneRange();

    const newMarking: Marking = {
      id: Date.now().toString(),
      text: selectedText,
      startOffset: -1, // Marcadores de posição DOM instáveis, -1
      endOffset: -1, 
      color: markingColor,
      createdAt: Date.now(),
      markerId: `mark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único no DOM
    };

    setSelectedMarking(newMarking);
    setCommentText(''); // Iniciar com comentário vazio para a nova marcação
    setShowCommentModal(true);
    window.getSelection()?.removeAllRanges(); // Limpar a seleção para melhor UX
  };

  const handleAddMarking = () => {
    if (!selectedMarking || !editor || !viewerRef.current) return;

    const newMarking: Marking = {
      ...selectedMarking,
      comment: commentText.trim() || undefined,
    };

    const updatedMarkings = [...markings, newMarking];
    setMarkings(updatedMarkings);
    saveMarkings(updatedMarkings, fileId); // Salvar marcações atualizadas

    const editorHtml = editor.getHTML();
    const STORAGE_CONTENT_WITH_MARKINGS_KEY = getStorageKey('viewer_content_with_markings', fileId);

    // 1. Tentar aplicar ao DOM imediatamente via Range (mais preciso se Range for válido)
    const proseMirror = viewerRef.current.querySelector('.ProseMirror') as HTMLElement;

    if (savedRangeRef.current && proseMirror.contains(savedRangeRef.current.commonAncestorContainer)) {
        try {
            const mark = document.createElement('mark');
            mark.setAttribute('data-marking-id', newMarking.markerId);
            mark.setAttribute('style', `background-color: ${newMarking.color}; cursor: pointer;`);
            mark.setAttribute('title', newMarking.comment || 'Sem comentário');

            // Usar extractContents/insertNode para maior robustez que surroundContents
            const contents = savedRangeRef.current.extractContents();
            mark.appendChild(contents);
            savedRangeRef.current.insertNode(mark);
            
            editor.commands.setContent(proseMirror.innerHTML); // Forçar o Tiptap a reconhecer a alteração DOM
            localStorage.setItem(STORAGE_CONTENT_WITH_MARKINGS_KEY, proseMirror.innerHTML);

        } catch (error) {
            // 2. Fallback: Aplicar por texto (Se a manipulação de range falhar - mais propenso a erro)
            console.error("Falha ao aplicar por Range. Aplicando por texto.");
            const markedHtml = applyMarkingToContentFallback(editorHtml, newMarking);
            editor.commands.setContent(markedHtml);
            localStorage.setItem(STORAGE_CONTENT_WITH_MARKINGS_KEY, markedHtml);
        }

    } else {
        // 2. Fallback: Aplicar por texto (se o range estiver perdido)
        const markedHtml = applyMarkingToContentFallback(editorHtml, newMarking);
        editor.commands.setContent(markedHtml);
        localStorage.setItem(STORAGE_CONTENT_WITH_MARKINGS_KEY, markedHtml);
    }
    
    // Limpeza
    setShowCommentModal(false);
    setCommentText('');
    setSelectedMarking(null);
    savedRangeRef.current = null;
  };


  const handleDeleteMarking = (id: string) => {
    if (!editor || !viewerRef.current) return;
    
    const updatedMarkings = markings.filter((m) => m.id !== id);
    setMarkings(updatedMarkings);
    saveMarkings(updatedMarkings, fileId); // Persistir
    
    const STORAGE_ORIGINAL_CONTENT_KEY = getStorageKey('viewer_original_content', fileId);
    const STORAGE_CONTENT_WITH_MARKINGS_KEY = getStorageKey('viewer_content_with_markings', fileId);
    
    // Recarregar o conteúdo original (salvo) e aplicar *apenas* as marcações restantes
    const content = originalContent || localStorage.getItem(STORAGE_ORIGINAL_CONTENT_KEY) || editor.getHTML();
    
    // Recriar o HTML com o conjunto de marcações reduzido
    const contentWithMarkings = reapplyMarkings(content, updatedMarkings);
    
    // Atualizar editor e persistir
    editor.commands.setContent(contentWithMarkings); 
    localStorage.setItem(STORAGE_CONTENT_WITH_MARKINGS_KEY, contentWithMarkings);
  };

  const handleEditComment = (marking: Marking) => {
    setSelectedMarking(marking);
    setCommentText(marking.comment || '');
    setShowCommentModal(true);
  };

  const handleUpdateComment = () => {
    if (!selectedMarking || !editor || !viewerRef.current) return;

    const newComment = commentText.trim() || undefined;
    
    const updatedMarkings = markings.map((m) =>
      m.id === selectedMarking.id
        ? { ...m, comment: newComment }
        : m
    );
    setMarkings(updatedMarkings);
    saveMarkings(updatedMarkings, fileId); // Persistir

    const STORAGE_CONTENT_WITH_MARKINGS_KEY = getStorageKey('viewer_content_with_markings', fileId);

    // Atualizar 'title' do mark diretamente no DOM para refletir o novo comentário
    const markElement = viewerRef.current.querySelector(`[data-marking-id="${selectedMarking.markerId}"]`);
    if (markElement) {
        markElement.setAttribute('title', newComment || 'Sem comentário');
        // Forçar o Tiptap a atualizar (Embora 'title' seja apenas HTML, ajuda na coerência)
        editor.commands.setContent(viewerRef.current.querySelector('.ProseMirror')!.innerHTML);
        localStorage.setItem(STORAGE_CONTENT_WITH_MARKINGS_KEY, editor.getHTML());
    }
    
    setShowCommentModal(false);
    setCommentText('');
    setSelectedMarking(null);
  };


  if (!editor) {
    return <div className="app-container">Carregando visualizador...</div>;
  }

  // --- JSX de Renderização ---
  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="back-button" title="Voltar">
            ← Voltar
          </button>
          <h1>👁️ Visualizador{fileName && ` - ${fileName}`}</h1>
        </div>

        <div className="viewer-toolbar">
          <div className="color-picker">
            <label>Cor da marcação:</label>
            <input
              type="color"
              value={markingColor}
              onChange={handleColorChange}
              title="Escolha a cor para as marcações"
            />
            <span style={{ background: markingColor, padding: '4px 8px', borderRadius: '4px' }}>
              {markingColor}
            </span>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="viewer-wrapper">
          <div className="viewer-instructions">
            <p>💡 <strong>Dica:</strong> Selecione um texto para *Adicionar* ou clique em uma marcação existente para *Editar*.</p>
          </div>

          <div
            ref={viewerRef}
            className="viewer-content"
            onMouseUp={handleTextSelection} // Tratamento da seleção de texto para marcação/edição
          >
            <div ref={contentContainerRef} className="viewer-content-scroll">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        <div className="viewer-sidebar">
          <h3>Marcações ({markings.length})</h3>

          {markings.length === 0 ? (
            <p className="no-markings">Nenhuma marcação ainda. Selecione um texto para começar!</p>
          ) : (
            <div className="markings-list">
              {[...markings].reverse().map((marking) => ( // Reverse para mostrar os mais recentes primeiro
                <div key={marking.id} className="marking-item">
                  <div className="marking-header">
                    <span
                      className="marking-color-indicator"
                      style={{ backgroundColor: marking.color }}
                    />
                    <span className="marking-date">
                      {new Date(marking.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      className="marking-delete-btn"
                      onClick={() => handleDeleteMarking(marking.id)}
                      title="Excluir marcação"
                    >
                      ×
                    </button>
                  </div>
                  <div className="marking-text">{marking.text}</div>
                  {marking.comment && (
                    <div className="marking-comment">
                      <strong>Comentário:</strong> {marking.comment}
                    </div>
                  )}
                  <button
                    className="marking-edit-btn"
                    onClick={() => handleEditComment(marking)}
                  >
                    {marking.comment ? 'Editar' : 'Adicionar'} Comentário
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Comentário (Se precisar de refatoração, isole-o em um componente separado) */}
      {showCommentModal && selectedMarking && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {markings.find((m) => m.id === selectedMarking.id)
                ? 'Editar Comentário'
                : 'Adicionar Marcação'}
            </h3>
            <div className="modal-selected-text">
              <strong>Texto selecionado:</strong>
              <p>"{selectedMarking.text}"</p>
            </div>
            <textarea
              className="comment-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Digite seu comentário aqui..."
              rows={4}
            />
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => {
                  setShowCommentModal(false);
                  setCommentText('');
                  setSelectedMarking(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="modal-btn confirm"
                onClick={
                  markings.find((m) => m.id === selectedMarking.id)
                    ? handleUpdateComment
                    : handleAddMarking
                }
              >
                {markings.find((m) => m.id === selectedMarking.id) ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewer;