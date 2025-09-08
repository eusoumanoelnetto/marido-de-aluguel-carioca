import React, { useState, useEffect, useContext } from 'react';
import { Analytics } from '@vercel/analytics/react';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ClientPage from './pages/ClientPage';
import ProviderPage from './pages/ProviderPage';
import { ServiceRequest, User, SignUpData } from './types';
import * as api from './services/apiService';
import { AuthContext } from './src/context/AuthContext';
import Toast from './components/Toast';
import AnnouncementBanner from './components/AnnouncementBanner';
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
  const [lastRequestsMap, setLastRequestsMap] = useState<Record<string, ServiceRequest['status']>>({});
  const [apiMisconfigured, setApiMisconfigured] = useState(false); // Temporariamente sempre false

  // Buscar solicitações tanto para prestador quanto para cliente (cliente filtra localmente pelos seus pedidos)
  useEffect(() => {
    const fetchRequests = async () => {
      if (currentUser) {
        try {
          const requests = await api.getServiceRequests();
          const normalized = requests.map(r => {
            const q: any = (r as any).quote;
            let numQuote = q;
            if (q !== undefined && q !== null && typeof q !== 'number') {
              const parsed = Number(q);
              if (!isNaN(parsed)) numQuote = parsed; else numQuote = undefined;
            }
            return { ...r, quote: numQuote };
          });
          setServiceRequests(normalized);
        } catch (error) {
          console.error("Failed to fetch requests:", error);
        }
      }
    };
    fetchRequests();
  }, [currentUser]);

  // Detectar ambiente sem API configurada (ex: site hospedado no GitHub Pages sem VITE_API_BASE)
  useEffect(() => {
    // só checar em produção para não mostrar alerta em ambiente dev
    if (!import.meta.env.PROD) return;
    const checkApi = async () => {
      try {
        const base = (import.meta.env.VITE_API_BASE as string) || 'https://marido-de-aluguel-carioca.onrender.com';
        console.log('🔍 Verificando API em:', base);
        
        // tentar buscar rota de API diretamente (401 ou 200 indica que está funcionando)
        const apiUrl = `${base.replace(/\/$/, '')}/api/requests`;
        console.log('🔍 Testando URL:', apiUrl);
        
        const res = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
        console.log('🔍 Status da resposta:', res.status);
        
        // Se 401 ou 200, significa que a API está funcionando
        if (res.status === 401 || res.status === 200) {
          console.log('✅ API funcionando - ocultando banner');
          setApiMisconfigured(false);
        } else if (res.status === 404) {
          console.log('❌ API não encontrada - mostrando banner');
          setApiMisconfigured(true);
        }
      } catch (e) {
        // network errors - sinaliza possível misconfiguração em produção
        console.log('❌ Erro ao verificar API:', e);
        if (import.meta.env.PROD) {
          console.log('❌ Erro em produção - mostrando banner');
          setApiMisconfigured(true);
        }
      }
    };
    checkApi();
  }, []);

  // Polling leve para detectar mudanças relevantes (novos pedidos, orçamentos enviados, orçamentos aceitos)
  useEffect(() => {
    if (!currentUser) return;
  let cancelled = false;
  const isPollingPaused = { value: false } as { value: boolean };

  const pauseHandler = () => { isPollingPaused.value = true; };
  const resumeHandler = () => { isPollingPaused.value = false; /* trigger immediate check on resume */ check().catch(() => {}); };

    const check = async () => {
      if (isPollingPaused.value) return;
      try {
        const requestsRaw = await api.getServiceRequests();
        const requests = requestsRaw.map(r => {
          const q: any = (r as any).quote;
          let numQuote = q;
          if (q !== undefined && q !== null && typeof q !== 'number') {
            const parsed = Number(q);
            if (!isNaN(parsed)) numQuote = parsed; else numQuote = undefined;
          }
          return { ...r, quote: numQuote };
        });
        if (cancelled) return;
        // atualizar lista principal
        setServiceRequests(requests);

        // construir mapa atual id->status
        const currentMap: Record<string, ServiceRequest['status']> = {};
        requests.forEach(r => (currentMap[r.id] = r.status));

        // detectar novos pedidos pendentes (para prestador)
        if (currentUser.role === 'provider') {
          const pending = requests.filter(r => r.status === 'Pendente');
          const pendingIds = new Set(pending.map(p => p.id));
          const newlyArrived = pending.filter(p => !lastPendingIds.has(p.id));
          if (newlyArrived.length) {
            setNewPending(newlyArrived);
            setShowNewRequestsAlert(true);
            // tocar som simples via WebAudio
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.type = 'sine'; o.frequency.value = 880;
              g.gain.value = 0.05;
              o.connect(g); g.connect(ctx.destination);
              o.start(); o.stop(ctx.currentTime + 0.12);
            } catch (e) {
              // ignore
            }

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
        }

        // detectar transições comparando lastRequestsMap
        const lastMap = lastRequestsMap || {};
        // Para clientes: notificar quando um pedido dele recebe 'Orçamento Enviado'
        if (currentUser.role === 'client') {
          const newQuotes: string[] = [];
          requests.forEach(r => {
            const prev = lastMap[r.id];
            if (prev !== 'Orçamento Enviado' && r.status === 'Orçamento Enviado' && r.clientEmail === currentUser.email) {
              // notificação visual principal
              window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: `Você recebeu um orçamento de ${r.providerEmail || 'um prestador'} para ${r.category}.`, type: 'success', quoteId: r.id } }));
              // evento específico para badge
              window.dispatchEvent(new CustomEvent('mdac:newQuote', { detail: { id: r.id } }));
              newQuotes.push(r.id);
            }
          });
          // agrupar em notificação do sistema (web notification) se mais de um chegou de uma vez
          if (newQuotes.length > 1 && 'Notification' in window && Notification.permission === 'granted') {
            try { new Notification('Novos orçamentos recebidos', { body: `${newQuotes.length} novos orçamentos chegaram.` }); } catch(_) {}
          }
        }

        // Para prestadores: notificar quando status relevante muda (Aceito ou Cancelado) para pedido que ele orçou
        if (currentUser.role === 'provider') {
          requests.forEach(r => {
            const prev = lastMap[r.id];
            if (r.providerEmail === currentUser.email) {
              if (prev !== 'Aceito' && r.status === 'Aceito') {
                window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: `Seu orçamento para ${r.clientName} foi aceito. Combine os próximos passos.`, type: 'success' } }));
              } else if (prev !== 'Cancelado' && r.status === 'Cancelado') {
                window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: `O cliente cancelou a solicitação (${r.category}).`, type: 'warning' } }));
              }
            }
          });
        }

        setLastRequestsMap(currentMap);
      } catch (e) {
        // silencioso
      }
    };

  // primeira checagem imediata
  window.addEventListener('mdac:pausePolling', pauseHandler as EventListener);
  window.addEventListener('mdac:resumePolling', resumeHandler as EventListener);
  check();
  const interval = setInterval(check, 15000);
  return () => { cancelled = true; clearInterval(interval); window.removeEventListener('mdac:pausePolling', pauseHandler as EventListener); window.removeEventListener('mdac:resumePolling', resumeHandler as EventListener); };
  }, [currentUser, lastPendingIds, lastRequestsMap]);


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

  const updateRequestStatus = async (id: string, status: ServiceRequest['status'], quote?: number) => {
    try {
      const updatedRequest = await api.updateServiceRequestStatus(id, status, quote, currentUser?.role === 'provider' ? currentUser.email : undefined);
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
                    requests={serviceRequests}
                    updateRequestStatus={updateRequestStatus}
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
  {apiMisconfigured && !isAuthenticated && (
          <div className="w-full bg-yellow-50 border-b border-yellow-200 text-yellow-900 p-3 text-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div>
                <strong>Atenção:</strong> Backend não configurado para este deploy. Defina a variável de ambiente <code>VITE_API_BASE</code> apontando para a URL do backend (ex: https://meu-backend.onrender.com) e reconstrua o site para que clientes e prestadores recebam notificações e dados.
              </div>
              <div>
                <button onClick={() => setApiMisconfigured(false)} className="text-yellow-800 underline text-sm">Fechar</button>
              </div>
            </div>
          </div>
        )}
  {/* Banner global removido para client e provider: client vê só "Atualizações" e provider verá banner dentro do dashboard */}
  {false && <AnnouncementBanner role={currentUser?.role} />}
  <main>
        {renderPage()}
      </main>
      {showNewRequestsAlert && newPending.length > 0 && currentUser?.role === 'provider' && (
        <NewRequestAlert 
          requests={newPending}
          onClose={() => setShowNewRequestsAlert(false)}
          onView={() => {
            const first = newPending[0];
            setShowNewRequestsAlert(false);
            setCurrentPage('provider');
            try {
              window.dispatchEvent(new CustomEvent('mdac:viewRequest', { detail: { id: first.id } }));
            } catch (e) {}
          }}
        />
      )}
  {/* Vercel Web Analytics: rastreamento de page views */}
  <Analytics />
  </div>
  );
};

export default App;
