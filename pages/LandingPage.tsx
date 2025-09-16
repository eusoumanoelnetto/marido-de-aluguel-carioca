import React from 'react';
import { HammerIcon, WrenchIcon, ZapIcon, DropletsIcon, PaintBucketIcon, HouseIcon, MonitorIcon, CctvIcon } from '../components/Icons';


interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}

const ServiceItem: React.FC<{ icon: React.ReactNode; name: string }> = ({ icon, name }) => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="flex items-center justify-center h-8 w-8 mb-2 text-white/80">{icon}</div>
    <span className="text-xs font-medium">{name}</span>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToSignUp }) => {
    
  const services = [
    { icon: <HammerIcon width="30" height="30" />, name: 'Montagem de Móveis' },
    { icon: <WrenchIcon width="30" height="30" />, name: 'Reparos Gerais' },
    { icon: <ZapIcon width="30" height="30" />, name: 'Elétrica' },
    { icon: <DropletsIcon width="30" height="30" />, name: 'Hidráulica' },
    { icon: <PaintBucketIcon width="30" height="30" />, name: 'Pintura' },
    { icon: <HouseIcon width="30" height="30" />, name: 'Manutenção Geral' },
    { icon: <MonitorIcon width="30" height="30" />, name: 'Informática' },
    { icon: <CctvIcon width="30" height="30" />, name: 'CFTV' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4c2a85] to-[#a03c64] text-white flex flex-col justify-center items-center p-5">
      <main className="max-w-sm w-full text-center flex flex-col items-center">
        <img 
          src="https://wngalbve.manus.space/assets/logo_marido_aluguel_3-CqPHQ69B.png" 
          alt="Logo Marido de Aluguel" 
          className="w-36 h-auto bg-white p-2 rounded-lg mb-6 shadow-lg"
        />

        <h1 className="text-4xl font-bold mb-2">Marido de Aluguel Carioca</h1>
        <p className="text-xl opacity-90 mb-8 max-w-xs">
          Conectamos você aos melhores profissionais para resolver seus problemas domésticos.
        </p>

        <div className="w-full space-y-4 mb-10">
          <button 
            onClick={onNavigateToLogin}
            className="w-full py-3 px-4 rounded-lg bg-[#e50914] text-white font-semibold text-lg transition-transform hover:scale-105 shadow-md"
            aria-label="Entrar"
          >
            Entrar
          </button>
          <button 
            onClick={onNavigateToSignUp}
            className="w-full py-3 px-4 rounded-lg bg-white text-black font-semibold text-lg transition-transform hover:scale-105 shadow-md"
            aria-label="Cadastre-se"
          >
            Cadastre-se
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 w-full">
          {services.map((service, index) => (
            <ServiceItem key={index} icon={service.icon} name={service.name} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;