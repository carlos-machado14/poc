import React, { useState } from 'react';
import './Menu.css';

interface MenuProps {
  currentPage?: 'inicio' | 'gestao-apostilas' | 'atualizacoes';
  onNavigate?: (page: 'inicio' | 'gestao-apostilas' | 'atualizacoes') => void;
}

const Menu: React.FC<MenuProps> = ({ currentPage = 'inicio', onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigate = (page: 'inicio' | 'gestao-apostilas' | 'atualizacoes') => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div className={`menu-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header com Logo e Botão de Recolher */}
      <div className="menu-header">
        <div className="menu-logo">
          {!isCollapsed && (
            <>
              <span className="logo-ponto">ponto</span>
              <span className="logo-aponto">aponto</span>
              <svg className="logo-curve" width="60" height="20" viewBox="0 0 60 20" fill="none">
                <path d="M5 15 Q30 5, 55 15" stroke="#00A86B" strokeWidth="2" fill="none"/>
              </svg>
            </>
          )}
          {isCollapsed && (
            <div className="logo-icon">
              <span className="logo-ponto">p</span>
              <span className="logo-aponto">a</span>
            </div>
          )}
        </div>
        <button className="menu-toggle" onClick={toggleCollapse} title={isCollapsed ? 'Expandir' : 'Recolher'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="menu-nav">
        <button
          className={`menu-item ${currentPage === 'inicio' ? 'active' : ''}`}
          onClick={() => handleNavigate('inicio')}
          title="Início"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10L10 3L17 10M4 10V16H7V13H13V16H16V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && <span>Início</span>}
        </button>

        <button
          className={`menu-item ${currentPage === 'gestao-apostilas' ? 'active' : ''}`}
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
          className={`menu-item ${currentPage === 'atualizacoes' ? 'active' : ''}`}
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

      {/* Espaço vazio no meio */}
      <div className="menu-spacer"></div>

      {/* Ilustração e Perfil do Usuário */}
      <div className="menu-footer">
        {!isCollapsed && (
          <div className="menu-illustration">
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Livro aberto */}
              <rect x="20" y="30" width="50" height="40" fill="#FFD700" rx="2"/>
              <line x1="45" y1="30" x2="45" y2="70" stroke="#333" strokeWidth="1.5"/>
              {/* Lâmpada */}
              <circle cx="45" cy="50" r="8" fill="#FFD700"/>
              <path d="M45 42L42 38M45 42L48 38M45 58L42 62M45 58L48 62" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
              {/* Livros fechados */}
              <rect x="10" y="40" width="15" height="20" fill="#2196F3" rx="1"/>
              <rect x="75" y="35" width="15" height="25" fill="#2196F3" rx="1"/>
            </svg>
          </div>
        )}
        
        <div className="menu-user-profile">
          <div className="user-avatar">
            <div className="avatar-circle">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="#E0E0E0"/>
                <circle cx="20" cy="16" r="6" fill="#666"/>
                <path d="M10 32C10 28 14 26 20 26C26 26 30 28 30 32" fill="#666"/>
              </svg>
            </div>
            <div className="user-status"></div>
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">Olivia Rhye</div>
              <div className="user-email">olivia@untitledui.com</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;

