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
import PWAInstall from './components/PWAInstall';
import LoadingOverlay from './components/LoadingOverlay';
import NewRequestAlert from './components/NewRequestAlert';

type Page = 'role-selection' | 'login' | 'signup' | 'client' | 'provider';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('role-selection');
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState<'client' | 'provider'>('client');
  const { user: currentUser, isAuthenticated, login, signUp, logout, updateUser: contextUpdateUser } = useContext(AuthContext);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPendingIds, setLastPendingIds] = useState<Set<string>>(new Set());
  const [newPending, setNewPending] = useState<ServiceRequest[]>([]);
  const [showNewRequestsAlert, setShowNewRequestsAlert] = useState(false);

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

  // Polling leve para detectar novos pedidos pendentes enquanto prestador logado
  useEffect(() => {
    if (currentUser?.role !== 'provider') return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const requests = await api.getServiceRequests();
        if (cancelled) return;
        setServiceRequests(requests);
        const pending = requests.filter(r => r.status === 'Pendente');
        const pendingIds = new Set(pending.map(p => p.id));
        // Detectar novos
        const newlyArrived = pending.filter(p => !lastPendingIds.has(p.id));
        if (newlyArrived.length) {
          setNewPending(newlyArrived);
          setShowNewRequestsAlert(true);
          // Notification API (permite apenas se usuário concedeu e aba ativa)
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              newlyArrived.forEach(n => {
                try { new Notification('Novo pedido', { body: `${n.clientName} solicitou ${n.category}` }); } catch (_) {}
              });
            } else if (Notification.permission === 'default') {
              try { Notification.requestPermission(); } catch(_){}
            }
          }
        }
        setLastPendingIds(pendingIds);
      } catch (e) {
        // silencioso
      }
    }, 15000); // 15s
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentUser, lastPendingIds]);


  const addServiceRequest = async (request: ServiceRequest) => {
    try {
      await api.createServiceRequest(request);
      // In a real app with websockets or polling, the provider's list would update automatically.
      // Here, we don't need to do anything as the provider will fetch on next login/refresh.
    } catch (error) {
      console.error("Failed to create service request:", error);
  window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Houve um erro ao criar sua solicitação. Tente novamente.', type: 'error' } }));
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
  window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Houve um erro ao atualizar a solicitação. Tente novamente.', type: 'error' } }));
    }
  };
  
  const handleLogin = async (email: string, password?: string) => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true);
    try {
      const user = await signUp(data); // signUp agora lança erro em caso de falha
      if (user) {
        const displayName = user.name || data.name || '';
        window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: `Cadastro realizado com sucesso${displayName ? `, ${displayName}` : ''}! Seja bem-vind${displayName ? 'o(a)' : ''}!`, type: 'success' } }));
        setCurrentPage(data.role);
      } else {
        window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Erro no cadastro.', type: 'error' } }));
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('cadastrado') || msg.includes('409') || msg.includes('conflict')) {
        window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.', type: 'error' } }));
      } else if (msg.includes('cors') || msg.includes('network')) {
        window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.', type: 'error' } }));
      } else {
        window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: err?.message || 'Erro no cadastro. Tente novamente.', type: 'error' } }));
      }
      // Não redireciona automaticamente; usuário corrige e tenta novamente
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const savedUser = await contextUpdateUser(updatedUser);
      // currentUser is handled by context
    } catch (error) {
      console.error("Failed to update user:", error);
  window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Houve um erro ao atualizar seu perfil.', type: 'error' } }));
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
                    loading={isLoading}
                  />;
        case 'signup':
          return <SignUpPage 
                    initialRole={selectedRoleForAuth}
                    onSignUpSuccess={handleSignUp} 
                    onNavigateToLogin={() => setCurrentPage('login')}
                    onBack={() => setCurrentPage('login')}
                    loading={isLoading}
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
  
  useEffect(() => {
    const handler = () => setCurrentPage('login');
    window.addEventListener('mdac:gotoLogin', handler);
    return () => window.removeEventListener('mdac:gotoLogin', handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Toast />
      <PWAInstall />
      <main>
        {renderPage()}
      </main>
      {showNewRequestsAlert && newPending.length > 0 && currentUser?.role === 'provider' && (
        <NewRequestAlert 
          requests={newPending}
          onClose={() => setShowNewRequestsAlert(false)}
          onView={() => { setShowNewRequestsAlert(false); setCurrentPage('provider'); }}
        />
      )}
    </div>
  );
};

export default App;
