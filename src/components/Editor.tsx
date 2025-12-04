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
import Color from '@tiptap/extension-color';
import { TableRow } from '@tiptap/extension-table-row';
import { TableWithAttributes } from '../extensions/tableWithAttributes';
import { TableCellWithAttributes } from '../extensions/tableCellWithAttributes';
import { TableHeaderWithAttributes } from '../extensions/tableHeaderWithAttributes';
// Imports de Banco de Dados e Helpers
import { getNote, saveNote, getFile, saveFile } from '../db';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
// Import do serviço de conversão via API
import { convertDocxToHtml } from '../services/converterApi';
// Imports das extensões customizadas
import { TextoAmarelo, TextoVerde, NegritoCustom, Destaque1, Destaque2 } from '../extensions/customStyles';
import { TextoNovo } from '../extensions/TextoNovo';
import { SublinhadoVermelho } from '../extensions/SublinhadoVermelho';
import { ParagraphWithClass } from '../extensions/paragraphWithClass';
import { BlocoQuestao } from '../extensions/BlocoQuestao';
import { FontSize } from '../extensions/fontSize';
import { MarkBlue } from '../extensions/MarkBlue';
import { MarkYellow } from '../extensions/MarkYellow';
import { MarkGreen } from '../extensions/MarkGreen';
import { HeaderWithClass } from '../extensions/headerWithClass';
import { BackgroundColor } from '../extensions/backgroundColor';
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

// Mapeamento de classes do conversor-docx para classes do editor
const CONVERTER_CLASS_MAP: Record<string, string> = {
  'citacao': 'bloco-citacao',
  'jurisprudencia': 'bloco-jurisprudencia',
  'pontilhado-verde': 'bloco-pontilhado-verde',
  'mark-yellow': 'mark-yellow',
  'mark-blue': 'mark-blue',
};

// Função para normalizar classes do conversor-docx para classes do editor
const normalizeConverterClasses = (html: string): string => {
  let normalized = html;
  
  // Normalizar classes de parágrafos/blocos
  Object.entries(CONVERTER_CLASS_MAP).forEach(([converterClass, editorClass]) => {
    // Substituir class="citacao" por class="bloco-citacao" (mantendo outras classes)
    const regex = new RegExp(`(class="[^"]*\\b)${converterClass}(\\b[^"]*")`, 'gi');
    normalized = normalized.replace(regex, (match, before, after) => {
      // Se já tem a classe do editor, não adiciona duplicada
      if (match.includes(editorClass)) {
        return match.replace(new RegExp(`\\b${converterClass}\\b`, 'gi'), '');
      }
      return `${before}${editorClass}${after}`;
    });
    
    // Caso especial: class="citacao" sem outras classes
    normalized = normalized.replace(
      new RegExp(`class="${converterClass}"`, 'gi'),
      `class="${editorClass}"`
    );
  });
  
  return normalized;
};

// Função para normalizar atributo align para style text-align
const normalizeAlignAttribute = (html: string): string => {
  // Converte align="right" para style="text-align: right" (preservando outros estilos)
  return html.replace(
    /<(\w+)([^>]*?)\s+align=["'](left|center|right|justify)["']([^>]*)>/gi,
    (match, tag, before, align, after) => {
      const allAttrs = (before + after).trim();
      // Verifica se já tem style
      const styleMatch = allAttrs.match(/style=["']([^"']*)["']/i);
      if (styleMatch) {
        // Adiciona text-align ao style existente
        const existingStyle = styleMatch[1];
        // Remove text-align existente se houver
        const cleanedStyle = existingStyle.replace(/text-align:\s*[^;]+;?/gi, '').trim();
        // Adiciona o novo text-align
        const finalStyle = cleanedStyle 
          ? `${cleanedStyle}; text-align: ${align}`.replace(/^;\s*|;\s*$/g, '')
          : `text-align: ${align}`;
        // Remove o atributo align e atualiza o style
        const newAttrs = allAttrs
          .replace(/style=["'][^"']*["']/i, `style="${finalStyle}"`)
          .replace(/\s+align=["'][^"']*["']/gi, '');
        return `<${tag}${newAttrs ? ' ' + newAttrs : ''}>`;
      } else {
        // Adiciona style novo e remove o atributo align
        const newAttrs = allAttrs.replace(/\s+align=["'][^"']*["']/gi, '').trim();
        return `<${tag}${newAttrs ? ' ' + newAttrs + ' ' : ' '}style="text-align: ${align}">`;
      }
    }
  );
};

// Função para normalizar todas as tags <font> para <span> com estilos apropriados
const normalizeFontColor = (html: string): string => {
  let normalized = html;
  
  // Mapeamento de tamanhos de fonte (size="1" a size="7" para pt)
  const fontSizeMap: Record<string, string> = {
    '1': '8pt',
    '2': '10pt',
    '3': '12pt',
    '4': '14pt',
    '5': '18pt',
    '6': '24pt',
    '7': '36pt',
  };
  
  // Processa todas as tags <font> e converte para <span>
  normalized = normalized.replace(
    /<font([^>]*?)>/gi,
    (match, attrs) => {
      const styles: string[] = [];
      let remainingAttrs = attrs;
      
      // Extrai e processa atributo color
      const colorMatch = attrs.match(/color=["']([^"']+)["']/i);
      if (colorMatch) {
        const color = colorMatch[1];
        const normalizedColor = color.startsWith('#') ? color : `#${color}`;
        styles.push(`color: ${normalizedColor}`);
        remainingAttrs = remainingAttrs.replace(/color=["'][^"']+["']/gi, '').trim();
      }
      
      // Extrai e processa atributo face (font-family)
      const faceMatch = attrs.match(/face=["']([^"']+)["']/i);
      if (faceMatch) {
        const fontFamily = faceMatch[1];
        styles.push(`font-family: ${fontFamily}`);
        remainingAttrs = remainingAttrs.replace(/face=["'][^"']+["']/gi, '').trim();
      }
      
      // Extrai e processa atributo size
      const sizeMatch = attrs.match(/size=["']([^"']+)["']/i);
      if (sizeMatch) {
        const size = sizeMatch[1];
        const fontSize = fontSizeMap[size] || `${size}pt`;
        styles.push(`font-size: ${fontSize}`);
        remainingAttrs = remainingAttrs.replace(/size=["'][^"']+["']/gi, '').trim();
      }
      
      // Extrai style existente se houver
      const styleMatch = attrs.match(/style=["']([^"']*)["']/i);
      if (styleMatch) {
        const existingStyle = styleMatch[1];
        // Remove propriedades que já foram processadas dos atributos
        const cleanedStyle = existingStyle
          .replace(/color:\s*[^;]+;?/gi, '')
          .replace(/font-family:\s*[^;]+;?/gi, '')
          .replace(/font-size:\s*[^;]+;?/gi, '')
          .trim();
        if (cleanedStyle) {
          styles.push(cleanedStyle);
        }
        remainingAttrs = remainingAttrs.replace(/style=["'][^"']*["']/gi, '').trim();
      }
      
      // Combina todos os estilos
      const finalStyle = styles.length > 0 ? styles.join('; ') : null;
      
      // Remove espaços extras e constrói o novo atributo
      remainingAttrs = remainingAttrs.replace(/\s+/g, ' ').trim();
      
      // Constrói a tag <span> com os atributos restantes e o style
      let spanAttrs = remainingAttrs;
      if (finalStyle) {
        if (spanAttrs) {
          spanAttrs = `${spanAttrs} style="${finalStyle}"`;
        } else {
          spanAttrs = `style="${finalStyle}"`;
        }
      }
      
      return `<span${spanAttrs ? ' ' + spanAttrs : ''}>`;
    }
  );
  
  // Converte todas as tags </font> para </span>
  normalized = normalized.replace(/<\/font>/gi, '</span>');
  
  return normalized;
};

// Helper para estilos de bloco (suporta parágrafos e headings)
const updateParagraphClassCommand = (editor: ReturnType<typeof useEditor>, className?: string) => {
    if (!editor) return false;
    return editor.chain().focus().command(({ tr, state, dispatch }) => {
        const { selection } = state;
        const { $from } = selection;
        let depth = $from.depth;
        let node = $from.node(depth);

        // Procura por paragraph ou heading
        while (depth > 0 && node.type.name !== 'paragraph' && node.type.name !== 'heading') {
            depth--;
            node = $from.node(depth);
        }

        // Suporta tanto paragraph quanto heading
        if (node && (node.type.name === 'paragraph' || node.type.name === 'heading')) {
            const pos = $from.before(depth);
            const currentAttrs = { ...node.attrs };
            // Remove apenas os estilos de bloco específicos, mantendo outras classes
            // Inclui classes do conversor-docx e do editor
            const blockStyleClasses = [
              'bloco-pontilhado-verde', 'bloco-citacao', 'bloco-jurisprudencia', 
              'bloco-atualizacao', 'bloco-questao', 'jurisprudencia', 'citacao', 'bloco-neutro',
              'citacao', 'jurisprudencia', 'pontilhado-verde', 'box-highlight', 'mark-yellow'
            ];
            const classes = (currentAttrs.class || '').split(' ').filter((c: string) => c && !blockStyleClasses.includes(c));
            
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
      HeaderWithClass,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
      Image.configure({ inline: true, allowBase64: true }),
      TextStyle,
      FontFamily.configure({ types: ['textStyle'] }),
      Color.configure({ types: ['textStyle'] }),
      FontSize,
      BackgroundColor,
      BlocoQuestao,
      TextoAmarelo,
      TextoVerde,
      NegritoCustom,
      TextoNovo,
      SublinhadoVermelho,
      Destaque1,
      Destaque2,
      MarkBlue,
      MarkYellow,
      MarkGreen,
      TableWithAttributes.configure({
        resizable: true,
      }),
      TableRow,
      TableHeaderWithAttributes,
      TableCellWithAttributes,
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
          // Aplicar normalizações apenas se necessário (conteúdo importado)
          // Se o conteúdo já foi salvo pelo editor, não precisa normalizar
          let contentToLoad = file.content;
          
          // Normalizar classes do conversor-docx (apenas se houver classes do conversor)
          if (contentToLoad.includes('class="citacao"') || 
              contentToLoad.includes('class="jurisprudencia"') || 
              contentToLoad.includes('class="pontilhado-verde"')) {
            contentToLoad = normalizeConverterClasses(contentToLoad);
          }
          
          // Normalizar atributo align apenas se existir (conteúdo importado)
          if (contentToLoad.includes('align="')) {
            contentToLoad = normalizeAlignAttribute(contentToLoad);
          }
          
          editor.commands.setContent(contentToLoad);
          lastContentRef.current = contentToLoad;
          setFileName(file.name);
          if (file.updatedAt) setLastSaved(new Date(file.updatedAt));
        }
      } else {
        // Fallback: carregar nota antiga (compatibilidade)
        const note = await getNote();
        const content = note?.content || '';
        if (content) {
          // Aplicar normalizações apenas se necessário
          let contentToLoad = content;
          
          // Normalizar classes do conversor-docx (apenas se houver classes do conversor)
          if (contentToLoad.includes('class="citacao"') || 
              contentToLoad.includes('class="jurisprudencia"') || 
              contentToLoad.includes('class="pontilhado-verde"')) {
            contentToLoad = normalizeConverterClasses(contentToLoad);
          }
          
          // Normalizar atributo align apenas se existir (conteúdo importado)
          if (contentToLoad.includes('align="')) {
            contentToLoad = normalizeAlignAttribute(contentToLoad);
          }
          
          editor.commands.setContent(contentToLoad); 
          lastContentRef.current = contentToLoad;
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

        // 4. NORMALIZAÇÃO E INSERÇÃO NO EDITOR
        console.log("HTML Gerado pelo Mammoth:", result.value); // Verifique se as classes estão aqui
        
        // Normalizar classes do conversor-docx (caso o arquivo tenha sido processado pelo conversor)
        let normalizedContent = normalizeConverterClasses(result.value);
        // Normalizar atributo align para style text-align
        normalizedContent = normalizeAlignAttribute(normalizedContent);
        // Normalizar tags <font color> para <span style="color: ...">
        normalizedContent = normalizeFontColor(normalizedContent);
        
        editor.commands.setContent(normalizedContent); 
        lastContentRef.current = normalizedContent;
        await handleSave(normalizedContent);

      } catch (error) {
        alert('Erro ao importar DOCX. Verifique o console.');
        console.error(error);
      }
    };
    input.click();
  }, [editor, handleSave]);

  // =========================================================================
  //                 LÓGICA DE IMPORTAÇÃO DO DOCX VIA API
  // =========================================================================

  const handleOpenDocxViaApi = useCallback(() => {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // Mostrar indicador de carregamento
        const loadingMessage = 'Convertendo arquivo DOCX via API...';
        console.log(loadingMessage);
        
        // Converter usando a API convert-docx-html
        const result = await convertDocxToHtml(file);
        
        if (!result.success || !result.html) {
          alert(result.error || 'Erro ao converter arquivo DOCX');
          console.error('Erro na conversão:', result.error);
          return;
        }

        console.log('HTML convertido pela API:', result.html);
        
        // Normalizar classes do conversor-docx
        let normalizedContent = normalizeConverterClasses(result.html);
        // Normalizar atributo align para style text-align
        normalizedContent = normalizeAlignAttribute(normalizedContent);
        // Normalizar tags <font color> para <span style="color: ...">
        normalizedContent = normalizeFontColor(normalizedContent);
        
        // Inserir no editor
        editor.commands.setContent(normalizedContent);
        lastContentRef.current = normalizedContent;
        await handleSave(normalizedContent);
        
        console.log('Arquivo DOCX convertido e carregado com sucesso!');
      } catch (error) {
        alert('Erro ao importar DOCX via API. Verifique o console e a configuração da API.');
        console.error('Erro ao processar DOCX via API:', error);
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
      case 'jurisprudencia':
      case 'citacao':
      case 'pontilhado-verde':
      case 'textoVerde':
      case 'negritoCustom': 
      case 'textoNovo':
      case 'sublinhadoVermelho':
      case 'markBlue':
      case 'markYellow':
      case 'markGreen':
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
        <div className="header-left">
          <button 
            className="header-btn back-btn" 
            onClick={onBack}
            title="Voltar"
            style={{ marginRight: '1rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Voltar
          </button>
          <div className="document-title-section">
            <h1 className="document-title">{fileName || 'Trabalho - Estabilidade e Garantia'}</h1>
            <span className="document-tag">Apostila</span>
          </div>
        </div>
        <div className="header-right">
          <button className="header-btn properties-btn" title="Propriedades">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Propriedades
          </button>
          <button className="header-btn publish-btn" title="Publicar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2v12M3 7l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Publicar
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="editor-wrapper">
          <EditorToolbar
            editor={editor}
            handleOpenDocx={handleOpenDocx}
            handleOpenDocxViaApi={handleOpenDocxViaApi}
            handleOpenPdf={handleOpenPdf}
            handleInsertImage={() => handleInsertImage('')}
            handleLink={() => handleInlineCommand('link')}
            handleInlineCommand={handleInlineCommand} 
          />
          <div className="editor-content-wrapper">
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