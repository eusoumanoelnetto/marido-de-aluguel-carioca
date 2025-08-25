import React, { useState, useEffect, useContext } from 'react';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ClientPage from './pages/ClientPage';
import ProviderPage from './pages/ProviderPage';
import { ServiceRequest, User, SignUpData } from './types';
import * as api from './services/apiService';
import { AuthContext } from './src/context/AuthContext';
import Toast from './components/Toast';

type Page = 'role-selection' | 'login' | 'signup' | 'client' | 'provider';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('role-selection');
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState<'client' | 'provider'>('client');
  const { user: currentUser, isAuthenticated, login, signUp, logout, updateUser: contextUpdateUser } = useContext(AuthContext);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  // This effect will run when a provider logs in to fetch their requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (currentUser?.role === 'provider') {
        try {
          const requests = await api.getServiceRequests();
          setServiceRequests(requests);
        } catch (error) {
          console.error("Failed to fetch requests:", error);
        }
      }
    };
    fetchRequests();
  }, [currentUser]);


  const addServiceRequest = async (request: ServiceRequest) => {
    try {
      await api.createServiceRequest(request);
      // In a real app with websockets or polling, the provider's list would update automatically.
      // Here, we don't need to do anything as the provider will fetch on next login/refresh.
    } catch (error) {
      console.error("Failed to create service request:", error);
      alert('Houve um erro ao criar sua solicitação. Tente novamente.');
    }
  };

  const updateRequestStatus = async (id: string, status: 'Aceito' | 'Recusado', quote?: number) => {
    try {
      const updatedRequest = await api.updateServiceRequestStatus(id, status, quote);
      setServiceRequests(prev => 
        prev.map(req => req.id === id ? updatedRequest : req)
      );
    } catch (error) {
      console.error("Failed to update request status:", error);
      alert('Houve um erro ao atualizar a solicitação. Tente novamente.');
    }
  };
  
  const handleLogin = async (email: string, password?: string) => {
    try {
      const user = await login(email, password);
      if (user) {
        setCurrentPage(user.role);
      } else {
        // login returned null (invalid credentials)
        window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'E-mail ou senha inválidos.', type: 'error' } }));
      }
    } catch (err: any) {
      console.error('Login error (frontend):', err);
      window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: err?.message || 'E-mail ou senha inválidos.', type: 'error' } }));
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    try {
      const user = await signUp(data);
      if (user) {
  // Show a friendly success toast before navigating
  const displayName = (user && (user.name || data.name)) ? (user.name || data.name) : '';
  window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: `Cadastro realizado com sucesso${displayName ? `, ${displayName}` : ''}! Seja bem-vind${displayName ? 'o(a)' : ''} ao Marido de Aluguel.`, type: 'success' } }));
  setCurrentPage(data.role);
      } else {
        // Unexpected null/undefined response
  window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Erro no cadastro.', type: 'error' } }));
        setCurrentPage('login');
      }
    } catch (err: any) {
  console.error('Sign up error (frontend):', err);
  // Show backend message when available
  window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: err?.message || 'Erro no cadastro.', type: 'error' } }));
      setCurrentPage('login');
    }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const savedUser = await contextUpdateUser(updatedUser);
      // currentUser is handled by context
    } catch (error) {
      console.error("Failed to update user:", error);
      alert('Houve um erro ao atualizar seu perfil.');
    }
  };


  const handleLogout = () => {
    logout();
  setCurrentPage('login');
  };

  const renderPage = () => {
    if (!isAuthenticated) {
      switch (currentPage) {
        case 'login':
          return <LoginPage 
                    onLoginSuccess={handleLogin} 
                    onNavigateToSignUp={() => setCurrentPage('signup')}
                    onBack={() => setCurrentPage('role-selection')}
                  />;
        case 'signup':
          return <SignUpPage 
                    initialRole={selectedRoleForAuth}
                    onSignUpSuccess={handleSignUp} 
                    onNavigateToLogin={() => setCurrentPage('login')}
                    onBack={() => setCurrentPage('login')}
                  />;
        case 'role-selection':
        default:
          return <RoleSelectionPage 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigateToSignUp={() => {
              setSelectedRoleForAuth('client'); // Default role
              setCurrentPage('signup');
            }}
          />;
      }
    } else {
       switch (currentUser?.role) {
        case 'client':
          return <ClientPage 
                    currentUser={currentUser!} 
                    addServiceRequest={addServiceRequest} 
                    onLogout={handleLogout}
                    updateUser={handleUpdateUser}
                  />;
        case 'provider':
          return <ProviderPage 
                    currentUser={currentUser!}
                    requests={serviceRequests} 
                    updateRequestStatus={updateRequestStatus} 
                    onLogout={handleLogout}
                    updateUser={handleUpdateUser}
                 />;
        default:
          handleLogout();
          return null;
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Toast />
      <main>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
