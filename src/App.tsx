import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Editor from './components/Editor';
import Viewer from './components/Viewer';
import FileManager from './components/FileManager';
import './App.css';

type View = 'home' | 'fileManager' | 'editor' | 'viewer';
type Mode = 'editor' | 'viewer' | null;

const STORAGE_KEY = 'app_state';

const App: React.FC = () => {
  // Carregar estado do localStorage na inicialização
  const loadState = (): { view: View; fileId?: string; mode: Mode } => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          view: parsed.view || 'home',
          fileId: parsed.fileId,
          mode: parsed.mode || null,
        };
      }
    } catch (e) {
      console.error('Error loading state:', e);
    }
    return { view: 'home', mode: null };
  };

  const savedState = loadState();
  const [currentView, setCurrentView] = useState<View>(savedState.view);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(savedState.fileId);
  const [mode, setMode] = useState<Mode>(savedState.mode);

  // Salvar estado no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        view: currentView,
        fileId: selectedFileId,
        mode: mode,
      }));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [currentView, selectedFileId, mode]);

  const handleSelectEditor = () => {
    setMode('editor');
    setCurrentView('fileManager');
  };

  const handleSelectViewer = () => {
    setMode('viewer');
    setCurrentView('fileManager');
  };

  const handleBack = () => {
    setCurrentView('home');
    setSelectedFileId(undefined);
    setMode(null);
  };

  const handleBackToFileManager = () => {
    setCurrentView('fileManager');
    // Não limpar o fileId para manter o contexto, apenas voltar para o fileManager
    // setSelectedFileId(undefined);
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    // Ir para editor ou viewer baseado no modo
    if (mode === 'editor') {
      setCurrentView('editor');
    } else if (mode === 'viewer') {
      setCurrentView('viewer');
    }
  };

  return (
    <>
      {currentView === 'home' && (
        <Home
          onSelectEditor={handleSelectEditor}
          onSelectViewer={handleSelectViewer}
        />
      )}
      {currentView === 'fileManager' && (
        <FileManager
          onSelectFile={handleSelectFile}
          onBack={handleBack}
        />
      )}
      {currentView === 'editor' && (
        <Editor
          onBack={handleBackToFileManager}
          fileId={selectedFileId}
        />
      )}
      {currentView === 'viewer' && (
        <Viewer
          onBack={handleBackToFileManager}
          fileId={selectedFileId}
        />
      )}
    </>
  );
};

export default App;
