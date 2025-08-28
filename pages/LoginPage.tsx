import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: (email: string, password?: string) => void;
  onNavigateToSignUp: () => void;
  onBack: () => void;
  loading?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToSignUp, onBack, loading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(email, password);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex justify-center items-center p-4 relative">
      <button 
        onClick={onBack} 
        className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 font-semibold text-sm py-2 px-4 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
        aria-label="Voltar para a seleção de perfil"
      >
          <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
      </button>

      <div className="bg-white p-10 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-sm w-full text-center">
        <img 
          src="https://wngalbve.manus.space/assets/logo_marido_aluguel_3-CqPHQ69B.png" 
          alt="Logo Marido de Aluguel" 
          className="w-36 h-auto mx-auto mb-6"
        />
        
        <h1 className="text-3xl font-bold text-brand-navy mb-2">Entrar</h1>
        <p className="text-[#667085] mb-[30px]">Acesse sua conta</p>

        <form className="text-left" onSubmit={handleSubmit}>
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
              className="w-full px-4 py-3 bg-gray-100 border border-[#d0d5dd] rounded-lg text-base transition focus:outline-none focus:border-brand-blue focus:ring focus:ring-brand-blue/20 placeholder:text-[#98a2b3]"
            />
          </div>
          
          <div className="mb-5">
            <label htmlFor="password" className="block font-semibold mb-2 text-[#344054]">Senha</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border border-[#d0d5dd] rounded-lg text-base transition focus:outline-none focus:border-brand-blue focus:ring focus:ring-brand-blue/20 placeholder:text-[#98a2b3]"
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-brand-red text-white font-semibold p-3.5 rounded-lg text-base cursor-pointer transition hover:opacity-90 hover:scale-[1.02] mt-2.5 disabled:opacity-60 disabled:cursor-wait">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-[25px] text-sm">
          <p className="text-[#667085] mb-[15px]">
            Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToSignUp(); }} className="text-brand-red font-semibold no-underline hover:underline">Cadastre-se</a>
          </p>
          <a href="#" className="text-brand-blue font-medium no-underline hover:underline">Esqueci minha senha</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;