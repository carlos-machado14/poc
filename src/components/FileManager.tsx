import React, { useState, useEffect, useMemo } from 'react';
import { getAllFiles, createFile, deleteFile, saveFile, File } from '../db';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import ApostilaCard, { ApostilaStatus } from './ApostilaCard';
import Pagination from './Pagination';
import FiltersButton from './FiltersButton';
import './FileManager.css';

interface FileManagerProps {
  onSelectFile: (fileId: string) => void;
  onBack: () => void;
}

type GradientType = 'orange' | 'purple' | 'green' | 'blue';

const FileManager: React.FC<FileManagerProps> = ({ onSelectFile, onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersActive, setFiltersActive] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const allFiles = await getAllFiles();
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
      onSelectFile(file.id);
    } catch (error) {
      console.error('Erro ao criar arquivo:', error);
      alert('Erro ao criar arquivo');
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta apostila?')) {
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

  const handleEditFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      const newName = prompt('Digite o novo nome:', file.name);
      if (newName && newName.trim()) {
        const updatedFile = { ...file, name: newName.trim() };
        saveFile(updatedFile).then(() => {
          setFiles(prev => prev.map(f => f.id === id ? updatedFile : f));
        }).catch(error => {
          console.error('Erro ao renomear arquivo:', error);
          alert('Erro ao renomear arquivo');
        });
      }
    }
  };

  // Função para determinar status baseado no conteúdo/nome do arquivo
  const getFileStatus = (file: File): ApostilaStatus[] => {
    const statuses: ApostilaStatus[] = [];
    const name = file.name.toLowerCase();
    const content = file.content.toLowerCase();

    // Lógica para determinar status (pode ser melhorada)
    if (name.includes('material') || name.includes('apoio')) {
      statuses.push('Material de apoio');
    } else if (name.includes('plano') || name.includes('estudo')) {
      statuses.push('Plano de estudo');
    } else {
      statuses.push('Apostila');
    }

    // Adicionar status de publicação baseado em conteúdo
    if (content.length > 100) {
      statuses.push('Publicado');
    } else {
      statuses.push('Rascunho');
    }

    return statuses;
  };

  // Função para determinar gradiente baseado no índice
  const getGradient = (index: number): GradientType => {
    const gradients: GradientType[] = ['orange', 'purple', 'green', 'blue'];
    return gradients[index % gradients.length];
  };

  // Filtrar arquivos baseado na busca
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }
    const query = searchQuery.toLowerCase();
    return files.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.content.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  // Paginação
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFiles, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (isLoading) {
    return (
      <div className="file-manager-container">
        <div className="file-manager-loading">Carregando apostilas...</div>
      </div>
    );
  }

  return (
    <div className="file-manager-container">
      <DashboardSidebar
        currentPage="gestao-apostilas"
        isCollapsed={sidebarCollapsed}
      />
      <div className="file-manager-main">
        <DashboardHeader
          userName="Natalia"
          onSearch={setSearchQuery}
          onLogout={onBack}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className="file-manager-content">
          <div className="content-header">
            <h1 className="content-title">Gestão de apostilas</h1>
            <div className="content-actions">
              <FiltersButton
                active={filtersActive}
                onClick={() => setFiltersActive(!filtersActive)}
              />
              <button
                className="create-file-button"
                onClick={() => setShowCreateModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>+ Novo</span>
              </button>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h2>Nenhuma apostila encontrada</h2>
              <p>Crie sua primeira apostila para começar</p>
              <button
                className="create-file-button"
                onClick={() => setShowCreateModal(true)}
              >
                + Criar Primeira Apostila
              </button>
            </div>
          ) : (
            <>
              <div className="files-grid">
                {paginatedFiles.map((file, index) => {
                  const globalIndex = files.findIndex(f => f.id === file.id);
                  return (
                    <ApostilaCard
                      key={file.id}
                      id={file.id}
                      title={file.name}
                      status={getFileStatus(file)}
                      updatedAt={file.updatedAt}
                      gradient={getGradient(globalIndex)}
                      onSelect={onSelectFile}
                      onDelete={handleDeleteFile}
                      onEdit={handleEditFile}
                    />
                  );
                })}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Criar Nova Apostila</h2>
            <input
              type="text"
              placeholder="Nome da apostila"
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
