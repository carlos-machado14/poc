import React from 'react';
import './FiltersButton.css';

interface FiltersButtonProps {
  onClick?: () => void;
  active?: boolean;
}

const FiltersButton: React.FC<FiltersButtonProps> = ({ onClick, active = false }) => {
  return (
    <button className={`filters-button ${active ? 'active' : ''}`} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 4H17M5 8H15M7 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="3" cy="4" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="13" cy="12" r="1.5" fill="currentColor"/>
      </svg>
      <span>Filtros</span>
    </button>
  );
};

export default FiltersButton;

