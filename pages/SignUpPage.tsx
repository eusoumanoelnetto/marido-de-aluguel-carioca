import React, { useState, useEffect } from 'react';
import { HammerIcon, WrenchIcon, ZapIcon, DropletsIcon, PaintBucketIcon, HouseIcon, MonitorIcon, CctvIcon } from '../components/Icons';
import { SignUpData } from '../types';


interface SignUpPageProps {
  initialRole: 'client' | 'provider';
  onSignUpSuccess: (data: SignUpData) => void;
  onNavigateToLogin: () => void;
  onBack: () => void;
  loading?: boolean;
}

const services = [
    { name: 'Montagem de Móveis', icon: <HammerIcon /> },
    { name: 'Reparos Gerais', icon: <WrenchIcon /> },
    { name: 'Elétrica', icon: <ZapIcon /> },
    { name: 'Hidráulica', icon: <DropletsIcon /> },
    { name: 'Pintura', icon: <PaintBucketIcon /> },
    { name: 'Manutenção Geral', icon: <HouseIcon /> },
    { name: 'Informática', icon: <MonitorIcon /> },
    { name: 'CFTV', icon: <CctvIcon /> },
];

const SignUpPage: React.FC<SignUpPageProps> = ({ initialRole, onSignUpSuccess, onNavigateToLogin, onBack, loading = false }) => {
  const [userType, setUserType] = useState<'client' | 'provider'>(initialRole);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setUserType(initialRole);
  }, [initialRole]);

  const handleServiceToggle = (serviceName: string) => {
    setSelectedServices(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(serviceName)) {
        newSelected.delete(serviceName);
      } else {
        newSelected.add(serviceName);
      }
      return newSelected;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const servicesArray = userType === 'provider' ? Array.from(selectedServices) : [];
    onSignUpSuccess({ name, email, phone, role: userType, cep, password, services: servicesArray });
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex justify-center items-center p-4 relative">
        <button 
            onClick={onBack} 
            className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 font-semibold text-sm py-2 px-4 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
            aria-label="Voltar para o login"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
      </button>

      <div className="bg-white p-10 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-md w-full text-center">
        <img 
          src="https://wngalbve.manus.space/assets/logo_marido_aluguel_3-CqPHQ69B.png" 
          alt="Logo Marido de Aluguel" 
          className="w-36 h-auto mx-auto mb-6"
        />
        
        <h1 className="text-3xl font-bold text-brand-navy mb-2">Cadastrar-se</h1>
        <p className="text-[#667085] mb-[30px]">Crie sua conta</p>
        
        <div className="flex bg-[#f2f4f7] rounded-lg p-1 mb-[30px]">
            <button 
                onClick={() => setUserType('client')}
                className={`flex-1 p-2.5 rounded-md text-sm font-semibold transition-all duration-200 ease-in-out ${userType === 'client' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-[#667085]'}`}
            >
                Cliente
            </button>
            <button 
                onClick={() => setUserType('provider')}
                className={`flex-1 p-2.5 rounded-md text-sm font-semibold transition-all duration-200 ease-in-out ${userType === 'provider' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-[#667085]'}`}
            >
                Prestador
            </button>
        </div>

        <form className="text-left" onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="name" className="block font-semibold mb-2 text-[#344054]">Nome Completo</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              placeholder="Seu nome completo" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-[#d0d5dd] rounded-lg text-base transition focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 placeholder:text-[#98a2b3]"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="email" className="block font-semibold mb-2 text-[#344054]">E-mail</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="seu@email.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-[#d0d5dd] rounded-lg text-base transition focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 placeholder:text-[#98a2b3]"
            />
          </div>
           <div className="mb-5">
            <label htmlFor="phone" className="block font-semibold mb-2 text-[#344054]">Telefone</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              placeholder="(21) 99999-9999" 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-[#d0d5dd] rounded-lg text-base transition focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 placeholder:text-[#98a2b3]"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="cep" className="block font-semibold mb-2 text-[#344054]">CEP</label>
            <input 
              type="text" 
              id="cep" 
              name="cep" 
              placeholder="00000-000" 
              required 
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-[#d0d5dd] rounded-lg text-base transition focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 placeholder:text-[#98a2b3]"
            />
          </div>

          {userType === 'provider' && (
             <div className="mb-5">
                <label className="block font-semibold mb-2 text-[#344054]">Serviços Oferecidos</label>
                <div className="grid grid-cols-2 gap-2.5">
                    {services.map(service => {
                        const isSelected = selectedServices.has(service.name);
                        return (
                            <div 
                                key={service.name} 
                                onClick={() => handleServiceToggle(service.name)}
                                className={`flex items-center gap-2 p-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                    isSelected 
                                        ? 'bg-brand-red text-white' 
                                        : 'border border-[#d0d5dd]'
                                }`}
                            >
                                <div className={`fa-fw w-4 h-4 flex items-center justify-center ${isSelected ? 'text-white' : 'text-[#667085]'}`}>
                                    {service.icon}
                                </div>
                                <span>{service.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="password" className="block font-semibold mb-2 text-[#344054]">Senha</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-[#d0d5dd] rounded-lg text-base transition focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 placeholder:text-[#98a2b3]"
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-white font-semibold py-3.5 rounded-lg text-base cursor-pointer transition hover:opacity-90 mt-2.5 disabled:opacity-60 disabled:cursor-wait">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-sm">
          <p className="text-[#667085]">
            Já tem conta? <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} className="text-brand-red font-semibold no-underline hover:underline">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;