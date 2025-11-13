import React, { useState, useEffect, useRef } from 'react';
import { getNote, saveNote, verifyIndexedDB } from './db';
import './App.css';

const App: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load note on mount
  useEffect(() => {
    const loadNote = async () => {
      try {
        console.log('=== Loading note ===');
        // Verify IndexedDB first
        await verifyIndexedDB();
        
        const note = await getNote();
        if (note && editorRef.current) {
          console.log('✅ Note found, loading content:', note.content.substring(0, 50));
          editorRef.current.innerHTML = note.content;
          setLastSaved(new Date(note.updatedAt));
        } else {
          console.log('ℹ️ No note found, starting with empty editor');
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
        }
      } catch (error) {
        console.error('❌ Error loading note:', error);
        // Even if there's an error, show the editor
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadNote();
  }, []);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveContent = async () => {
    try {
      const content = editorRef.current?.innerHTML || '';
      // Save even if empty (to clear the field)
      console.log('=== Saving content ===');
      console.log('Content length:', content.length);
      await saveNote(content);
      setLastSaved(new Date());
      console.log('✅ Conteúdo salvo com sucesso');
      
      // Verify it was saved
      setTimeout(async () => {
        await verifyIndexedDB();
      }, 500);
    } catch (error) {
      console.error('❌ Error saving note:', error);
      // Show error to user somehow? Or just log it
    }
  };

  const handleInput = () => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveContent();
    }, 1000); // Save after 1 second of inactivity
  };

  // Save on blur (when user clicks outside)
  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveContent();
  };

  // Save before page unload (refresh, close tab, etc)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Force immediate save
      const content = editorRef.current?.innerHTML || '';
      if (content.trim() || content.includes('<')) {
        // Try to save synchronously using a blocking approach
        const savePromise = saveNote(content);
        // Note: This won't block, but we try our best
        // The page might close before it completes, but we try
        savePromise.catch(console.error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden, save immediately
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveContent();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleBold = () => formatText('bold');
  const handleUnderline = () => formatText('underline');
  const handleBackColor = () => {
    const color = prompt('Digite a cor de fundo (ex: #ffff00, yellow, rgb(255,255,0)):');
    if (color) {
      formatText('backColor', color);
    }
  };
  const handleBorder = () => {
    const color = prompt('Digite a cor da borda (ex: #000000, black, rgb(0,0,0)):');
    const width = prompt('Digite a largura da borda (ex: 2px):', '2px');
    if (color && width) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          // There's a selection
          const selectedContent = range.extractContents();
          const span = document.createElement('span');
          span.style.border = `${width} solid ${color}`;
          span.style.display = 'inline-block';
          span.appendChild(selectedContent);
          range.insertNode(span);
        } else {
          // No selection, apply to current element or create span
          const span = document.createElement('span');
          span.style.border = `${width} solid ${color}`;
          span.style.display = 'inline-block';
          span.textContent = ' ';
          range.insertNode(span);
          range.setStartAfter(span);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      editorRef.current?.focus();
    }
  };

  if (isLoading) {
    return <div className="app-container">Carregando...</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📝 Editor de Texto</h1>
        {lastSaved && (
          <span className="save-indicator">
            Salvo em {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </header>
      
      <div className="toolbar">
        <button 
          className="toolbar-btn" 
          onClick={handleBold}
          title="Negrito (Ctrl+B)"
        >
          <strong>N</strong>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleUnderline}
          title="Sublinhado (Ctrl+U)"
        >
          <u>S</u>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleBackColor}
          title="Fundo de Texto"
        >
          <span className="toolbar-icon">🖍️</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleBorder}
          title="Borda"
        >
          <span className="toolbar-icon">▦</span>
        </button>
      </div>

      <div 
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        onBlur={handleBlur}
        suppressContentEditableWarning={true}
        data-placeholder="Digite seu texto aqui..."
      />
    </div>
  );
};

export default App;
