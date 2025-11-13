import React, { useState, useEffect, useRef } from 'react';
import { getNote, saveNote, verifyIndexedDB } from './db';
import './App.css';

const App: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isLoadingRef = useRef<boolean>(false); // Flag to prevent save during load
  const lastSavedContentRef = useRef<string>(''); // Track last saved content to avoid unnecessary saves
  const isSavingRef = useRef<boolean>(false); // Flag to prevent concurrent saves

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Load note on mount - only run once
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount
    
    const loadNote = async () => {
      try {
        isLoadingRef.current = true; // Prevent saves during loading
        console.log('=== Loading note ===');
        
        // Don't verify IndexedDB on load - it can cause issues
        // Just load the note directly
        const note = await getNote();
        console.log('Note result:', note ? 'Found' : 'Not found');
        
        if (!isMounted) return; // Component unmounted, don't continue
        
        // Wait a bit to ensure editor is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted) return; // Check again after delay
        
        if (note && editorRef.current) {
          const content = note.content || '';
          console.log('✅ Note found, loading content. Length:', content.length);
          console.log('📝 Content preview (first 100 chars):', content.substring(0, 100));
          
          // Set content while loading flag is active (prevents save trigger)
          editorRef.current.innerHTML = content;
          
          // Verify content was set
          const actualContent = editorRef.current.innerHTML;
          console.log('🔍 Content verification:', {
            expectedLength: content.length,
            actualLength: actualContent.length,
            matches: actualContent === content || actualContent.includes(content.substring(0, 50))
          });
          
          if (!isMounted) return;
          
          setLastSaved(new Date(note.updatedAt));
          lastSavedContentRef.current = content; // Set initial saved content
          
          // Allow saves after a short delay to ensure content is set
          setTimeout(() => {
            if (isMounted) {
              isLoadingRef.current = false;
              console.log('✅ Loading complete, saves enabled');
            }
          }, 500);
        } else {
          console.log('ℹ️ No note found, starting with empty editor');
          if (editorRef.current && isMounted) {
            editorRef.current.innerHTML = '';
          }
          isLoadingRef.current = false; // Allow saves
        }
      } catch (error) {
        console.error('❌ Error loading note:', error);
        // Even if there's an error, show the editor
        if (editorRef.current && isMounted) {
          editorRef.current.innerHTML = '';
        }
        isLoadingRef.current = false; // Allow saves even on error
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadNote();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveContent = async () => {
    // Don't save if we're still loading
    if (isLoadingRef.current) {
      console.log('Skipping save - still loading');
      return;
    }
    
    // Don't save if already saving
    if (isSavingRef.current) {
      console.log('Skipping save - already saving');
      return;
    }
    
    try {
      const content = editorRef.current?.innerHTML || '';
      
      // Don't save if content hasn't changed
      if (content === lastSavedContentRef.current) {
        console.log('Skipping save - content unchanged');
        return;
      }
      
      // Mark as saving
      isSavingRef.current = true;
      
      // Save even if empty (to clear the field)
      await saveNote(content);
      lastSavedContentRef.current = content; // Update last saved content
      setLastSaved(new Date());
      
      // Don't verify immediately to avoid performance issues
      // Verification can be done manually if needed
    } catch (error) {
      console.error('❌ Error saving note:', error);
      // Show error to user somehow? Or just log it
    } finally {
      // Always clear the saving flag
      isSavingRef.current = false;
    }
  };

  const handleInput = () => {
    // Don't save if we're still loading
    if (isLoadingRef.current) {
      return;
    }
    
    // Don't save if already saving
    if (isSavingRef.current) {
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveContent();
      saveTimeoutRef.current = null;
    }, 2000); // Increased to 2 seconds to reduce frequency
  };

  // Save on blur (when user clicks outside)
  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    // Only save if not already saving
    if (!isSavingRef.current && !isLoadingRef.current) {
      saveContent();
    }
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
          saveTimeoutRef.current = null;
        }
        // Only save if not already saving and not loading
        if (!isSavingRef.current && !isLoadingRef.current) {
          saveContent();
        }
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
