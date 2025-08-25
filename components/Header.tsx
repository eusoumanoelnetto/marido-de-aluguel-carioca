import React from 'react';

interface HeaderProps {
  onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  return (
    <header className="bg-brand-navy shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center cursor-pointer"
            onClick={onHomeClick}
          >
            <img src="https://wngalbve.manus.space/assets/logo_marido_aluguel_3-CqPHQ69B.png" alt="Marido de Aluguel Hub Logo" className="h-12" />
          </div>
          <button
            onClick={onHomeClick}
            className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-white bg-brand-muted-blue rounded-md hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-navy focus:ring-amber-500 transition-colors"
          >
            Mudar Perfil
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;