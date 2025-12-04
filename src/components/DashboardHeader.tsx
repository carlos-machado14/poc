import React from 'react';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  userName?: string;
  userAvatar?: string;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName = 'Natalia',
  userAvatar,
  onSearch,
  onLogout,
  onToggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <div className="logo-container">
          <span className="logo-text">pontoaponto</span>
        </div>
        {onToggleSidebar && (
          <button className="sidebar-toggle" onClick={onToggleSidebar}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      <div className="dashboard-header-center">
        <div className="user-greeting">
          <div className="greeting-content">
            <span className="greeting-text">Olá, {userName}</span>
            <span className="greeting-emoji">👋</span>
          </div>
          <p className="greeting-subtitle">Aqui você administra suas apostilas!</p>
        </div>
        {userAvatar && (
          <div className="user-avatar-small">
            <img src={userAvatar} alt={userName} />
          </div>
        )}
      </div>

      <div className="dashboard-header-right">
        <div className="search-container">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por apostila..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        {onLogout && (
          <button className="logout-button" onClick={onLogout}>
            <span>Sair</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;

