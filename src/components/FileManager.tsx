import React, { useState, useEffect, useMemo } from 'react';
import { getAllFiles, createFile, deleteFile, saveFile, File } from '../db';
import DashboardHeader from './DashboardHeader';
import Menu from './Menu';
import ApostilaCard, { ApostilaStatus } from './ApostilaCard';
import Pagination from './Pagination';
import FiltersButton from './FiltersButton';
import './FileManager.css';

interface FileManagerProps {
  onSelectFile: (fileId: string) => void;
  onBack: () => void;
  onNavigate?: (page: 'inicio' | 'gestao-apostilas' | 'atualizacoes') => void;
  menuCurrentPage?: 'inicio' | 'gestao-apostilas' | 'atualizacoes';
}

type GradientType = 'orange' | 'purple' | 'green' | 'blue';

const FileManager: React.FC<FileManagerProps> = ({ onSelectFile, onBack, onNavigate, menuCurrentPage = 'gestao-apostilas' }) => {
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
      <Menu
        currentPage={menuCurrentPage}
        onNavigate={onNavigate}
      />

      <div className="file-manager-main">
        <div className="file-manager-content">
          <div className="files-grid">
            {paginatedFiles.map((file) => (
              <ApostilaCard
                key={file.id}
                id={file.id}
                title={file.name}
                status={getFileStatus(file)}
                updatedAt={file.updatedAt}
                gradient={getGradient(files.indexOf(file))}
                onSelect={onSelectFile}
                onDelete={handleDeleteFile}
                onEdit={handleEditFile}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="file-manager-footer">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default FileManager;
