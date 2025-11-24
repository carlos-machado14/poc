import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
// Imports das extensões
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
// Imports de Banco de Dados e Helpers
import { getNote, saveNote, getFile, saveFile } from '../db';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
// Imports das extensões customizadas
import { TextoAmarelo, TextoVerde, NegritoCustom } from '../extensions/customStyles';
import { TextoNovo } from '../extensions/TextoNovo';
import { SublinhadoVermelho } from '../extensions/SublinhadoVermelho';
import { ParagraphWithClass } from '../extensions/paragraphWithClass';
import { BlocoQuestao } from '../extensions/BlocoQuestao';
import { FontSize } from '../extensions/fontSize';
import '../App.css';

// Componentes da UI
import { EditorToolbar, EditorSidebar } from './EditorUIComponents';

// Configurar o worker do pdfjs-dist
if (typeof window !== 'undefined') {
  // Usar o arquivo local copiado para a pasta public
  // O arquivo está em public/pdf.worker.min.js e será servido em /pdf.worker.min.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} 

const AUTOSAVE_DELAY = 1200;

interface EditorProps {
  onBack: () => void;
  fileId?: string;
}

// Helper para estilos de bloco
const updateParagraphClassCommand = (editor: ReturnType<typeof useEditor>, className?: string) => {
    if (!editor) return false;
    return editor.chain().focus().command(({ tr, state, dispatch }) => {
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let node = $from.node(depth);

        while (depth > 0 && node.type.name !== 'paragraph') {
            depth--;
            node = $from.node(depth);
        }

        if (node && node.type.name === 'paragraph') {
            const pos = $from.before(depth);
            const currentAttrs = { ...node.attrs };
            const classes = (currentAttrs.class || '').split(' ').filter((c: string) => c && !c.startsWith('bloco-'));
            
            if (className) classes.push(className);

            const newClassAttr = classes.length > 0 ? classes.join(' ') : null;

            if (newClassAttr !== currentAttrs.class) {
                 const newAttrs = { ...currentAttrs, class: newClassAttr };
                if (dispatch) tr.setNodeMarkup(pos, undefined, newAttrs);
                return true;
            }
        }
        return false;
    }).run();
};

const Editor: React.FC<EditorProps> = ({ onBack, fileId }) => {
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const lastContentRef = useRef<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false, 
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      ParagraphWithClass,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      Image.configure({ inline: true, allowBase64: true }),
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      BlocoQuestao, // <--- ADICIONE ISSO
      TextoAmarelo,
      TextoVerde,
      NegritoCustom,
      TextoNovo,
      SublinhadoVermelho,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html === lastContentRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        handleSave(html);
        saveTimerRef.current = null;
      }, AUTOSAVE_DELAY);
    },
    onBlur: ({ editor }) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      handleSave(editor.getHTML());
    },
  });

  useEffect(() => {
    const load = async () => {
      if (!editor) return;
      
      if (fileId) {
        // Carregar arquivo específico
        const file = await getFile(fileId);
        if (file) {
          editor.commands.setContent(file.content);
          lastContentRef.current = file.content;
          setFileName(file.name);
          if (file.updatedAt) setLastSaved(new Date(file.updatedAt));
        }
      } else {
        // Fallback: carregar nota antiga (compatibilidade)
        const note = await getNote();
        const content = note?.content || '';
        if (content) {
          editor.commands.setContent(content); 
          lastContentRef.current = content;
        }
        if (note?.updatedAt) setLastSaved(new Date(note.updatedAt));
      }
    };
    if (editor) load();
  }, [editor, fileId]);

  const handleSave = useCallback(async (content?: string) => {
    if (!editor) return;
    const currentContent = content || editor.getHTML();
    const previousContent = lastContentRef.current;
    if (currentContent === previousContent) return;

    const isEffectivelyEmpty = !currentContent.replace(/<p><\/p>/g, '').trim();
    if (isEffectivelyEmpty && currentContent === '<p></p>') return; 
    
    setIsSaving(true);
    try {
      if (fileId) {
        // Salvar arquivo específico
        const file = await getFile(fileId);
        if (file) {
          await saveFile({ ...file, content: currentContent });
          lastContentRef.current = currentContent;
          setLastSaved(new Date());
        }
      } else {
        // Fallback: salvar nota antiga (compatibilidade)
        await saveNote(currentContent);
        lastContentRef.current = currentContent;
        setLastSaved(new Date());
      }
    } finally {
      setIsSaving(false);
    }
  }, [editor, fileId]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && editor) handleSave();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [editor, handleSave]);
  
  // =========================================================================
  //                 LÓGICA DE IMPORTAÇÃO DO DOCX (CORRIGIDA)
  // =========================================================================

  const handleOpenDocx = useCallback(() => {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // 1. DEFINIÇÃO DO STYLE MAP
        // DICA: Abra o console do navegador após importar. Se o estilo não aparecer,
        // o console mostrará: "warning: Unrecognised paragraph style: 'Nome Real'"
        // Você deve copiar o 'Nome Real' e colar aqui no styleMap.
        
        const styleMap = [
            // --- BLOCOS (Parágrafos inteiros) ---
            // Mapeia "Caixa Verde Questão" do Word para <div class="bloco-questao">
            "p[style-name='Caixa Verde Questão'] => div.bloco-questao > p", 
            "p[style-name='Caixa Azul Jurisprudencia'] => div.bloco-jurisprudencia > p",
            "p[style-name='Citação'] => blockquote",
            
            // Mapeamento de Títulos Padrão
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",

            // --- INLINE (Parte do texto) ---
            
            // Cores/Destaques nativos do Word
            // Se o usuário usou o "Marca-texto Amarelo" do Word:
            "highlight => mark", 
            
            // Se o usuário criou um Estilo de Caractere (Character Style) no Word
            "r[style-name='Texto Amarelo'] => span.texto-amarelo",
            "r[style-name='Texto Verde'] => span.texto-verde",
            "r[style-name='Texto Novo'] => span.texto-novo", // Azul
            "r[style-name='Sublinhado Vermelho'] => span.sublinhado-vermelho",
            "r[style-name='Negrito Customizado'] => span.negrito-custom",

            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",

            "r[style-name='Highlight'] => mark", 


            // Mapeamentos Padrão de formatação
            "b => strong",
            "i => em",
            "u => u",
            "strike => s",
            "comment-reference => sup"
        ].join('\n');

        const options = {
          styleMap: styleMap,
          includeDefaultStyleMap: true,
          // Tenta converter formatação explícita (negrito/italico) mesmo sem estilo nomeado
          transformDocument: (element: any) => {
            return element;
          },
        }

        // 2. CONVERSÃO
        const result = await mammoth.convertToHtml(
            { arrayBuffer },
            options
        );
        console.log(">>> MENSAGENS DO MAMMOTH:", result.messages);
        console.log(">>> HTML GERADO:", result.value);

        // 3. DEBUG DE ESTILOS (IMPORTANTE)
        if (result.messages.length > 0) {
            console.group("⚠️ Avisos do Mammoth (DOCX Import)");
            result.messages.forEach(msg => {
                // Preste atenção nas mensagens "Unrecognised style"
                console.warn(msg.message);
            });
            console.log("DICA: Copie os nomes de estilo 'Unrecognised' acima e adicione ao styleMap no código.");
            console.groupEnd();
        }

        // 4. INSERÇÃO NO EDITOR
        console.log("HTML Gerado pelo Mammoth:", result.value); // Verifique se as classes estão aqui
        
        editor.commands.setContent(result.value); 
        lastContentRef.current = result.value;
        await handleSave(result.value);

      } catch (error) {
        alert('Erro ao importar DOCX. Verifique o console.');
        console.error(error);
      }
    };
    input.click();
  }, [editor, handleSave]);

  const handleOpenPdf = useCallback(() => {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Carregar o documento PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        const pageCount = pdf.numPages;
        
        // Extrair texto de cada página
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Concatenar o texto de cada item
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText;
          
          // Adicionar quebra de linha entre páginas (exceto na última)
          if (pageNum < pageCount) {
            fullText += '\n\n';
          }
        }
        
        // Converter o texto para HTML básico
        // Preservar quebras de linha e parágrafos
        const htmlContent = fullText
          .split('\n\n')
          .map(paragraph => {
            const trimmed = paragraph.trim();
            return trimmed ? `<p>${trimmed.replace(/\n/g, '<br>')}</p>` : '';
          })
          .filter(p => p)
          .join('');
        
        // Se não houver conteúdo, usar um parágrafo vazio
        const finalContent = htmlContent || '<p></p>';
        
        console.log('Texto extraído do PDF:', fullText);
        console.log('HTML gerado:', finalContent);
        
        // Inserir no editor
        editor.commands.setContent(finalContent);
        lastContentRef.current = finalContent;
        await handleSave(finalContent);
        
      } catch (error) {
        alert('Erro ao importar PDF. Verifique o console.');
        console.error('Erro ao processar PDF:', error);
      }
    };
    input.click();
  }, [editor, handleSave]);

  const handleInsertImage = useCallback((src: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: src }).run();
  }, [editor]);
  
  const handleBlockStyle = useCallback((className: string) => {
      return updateParagraphClassCommand(editor, className);
  }, [editor]);
  
  const handleInlineCommand = useCallback((commandName: string) => {
    if (!editor) return;
    switch (commandName) {
      case 'link':
        const currentLink = editor.getAttributes('link').href;
        const href = prompt('URL', currentLink || '');
        if (href === null || !href.trim()) {
             editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
             editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
        }
        break;
      case 'textoAmarelo':
      case 'textoVerde':
      case 'negritoCustom': 
      case 'textoNovo':
      case 'sublinhadoVermelho':
        editor.chain().focus().toggleMark(commandName).run();
        break;
      default:
        editor.chain().focus().toggleMark(commandName).run();
    }
  }, [editor]);

  const applyCustomInlineStyle = useCallback((markName: string) => {
    handleInlineCommand(markName); 
  }, [handleInlineCommand]);

  if (!editor) {
    return <div className="app-container">Carregando editor...</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="back-button" title="Voltar">← Voltar</button>
          <h1>📝 Editor de Texto{fileName && ` - ${fileName}`}</h1>
        </div>
        <div>
          {lastSaved && <span className="save-indicator">Salvo às {lastSaved.toLocaleTimeString()}</span>}
          {isSaving && <span className="save-indicator">Salvando...</span>}
        </div>
      </header>

      <div className="main-content">
        <div className="editor-wrapper">
          <EditorToolbar
            editor={editor}
            handleOpenDocx={handleOpenDocx}
            handleOpenPdf={handleOpenPdf}
            handleInsertImage={() => handleInsertImage('')}
            handleLink={() => handleInlineCommand('link')}
            handleInlineCommand={handleInlineCommand} 
          />
          <div>
            <EditorContent editor={editor} className="editor-content" />
          </div>
        </div>
        <EditorSidebar
            editor={editor}
            handleBlockStyle={handleBlockStyle}
            applyCustomInlineStyle={applyCustomInlineStyle}
        />
      </div>
    </div>
  );
};

export default Editor;