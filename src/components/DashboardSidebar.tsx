import React from 'react';
import './DashboardSidebar.css';

interface DashboardSidebarProps {
  currentPage?: 'inicio' | 'gestao-apostilas' | 'atualizacoes';
  onNavigate?: (page: 'inicio' | 'gestao-apostilas' | 'atualizacoes') => void;
  isCollapsed?: boolean;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentPage = 'gestao-apostilas',
  onNavigate,
  isCollapsed = false,
}) => {
  const handleNavigate = (page: 'inicio' | 'gestao-apostilas' | 'atualizacoes') => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${currentPage === 'inicio' ? 'active' : ''}`}
          onClick={() => handleNavigate('inicio')}
          title="Início"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10L10 3L17 10M4 10V16H7V13H13V16H16V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && <span>Início</span>}
        </button>

        <button
          className={`sidebar-item ${currentPage === 'gestao-apostilas' ? 'active' : ''}`}
          onClick={() => handleNavigate('gestao-apostilas')}
          title="Gestão de apostilas"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H16V16H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M7 4V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 10L12 12L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && <span>Gestão de apostilas</span>}
        </button>

        <button
          className={`sidebar-item ${currentPage === 'atualizacoes' ? 'active' : ''}`}
          onClick={() => handleNavigate('atualizacoes')}
          title="Atualizações"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3V10M10 10L13 7M10 10L7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span>Atualizações</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="sidebar-illustration">
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Livro aberto */}
              <rect x="20" y="30" width="50" height="40" fill="#1e40af" rx="2"/>
              <line x1="45" y1="30" x2="45" y2="70" stroke="#fff" strokeWidth="1.5"/>
              {/* Lâmpada */}
              <circle cx="45" cy="20" r="8" fill="#4CAF50"/>
              <path d="M45 12L42 8M45 12L48 8M45 28L42 32M45 28L48 32" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;

