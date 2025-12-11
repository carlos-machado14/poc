import React from 'react';
import Menu from './Menu';
import './Home.css';

interface HomeProps {
  onSelectEditor: () => void;
  onSelectViewer: () => void;
  onNavigate?: (page: 'inicio' | 'gestao-apostilas' | 'atualizacoes') => void;
  menuCurrentPage?: 'inicio' | 'gestao-apostilas' | 'atualizacoes';
}

const Home: React.FC<HomeProps> = ({ onSelectEditor, onSelectViewer, onNavigate, menuCurrentPage = 'inicio' }) => {
  return (
    <div className="home-container">
      <Menu
        currentPage={menuCurrentPage}
        onNavigate={onNavigate}
      />
      <div className="home-content">
      <div className="home-header">
        <h1>📚 Sistema de Documentos</h1>
        <p>Escolha o modo de trabalho</p>
      </div>

      <div className="home-options">
        <div className="option-card" onClick={onSelectEditor}>
          <div className="option-icon">✏️</div>
          <h2>Editor</h2>
          <p>Crie e edite documentos com formatação completa</p>
          <ul>
            <li>Formatação de texto</li>
            <li>Inserção de imagens</li>
            <li>Estilos customizados</li>
            <li>Importação de DOCX</li>
          </ul>
        </div>

        <div className="option-card" onClick={onSelectViewer}>
          <div className="option-icon">👁️</div>
          <h2>Visualizador</h2>
          <p>Visualize documentos e adicione marcações e comentários</p>
          <ul>
            <li>Visualização de documentos</li>
            <li>Marcações de texto</li>
            <li>Comentários</li>
            <li>Anotações pessoais</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Home;

