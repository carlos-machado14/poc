import React, { useState } from 'react';
import Home from './components/Home';
import Editor from './components/Editor';
import Viewer from './components/Viewer';
import FileManager from './components/FileManager';
import './App.css';

type View = 'home' | 'fileManager' | 'editor' | 'viewer';
type Mode = 'editor' | 'viewer' | null;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<Mode>(null);

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
    setSelectedFileId(undefined);
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
