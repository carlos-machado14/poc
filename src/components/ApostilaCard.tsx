import React, { useState } from 'react';
import './ApostilaCard.css';

export type ApostilaStatus = 'Material de apoio' | 'Rascunho' | 'Plano de estudo' | 'Apostila' | 'Publicado';

export interface ApostilaCardProps {
  id: string;
  title: string;
  status: ApostilaStatus[];
  updatedAt: number;
  readerLink?: string;
  gradient?: 'orange' | 'purple' | 'green' | 'blue';
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const ApostilaCard: React.FC<ApostilaCardProps> = ({
  id,
  title,
  status,
  updatedAt,
  readerLink,
  gradient = 'orange',
  onSelect,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: ApostilaStatus): string => {
    const colors: Record<ApostilaStatus, string> = {
      'Material de apoio': 'orange',
      'Rascunho': 'gray',
      'Plano de estudo': 'blue',
      'Apostila': 'blue',
      'Publicado': 'green',
    };
    return colors[status] || 'gray';
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
    setShowMenu(false);
  };

  return (
    <div className={`apostila-card gradient-${gradient}`} onClick={handleCardClick}>
      <div className="card-header">
        <div className="card-book-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="6" width="24" height="28" fill="#1e40af" rx="2"/>
            <rect x="8" y="6" width="12" height="28" fill="#4CAF50" rx="2"/>
          </svg>
        </div>
        <button className="card-menu-button" onClick={handleMenuClick}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        {showMenu && (
          <div className="card-menu-dropdown" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button className="menu-item" onClick={handleEdit}>
                Editar
              </button>
            )}
            {onDelete && (
              <button className="menu-item delete" onClick={handleDelete}>
                Excluir
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="card-title">{title}</h3>

      <div className="card-status-tags">
        {status.map((s, index) => (
          <span key={index} className={`status-tag status-${getStatusColor(s)}`}>
            {s}
          </span>
        ))}
      </div>

      <div className="card-footer">
        <div className="card-date">
          Atualizado em: {formatDate(updatedAt)}
        </div>
        <a
          href={readerLink || '#'}
          className="card-reader-link"
          onClick={(e) => {
            e.stopPropagation();
            if (!readerLink) {
              e.preventDefault();
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 3.5L10.5 7.5L6.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 8H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Link do leitor
        </a>
      </div>
    </div>
  );
};

export default ApostilaCard;

