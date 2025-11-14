// App.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getNote, saveNote } from './db';
import './App.css';

const AUTOSAVE_DELAY = 1200; // ms

const App: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const lastContentRef = useRef<string>('');

  const getEditorContent = () => editorRef.current?.innerHTML || '';

  // -----------------------------
  // Carregar nota ao iniciar
  // -----------------------------
  useEffect(() => {
    const load = async () => {
      const note = await getNote();
      const content = note?.content || '';

      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }

      lastContentRef.current = content;

      if (note?.updatedAt) {
        setLastSaved(new Date(note.updatedAt));
      }

      setIsLoading(false);
    };

    load();
  }, []);

  // -----------------------------
  // Função de salvar
  // -----------------------------
  const handleSave = useCallback(async () => {
    const currentContent = getEditorContent();
    const previousContent = lastContentRef.current;

    // evita salvar sem necessidade
    if (currentContent === previousContent) return;

    setIsSaving(true);
    try {
      await saveNote(currentContent);
      lastContentRef.current = currentContent;
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, []);

  // -----------------------------
  // Autosave ao digitar
  // -----------------------------
  const handleInput = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      handleSave();
      saveTimerRef.current = null;
    }, AUTOSAVE_DELAY);
  };

  // -----------------------------
  // Salvar ao perder foco
  // -----------------------------
  const handleBlur = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    handleSave();
  };

  // -----------------------------
  // Salvar ao esconder aba/janela
  // (bom pra PWA / mobile / offline)
  // -----------------------------
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        handleSave();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [handleSave]);

  // -----------------------------
  // Formatação simples (execCommand)
  // -----------------------------
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleBackColor = () => {
    const color = prompt('Digite a cor de fundo (ex: #ffff00, yellow):');
    if (color) exec('backColor', color);
  };

  const handleBorder = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement('span');
    span.style.border = '1px solid #000';
    span.style.display = 'inline-block';
    span.style.padding = '2px';

    span.appendChild(range.extractContents());
    range.insertNode(span);
    editorRef.current?.focus();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📝 Editor de Texto</h1>

        {lastSaved && (
          <span className="save-indicator">
            Salvo às {lastSaved.toLocaleTimeString()}
          </span>
        )}

        {isSaving && <span className="save-indicator">Salvando...</span>}
        {isLoading && <span className="save-indicator">Carregando...</span>}
      </header>

      <div className="toolbar">
        <button className="toolbar-btn" onClick={() => exec('bold')} title="Negrito (Ctrl+B)">
          <strong>N</strong>
        </button>

        <button className="toolbar-btn" onClick={() => exec('underline')} title="Sublinhado (Ctrl+U)">
          <u>S</u>
        </button>

        <button className="toolbar-btn" onClick={handleBackColor} title="Fundo do texto">
          🖍️
        </button>

        <button className="toolbar-btn" onClick={handleBorder} title="Borda">
          ▦
        </button>
      </div>

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        data-placeholder="Digite seu texto aqui..."
      />

      {isLoading && (
        <div className="loading-overlay">
          Carregando...
        </div>
      )}
    </div>
  );
};

export default App;
