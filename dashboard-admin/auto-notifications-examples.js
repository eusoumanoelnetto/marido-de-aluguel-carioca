// EXEMPLO DE USO DO SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS
// =====================================================

// Como usar o sistema de notificações automáticas em outros arquivos do projeto

// 1. CORREÇÃO DE BUG
// Chame esta função quando um bug for corrigido
function exemploCorrecaoBug() {
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('bugfix', {
            description: 'problema no login que impedia alguns usuários de acessar',
            area: 'sistema de autenticação'
        });
    }
}

// 2. MELHORIA VISUAL
// Chame quando fizer mudanças visuais
function exemploMelhoriaVisual() {
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('visual', {
            area: 'painel do cliente',
            description: 'cores mais modernas e layout responsivo'
        });
    }
}

// 3. MELHORIA INTERNA
// Para otimizações que o usuário não vê diretamente
function exemploMelhoriaInterna() {
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('internal', {
            description: 'otimização do banco de dados para carregamento 50% mais rápido'
        });
    }
}

// 4. NOVA FUNCIONALIDADE
// Quando implementar uma nova função
function exemploNovaFuncionalidade() {
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('feature', {
            feature: 'Chat em tempo real',
            description: 'comunicação direta entre cliente e prestador'
        });
    }
}

// 5. ATUALIZAÇÃO DE LAYOUT
// Mudanças na organização e estrutura
function exemploAtualizacaoLayout() {
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('layout', {
            area: 'dashboard principal',
            description: 'nova organização dos menus e botões'
        });
    }
}

// 6. NOVO SERVIÇO
// Quando adicionar um novo tipo de serviço
function exemploNovoServico() {
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('service', {
            service: 'Instalação de Ar Condicionado',
            description: 'agora disponível em toda região metropolitana'
        });
    }
}

// EXEMPLO DE INTEGRAÇÃO COM SISTEMA DE DEPLOY
// ============================================

// Função que pode ser chamada após deploys automáticos
function notificarAposDeployAutomatico(tipoUpdate, detalhes) {
    // Aguardar 2 minutos após deploy para dar tempo do sistema estabilizar
    setTimeout(() => {
        if (typeof window.triggerAutoNotification === 'function') {
            window.triggerAutoNotification(tipoUpdate, detalhes);
        }
    }, 2 * 60 * 1000);
}

// EXEMPLO DE USO EM FORMULÁRIOS DE ADMIN
// =======================================

// Quando admin marcar uma correção como concluída
function aoMarcarBugCorrigido(bugId, descricao) {
    // Lógica para marcar bug como corrigido...
    
    // Disparar notificação automática
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('bugfix', {
            description: descricao,
            area: 'sistema geral'
        });
    }
}

// CONFIGURAÇÕES RECOMENDADAS
// ===========================

/* 
Para configurar o sistema pela primeira vez:

1. Acesse o Dashboard Admin > Notificações
2. Clique em "Configurar" nas Notificações Automáticas
3. Ative os tipos que deseja notificar automaticamente
4. Configure os templates de mensagem para cada tipo
5. Defina a frequência (recomendado: 1 por dia)
6. Escolha os destinatários padrão
7. Marque "Ativar sistema de notificações automáticas"
8. Salve as configurações

Tipos recomendados para ativar:
✅ Correção de Bugs (urgente)
✅ Novas Funcionalidades (urgente)
✅ Novos Serviços (urgente)
✅ Melhorias Visuais
⚠️ Melhorias Internas (opcional - pode ser muito técnico)
⚠️ Atualizações de Layout (opcional - pode confundir usuários)
*/

// EXEMPLOS DE TEMPLATES EFICAZES
// ===============================

const templateExemplos = {
    bugfix: "Corrigimos um problema que estava afetando [descrição]. Agora tudo está funcionando perfeitamente! 🔧",
    
    visual: "Atualizamos o visual do [área] para uma experiência mais moderna e intuitiva! ✨",
    
    internal: "Melhoramos a velocidade e estabilidade do sistema. Você vai notar uma experiência ainda melhor! ⚡",
    
    feature: "🎉 Nova funcionalidade: [nome da função]! Confira as novidades no seu painel.",
    
    layout: "Reorganizamos o [área] para facilitar o uso. Explore a nova organização! 📱",
    
    service: "🆕 Novo serviço: [nome do serviço]! Solicite agora mesmo através do seu painel."
};

// MONITORAMENTO E MÉTRICAS
// ========================

// Função para verificar estatísticas das notificações automáticas
function obterEstatisticasAutoNotificacoes() {
    const history = JSON.parse(localStorage.getItem('admin_notifications_history') || '[]');
    const autoNotifications = history.filter(notif => notif.isAutomatic);
    
    const stats = {
        total: autoNotifications.length,
        porTipo: {},
        ultimasSemana: 0
    };
    
    const umaSemanAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    autoNotifications.forEach(notif => {
        const tipo = notif.updateType || 'desconhecido';
        stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;
        
        if (new Date(notif.date).getTime() > umaSemanAtras) {
            stats.ultimasSemana++;
        }
    });
    
    return stats;
}

// DEBUGGING E TESTES
// ==================

// Função para testar notificações automáticas
function testarNotificacaoAutomatica() {
    if (typeof window.triggerAutoNotification === 'function') {
        window.triggerAutoNotification('feature', {
            feature: 'Sistema de Testes',
            description: 'funcionalidade de teste implementada com sucesso'
        });
        console.log('🧪 Notificação de teste disparada');
    } else {
        console.error('❌ Sistema de notificações automáticas não está disponível');
    }
}

// Para testar, execute no console do navegador:
// testarNotificacaoAutomatica();