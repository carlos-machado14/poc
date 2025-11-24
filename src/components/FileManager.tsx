import React, { useState, useEffect } from 'react';
import { getAllFiles, createFile, deleteFile, saveFile, File } from '../db';
import './FileManager.css';

interface FileManagerProps {
  onSelectFile: (fileId: string) => void;
  onBack: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({ onSelectFile, onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const allFiles = await getAllFiles();
      // Ordenar por data de atualização (mais recentes primeiro)
      allFiles.sort((a, b) => b.updatedAt - a.updatedAt);
      setFiles(allFiles);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      alert('Por favor, insira um nome para o arquivo');
      return;
    }

    try {
      const file = await createFile(newFileName.trim());
      setFiles(prev => [file, ...prev]);
      setShowCreateModal(false);
      setNewFileName('');
      // Abrir o arquivo recém-criado
      onSelectFile(file.id);
    } catch (error) {
      console.error('Erro ao criar arquivo:', error);
      alert('Erro ao criar arquivo');
    }
  };

  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Tem certeza que deseja excluir este arquivo?')) {
      return;
    }

    try {
      await deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      alert('Erro ao excluir arquivo');
    }
  };

  const handleStartEdit = (file: File, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setEditingFileName(file.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingFileName.trim()) {
      alert('O nome do arquivo não pode estar vazio');
      return;
    }

    try {
      const file = files.find(f => f.id === id);
      if (!file) return;

      const updatedFile = { ...file, name: editingFileName.trim() };
      await saveFile(updatedFile);
      setFiles(prev => prev.map(f => f.id === id ? updatedFile : f));
      setEditingFileId(null);
      setEditingFileName('');
    } catch (error) {
      console.error('Erro ao renomear arquivo:', error);
      alert('Erro ao renomear arquivo');
    }
  };

  const handleCancelEdit = () => {
    setEditingFileId(null);
    setEditingFileName('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreview = (content: string) => {
    // Remover tags HTML e pegar primeiros 100 caracteres
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text || 'Documento vazio';
  };

  if (isLoading) {
    return (
      <div className="file-manager-container">
        <div className="file-manager-loading">Carregando arquivos...</div>
      </div>
    );
  }

  return (
    <div className="file-manager-container">
      <header className="file-manager-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="back-button" title="Voltar">← Voltar</button>
          <h1>📁 Gerenciador de Arquivos</h1>
        </div>
        <button 
          className="create-file-button"
          onClick={() => setShowCreateModal(true)}
        >
          + Novo Arquivo
        </button>
      </header>

      <div className="file-manager-content">
        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h2>Nenhum arquivo encontrado</h2>
            <p>Crie seu primeiro arquivo para começar</p>
            <button 
              className="create-file-button"
              onClick={() => setShowCreateModal(true)}
            >
              + Criar Primeiro Arquivo
            </button>
          </div>
        ) : (
          <div className="files-grid">
            {files.map(file => (
              <div
                key={file.id}
                className="file-card"
                onClick={() => onSelectFile(file.id)}
              >
                <div className="file-card-header">
                  {editingFileId === file.id ? (
                    <div className="file-edit-form">
                      <input
                        type="text"
                        value={editingFileName}
                        onChange={(e) => setEditingFileName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(file.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className="file-edit-input"
                        autoFocus
                      />
                      <div className="file-edit-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(file.id);
                          }}
                          className="file-edit-save"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="file-edit-cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="file-name">{file.name}</h3>
                      <div className="file-actions">
                        <button
                          onClick={(e) => handleStartEdit(file, e)}
                          className="file-action-btn"
                          title="Renomear"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteFile(file.id, e)}
                          className="file-action-btn file-delete-btn"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <p className="file-preview">{getPreview(file.content)}</p>
                <div className="file-meta">
                  <span className="file-date">
                    Atualizado: {formatDate(file.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Criar Novo Arquivo</h2>
            <input
              type="text"
              placeholder="Nome do arquivo"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setShowCreateModal(false);
                  setNewFileName('');
                }
              }}
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={handleCreateFile}
                className="modal-btn modal-btn-primary"
              >
                Criar
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewFileName('');
                }}
                className="modal-btn modal-btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;

