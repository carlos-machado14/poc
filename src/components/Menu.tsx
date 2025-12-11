import React, { useState } from 'react';
import './Menu.css';
import pp_logo from '../assets/pp_logo.png';
import logo from '../assets/ilustracao.svg';
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
              <img src={pp_logo} alt="Logo" className="menu-logo-image" />
            </>
          )}

        </div>
        <button className="menu-toggle" onClick={toggleCollapse} title={isCollapsed ? 'Expandir' : 'Recolher'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <nav className={`menu-nav ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          className={`menu-item ${currentPage === 'inicio' ? 'active' : ''}`}
          onClick={() => handleNavigate('inicio')}
          title="Início"
        >
          <svg width="20" height="20" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.00012 13.111H11.6668M7.51486 1.24763L1.86294 5.64357C1.48513 5.93742 1.29623 6.08434 1.16014 6.26835C1.03959 6.43133 0.949785 6.61495 0.89514 6.81017C0.83345 7.03056 0.83345 7.26988 0.83345 7.74851V13.7776C0.83345 14.711 0.83345 15.1777 1.01511 15.5343C1.1749 15.8479 1.42986 16.1028 1.74347 16.2626C2.09999 16.4443 2.5667 16.4443 3.50012 16.4443H13.1668C14.1002 16.4443 14.5669 16.4443 14.9234 16.2626C15.237 16.1028 15.492 15.8479 15.6518 15.5343C15.8334 15.1777 15.8334 14.711 15.8334 13.7776V7.74851C15.8334 7.26988 15.8334 7.03056 15.7718 6.81017C15.7171 6.61495 15.6273 6.43133 15.5068 6.26835C15.3707 6.08434 15.1818 5.93742 14.804 5.64357L9.15204 1.24763C8.85927 1.01992 8.71288 0.906064 8.55124 0.862298C8.40861 0.823682 8.25829 0.823682 8.11566 0.862298C7.95402 0.906064 7.80763 1.01992 7.51486 1.24763Z" stroke="#414651" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
          {!isCollapsed && <span>Início</span>}
        </button>

        <button
          className={`menu-item ${currentPage === 'gestao-apostilas' ? 'active' : ''}`}
          onClick={() => handleNavigate('gestao-apostilas')}
          title="Gestão de apostilas"
        >
          <svg width="15" height="15" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.16667 15.8333L9.08329 15.7083C8.50442 14.84 8.21499 14.4058 7.83259 14.0915C7.49405 13.8133 7.10397 13.6045 6.68467 13.4772C6.21104 13.3333 5.68926 13.3333 4.64569 13.3333H3.5C2.56658 13.3333 2.09987 13.3333 1.74335 13.1517C1.42975 12.9919 1.17478 12.7369 1.01499 12.4233C0.833336 12.0668 0.833336 11.6001 0.833336 10.6667V3.49999C0.833336 2.56657 0.833336 2.09986 1.01499 1.74334C1.17478 1.42974 1.42975 1.17477 1.74335 1.01498C2.09987 0.833328 2.56658 0.833328 3.5 0.833328H3.83334C5.70018 0.833328 6.6336 0.833328 7.34664 1.19664C7.97384 1.51622 8.48378 2.02615 8.80336 2.65336C9.16667 3.3664 9.16667 4.29982 9.16667 6.16666M9.16667 15.8333V6.16666M9.16667 15.8333L9.25005 15.7083C9.82892 14.84 10.1184 14.4058 10.5008 14.0915C10.8393 13.8133 11.2294 13.6045 11.6487 13.4772C12.1223 13.3333 12.6441 13.3333 13.6876 13.3333H14.8333C15.7668 13.3333 16.2335 13.3333 16.59 13.1517C16.9036 12.9919 17.1586 12.7369 17.3183 12.4233C17.5 12.0668 17.5 11.6001 17.5 10.6667V3.49999C17.5 2.56657 17.5 2.09986 17.3183 1.74334C17.1586 1.42974 16.9036 1.17477 16.59 1.01498C16.2335 0.833328 15.7668 0.833328 14.8333 0.833328H14.5C12.6332 0.833328 11.6997 0.833328 10.9867 1.19664C10.3595 1.51622 9.84956 2.02615 9.52998 2.65336C9.16667 3.3664 9.16667 4.29982 9.16667 6.16666" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>

          {!isCollapsed && <span>Gestão de apostilas</span>}
        </button>

        <button
          className={`menu-item ${currentPage === 'atualizacoes' ? 'active' : ''}`}
          onClick={() => handleNavigate('atualizacoes')}
          title="Atualizações"
        >
          <svg width="17" height="19" viewBox="0 0 17 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0.833328C10 0.833328 10.7077 0.934428 13.6366 3.86336C16.5656 6.79229 16.5656 11.541 13.6366 14.47C12.5989 15.5077 11.3327 16.1778 10 16.4801M10 0.833328L15 0.833328M10 0.833328L10 5.83333M6.66667 17.4998C6.66667 17.4998 5.95896 17.3987 3.03003 14.4698C0.101099 11.5409 0.101099 6.79213 3.03003 3.8632C4.06776 2.82547 5.33393 2.15541 6.66667 1.85302M6.66667 17.4998L1.66667 17.5M6.66667 17.4998L6.66667 12.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {!isCollapsed && <span>Atualizações</span>}
        </button>
      </nav>
      <div className={`menu-footer ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed && (
            <>
              <img src={logo} alt="Logo" className="menu-footer-logo" />
            </>
          )}
      </div>
    </div>
  );
};

export default Menu;
