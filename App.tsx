import React, { useState, useEffect } from 'react';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ClientPage from './pages/ClientPage';
import ProviderPage from './pages/ProviderPage';
import { ServiceRequest, User, SignUpData } from './types';
import * as api from './services/apiService';

type Page = 'role-selection' | 'login' | 'signup' | 'client' | 'provider';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('role-selection');
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState<'client' | 'provider'>('client');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
      const user = await api.login(email, password);
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
        setCurrentPage(user.role);
      } else {
        alert('E-mail ou senha inválidos.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Ocorreu um erro ao tentar fazer login.');
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    try {
      const newUser = await api.signUp(data);
      // Log in the user right after signing up
      setIsAuthenticated(true);
      setCurrentUser(newUser);
      setCurrentPage(data.role);
    } catch(error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Ocorreu um erro desconhecido durante o cadastro.');
      }
      setCurrentPage('login');
    }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const savedUser = await api.updateUser(updatedUser);
      setCurrentUser(savedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      alert('Houve um erro ao atualizar seu perfil.');
    }
  };


  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('role-selection');
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
      <main>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
