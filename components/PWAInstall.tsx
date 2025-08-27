import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar se já está instalado (modo standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    setIsInStandaloneMode(isStandalone);

    // Listener para o evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt automaticamente em dispositivos móveis após 3 segundos
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar prompt automaticamente se não estiver instalado
    if (iOS && !isStandalone && window.innerWidth <= 768) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Não mostrar novamente por 24 horas
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Não mostrar se já estiver instalado ou se foi dispensado recentemente
  if (isInStandaloneMode) return null;
  
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-brand-navy text-white p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <img 
              src="/marido-de-aluguel-carioca/assets/favicon-D5ikk5VV.png" 
              alt="Marido Carioca" 
              className="w-8 h-8 mr-3 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'public/assets/favicon.png';
              }}
            />
            <h3 className="font-semibold text-sm">Instalar Marido Carioca</h3>
          </div>
          
          {isIOS ? (
            <p className="text-xs mb-3">
              Toque em <span className="inline-block w-4 h-4 text-blue-400">⬆️</span> no Safari e selecione "Adicionar à Tela de Início"
            </p>
          ) : (
            <p className="text-xs mb-3">
              Instale nosso app para acesso rápido e melhor experiência!
            </p>
          )}
          
          <div className="flex gap-2">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="bg-brand-blue text-white px-3 py-1 rounded text-xs font-medium hover:bg-brand-muted-blue transition-colors"
              >
                Instalar
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-300 hover:text-white ml-2 text-lg leading-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PWAInstall;
