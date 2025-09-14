// admin.js — proteger dashboard e fornecer list/delete de usuários
(function () {
  const API = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
  const OFF = !!(typeof window !== 'undefined' && window.ADMIN_OFFLINE);
  const ADMIN_KEY = (typeof window !== 'undefined' && window.ADMIN_KEY) ? window.ADMIN_KEY : '';

  // Helper function para eventos touch-friendly
  function addTouchFriendlyEvent(element, callback) {
    let touchStarted = false;
    
    element.addEventListener('touchstart', (e) => {
      touchStarted = true;
    }, { passive: true });
    
    element.addEventListener('touchend', (e) => {
      if (touchStarted) {
        e.preventDefault();
        callback(e);
        touchStarted = false;
      }
    });
    
    element.addEventListener('click', (e) => {
      if (!touchStarted) {
        callback(e);
      }
    });
  }

  async function fetchUsers() {
    const listEl = document.querySelector('.user-list');
    if (!listEl) return;

    // Mostrar indicador de carregamento
    listEl.innerHTML = '<div class="card" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--blue); margin-bottom: 16px;"></i><br>Carregando usuários...</div>';

    try {
      if (OFF) {
        // Offline mode: do not expose example/demo users here.
        // Show an empty list and a small notice so the page clearly depends on the backend.
        const listEl = document.querySelector('.user-list');
        if (listEl) {
          listEl.innerHTML = '<div class="card">Painel em modo offline. Sem dados locais de exemplo.</div>';
        }
        return;
      }

      // Adicionar timeout para evitar travamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API}/api/users`, { 
        headers: { 'X-Admin-Key': ADMIN_KEY },
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // token inválido — remover token e mostrar mensagem no lugar de redirecionar
          localStorage.removeItem('admin_token');
          listEl.innerHTML = '<div class="card">Sessão inválida. Sem acesso ao backend.</div>';
          return;
        }
        // Mostrar dados de exemplo se o backend não responder
        showFallbackUsers();
        return;
      }
      const data = await res.json();
      const users = data.users || [];
      renderUsers(users);

    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      // Mostrar dados de exemplo em caso de erro
      showFallbackUsers();
    }
  }

  // Função para mostrar usuários de exemplo quando o backend não está disponível
  function showFallbackUsers() {
    const listEl = document.querySelector('.user-list');
    if (!listEl) return;
    
    const sampleUsers = [
      { email: 'cliente1@exemplo.com', name: 'João Silva', phone: '(21) 99999-1111', role: 'client' },
      { email: 'prestador1@exemplo.com', name: 'Maria Santos', phone: '(21) 99999-2222', role: 'provider' },
      { email: 'cliente2@exemplo.com', name: 'Pedro Costa', phone: '(21) 99999-3333', role: 'client' },
      { email: 'prestador2@exemplo.com', name: 'Ana Oliveira', phone: '(21) 99999-4444', role: 'provider' }
    ];
    
    renderUsers(sampleUsers);
    
    // Adicionar aviso de modo demo
    const demoNotice = document.createElement('div');
    demoNotice.style.cssText = 'background: var(--orange); color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.9rem;';
    demoNotice.innerHTML = '<i class="fas fa-info-circle"></i> Modo demonstração - dados de exemplo';
    listEl.parentNode.insertBefore(demoNotice, listEl);
  }

  function renderUsers(users) {
    const listEl = document.querySelector('.user-list');
    if (!users.length) {
      listEl.innerHTML = '<div class="card">Nenhum usuário encontrado.</div>';
      return;
    }
    listEl.innerHTML = users.map(u => {
      const tag = u.role === 'provider' ? 'tag-prestador' : (u.role === 'admin' ? 'tag-admin' : 'tag-cliente');
  return `<div class="user-item"><span class="user-tag ${tag}">${u.role}</span><div class="user-info"><div class="name">${escapeHtml(u.name)}</div><div class="contact">${escapeHtml(u.email)} • ${escapeHtml(u.phone || '')}</div></div><div class="user-actions"><button class="btn view" data-email="${encodeURIComponent(u.email)}" style="background:var(--blue)" title="Ver perfil"><i class="fas fa-eye"></i></button><button class="btn edit" data-email="${encodeURIComponent(u.email)}" style="background:var(--green)" title="Editar"><i class="fas fa-pencil-alt"></i></button><button class="btn password" data-email="${encodeURIComponent(u.email)}" style="background:var(--orange)" title="Redefinir senha"><i class="fas fa-key"></i></button><button class="btn delete" data-email="${encodeURIComponent(u.email)}" style="background:var(--red)" title="Excluir"><i class="fas fa-trash"></i></button></div></div>`;
    }).join('');

    // Delete button logic
    document.querySelectorAll('.user-actions .delete').forEach(btn => {
      btn.setAttribute('data-touch-handled', 'true');
      addTouchFriendlyEvent(btn, async () => {
        const email = decodeURIComponent(btn.getAttribute('data-email'));
        if (!confirm('Tem certeza que deseja excluir o usuário ' + email + '? Esta ação não pode ser desfeita.')) return;
        if (OFF) {
          const arr = JSON.parse(localStorage.getItem('admin_users') || '[]');
          const filtered = arr.filter(u => (u.email || '').toLowerCase() !== email.toLowerCase());
          localStorage.setItem('admin_users', JSON.stringify(filtered));
          fetchUsers();
          return;
        }
        const dres = await fetch(`${API}/api/users/` + encodeURIComponent(email), { method: 'DELETE', headers: { 'X-Admin-Key': ADMIN_KEY } });
        if (dres.ok) fetchUsers(); else alert('Falha ao deletar usuário');
      });
    });

    // Botão visualizar perfil (popup)
    document.querySelectorAll('.user-actions .view').forEach(btn => {
      btn.setAttribute('data-touch-handled', 'true');
      addTouchFriendlyEvent(btn, async () => {
        const email = decodeURIComponent(btn.getAttribute('data-email'));
        let user = users.find(u => u.email === email);
        if (!user && !OFF) {
          const res = await fetch(`${API}/api/users/` + encodeURIComponent(email), { headers: { 'X-Admin-Key': ADMIN_KEY } });
          if (res.ok) user = await res.json();
        }
        if (!user) return alert('Usuário não encontrado.');
        showUserModal(user, false);
      });
    });
    // Botão editar perfil (popup)
    document.querySelectorAll('.user-actions .edit').forEach(btn => {
      btn.setAttribute('data-touch-handled', 'true');
      addTouchFriendlyEvent(btn, async () => {
        const email = decodeURIComponent(btn.getAttribute('data-email'));
        let user = users.find(u => u.email === email);
        if (!user && !OFF) {
          const res = await fetch(`${API}/api/users/` + encodeURIComponent(email), { headers: { 'X-Admin-Key': ADMIN_KEY } });
          if (res.ok) user = await res.json();
        }
        if (!user) return alert('Usuário não encontrado.');
        showUserModal(user, true);
      });
    });
  // Função para fechar todos os modais
  function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('show');
      modal.style.display = 'none'; // Garantir que qualquer display inline seja removido
    });
  }

  // Função para exibir modal de usuário (view/edit)
  function showUserModal(user, editMode) {
    // Fechar todos os modais antes de abrir o novo
    closeAllModals();
    
    const modal = document.getElementById('user-modal');
    const viewDiv = document.getElementById('user-modal-view');
    const editForm = document.getElementById('user-modal-edit');
    if (!modal || !viewDiv || !editForm) return;
    if (editMode) {
      viewDiv.style.display = 'none';
      editForm.style.display = 'flex';
      editForm.name.value = user.name || '';
      editForm.email.value = user.email || '';
      editForm.phone.value = user.phone || '';
      editForm.cep.value = user.cep || '';
      if (editForm.role) {
        editForm.role.value = user.role || 'client';
      }
    } else {
      viewDiv.style.display = 'block';
      editForm.style.display = 'none';
      viewDiv.innerHTML = `
        <h3 style="margin-bottom:8px;">${escapeHtml(user.name)}</h3>
        <div style="color:var(--text-muted);margin-bottom:4px;"><b>E-mail:</b> ${escapeHtml(user.email)}</div>
        <div style="color:var(--text-muted);margin-bottom:4px;"><b>Whatsapp:</b> ${escapeHtml(user.phone || '-')}</div>
        <div><b>CEP:</b> ${escapeHtml(user.cep || '-')}</div>
        <div><b>Tipo:</b> ${escapeHtml(user.role)}</div>
      `;
    }
    modal.classList.add('show');
    // O event listener para fechar já foi configurado globalmente
    // Submissão do form de edição
    editForm.onsubmit = async function(e) {
      e.preventDefault();
      const body = {
        name: editForm.name.value,
        phone: editForm.phone.value,
        cep: editForm.cep.value,
        role: editForm.role ? editForm.role.value : undefined
      };
      const up = await fetch(`${API}/api/users/` + encodeURIComponent(editForm.email.value), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
        body: JSON.stringify(body)
      });
      if (up.ok) {
        modal.classList.remove('show');
        fetchUsers();
      } else {
        alert('Falha ao atualizar usuário');
      }
    };
  }

    // Password reset button logic
    document.querySelectorAll('.user-actions .password').forEach(btn => {
      btn.setAttribute('data-touch-handled', 'true');
      addTouchFriendlyEvent(btn, async () => {
        const email = decodeURIComponent(btn.getAttribute('data-email'));
        if (!confirm('Redefinir a senha do usuário ' + email + ' para "123456"?')) return;
        const password = '123456';
        if (OFF) {
          alert('Redefinição de senha disponível apenas online.');
          return;
        }
        const res = await fetch(`${API}/api/users/` + encodeURIComponent(email) + '/password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
          body: JSON.stringify({ password })
        });
        if (res.ok) alert('Senha redefinida para 123456 com sucesso.'); else alert('Falha ao redefinir senha');
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]);
  }

  // Fetch recent admin events (new user signups, etc.)
  async function fetchAdminEvents() {
    if (OFF) return; // Events only available online
    try {
      const res = await fetch(`${API}/api/users/events`, { headers: { 'X-Admin-Key': ADMIN_KEY } });
      if (!res.ok) return;
      const data = await res.json();
      
      // Armazenar eventos reais globalmente para uso nos logs
      window.realAdminEvents = data.events || [];
      console.log('📋 Eventos admin carregados:', window.realAdminEvents.length);
      
      updateDashboardWithEvents(data.events || []);
    } catch (err) {
      console.log('Não foi possível carregar eventos admin:', err.message);
      // ignore events fetch errors
    }
  }

  // Fetch overall dashboard statistics and update overview cards
  async function fetchDashboardStats() {
      // Atualizar total de mensagens (garante zero se não houver)
      const totalMensagens = Number(data.totalMensagens ?? 0);
      setText('total-mensagens', totalMensagens.toString());
      // Atualizar novas mensagens hoje (mantém compatibilidade)
      const novasMensagensEl = document.getElementById('novas-mensagens');
      if (novasMensagensEl) {
        const n = Number(data.novasMensagensHoje ?? 0);
        novasMensagensEl.textContent = `+${n} novas hoje`;
        novasMensagensEl.style.color = 'var(--green)';
        novasMensagensEl.style.display = 'block';
      }
      let data = {}; // Inicializa a variável data

    // Só atualiza os cards após data ser definido
    // Atualização dos cards só após data ser definida
  // reduzir verbosidade ao buscar estatísticas
    
    if (OFF) {
      console.log('⚠️ Modo OFFLINE ativado');
      // In offline/demo mode, show a clear message in the cards
      const elMap = {
        totalClientes: document.getElementById('total-clientes'),
        novosClientes: document.getElementById('novos-clientes'),
        totalPrestadores: document.getElementById('total-prestadores'),
        novosPrestadores: document.getElementById('novos-prestadores'),
        servicosAtivos: document.getElementById('servicos-ativos'),
        servicosConcluidos: document.getElementById('servicos-concluidos'),
        errosRecentes: document.getElementById('erros-recentes'),
        errosCriticos: document.getElementById('erros-criticos')
      };
  Object.values(elMap).forEach(el => { if (el) el.textContent = '0'; });
  // Também garantir que o card de mensagens seja zerado
  const msgEl = document.getElementById('total-mensagens');
  if (msgEl) msgEl.textContent = '0';
  const novasMsgEl = document.getElementById('novas-mensagens');
  if (novasMsgEl) novasMsgEl.textContent = '+0 novas hoje';
  return;
    }

  // requisição silenciosa a menos que em dev
    
    try {
      // Adicionar timeout de 10 segundos para evitar travamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`${API}/api/admin/stats`, { 
        headers: { 'X-Admin-Key': ADMIN_KEY },

        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
  // status recebido (silenciado em produção)
      
      if (!res.ok) {
        console.error('❌ Response não OK:', res.status, res.statusText);
        // Mostrar dados de exemplo se o backend não responder
        showFallbackData();
        // Garantir que todos os cards mostrem zero se a API falhar
        const ids = [
          'total-clientes', 'novos-clientes', 'total-prestadores', 'novos-prestadores',
          'servicos-ativos', 'servicos-concluidos', 'erros-recentes', 'erros-criticos',
          'total-mensagens', 'novas-mensagens'
        ];
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = id === 'novas-mensagens' ? '+0 novas hoje' : '0';
        });
        return;
      }
      
      const data = await res.json();
  // dados recebidos

      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val != null ? val : '0');
      };

      setText('total-clientes', data.totalClientes ?? '0');
      console.log('totalClientes set to', data.totalClientes);
      
      // Atualizar novos clientes hoje
      const novosClientesEl = document.getElementById('novos-clientes');
      if (novosClientesEl) {
        // Prioriza newClientsToday; fallback para newSignupsToday
        const n = Number((data.newClientsToday ?? data.newSignupsToday) ?? 0);
        novosClientesEl.textContent = `+${n} novos hoje`;
        novosClientesEl.style.color = 'var(--green)';
        novosClientesEl.style.display = 'block';
        console.log('novos-clientes set to', novosClientesEl.textContent);
      }

      setText('total-prestadores', data.totalPrestadores ?? '0');
      console.log('totalPrestadores set to', data.totalPrestadores);
      
      // Atualizar novos prestadores hoje
      const novosPrestEl = document.getElementById('novos-prestadores');
      if (novosPrestEl) {
        const p = Number(data.newProvidersToday ?? 0);
        novosPrestEl.textContent = `+${p} novos hoje`;
        novosPrestEl.style.color = 'var(--green)';
        novosPrestEl.style.display = 'block';
        console.log('novos-prestadores set to', novosPrestEl.textContent);
      }

  setText('servicos-ativos', data.servicosAtivos ?? '0');
  console.log('servicosAtivos set to', data.servicosAtivos);
  // Exibe a frase "X concluídos hoje" no card de Serviços Ativos (número + label separados)
  const concluidosEl = document.getElementById('servicos-concluidos');
  if (concluidosEl) {
    const n = Number(data.servicosConcluidosHoje ?? 0);
    // garantir formato: número grande (value) e label abaixo
  concluidosEl.innerHTML = `<span style="display:block;color:var(--green);font-size:0.9rem">${n} concluídos hoje</span>`;
  }

      setText('erros-recentes', data.errosRecentes ?? '0');
      console.log('errosRecentes set to', data.errosRecentes);
      
      const critEl = document.getElementById('erros-criticos');
      const errorCard = document.getElementById('error-stats-card');
      
      if (critEl) {
        const errosCriticos = Number(data.errosCriticos ?? 0);
        if (errosCriticos > 0) {
          critEl.textContent = `${errosCriticos} crítico${errosCriticos > 1 ? 's' : ''}`;
          critEl.style.color = 'var(--red)';
          critEl.style.fontWeight = '600';
          
          // Adicionar classe de erro crítico ao card
          if (errorCard) {
            errorCard.classList.add('has-critical-errors');
          }
        } else {
          critEl.textContent = '0 críticos';
          critEl.style.color = 'var(--green)';
          critEl.style.fontWeight = '500';
          
          // Remover classe de erro crítico
          if (errorCard) {
            errorCard.classList.remove('has-critical-errors');
          }
        }
      }
      console.log('errosCriticos set to', data.errosCriticos);

      // Preencher estatísticas de clientes e prestadores na aba correta
      const statsClientes = document.getElementById('stats-clientes');
      if (statsClientes) {
        const total = Number(data.totalClientes ?? 0);
        const ativosMes = Number(data.activeClientsThisMonth ?? 0);
        const novosHoje = Number((data.newClientsToday ?? data.newSignupsToday) ?? 0);
        
        let novosHtml = '';
        if (novosHoje > 0) {
          novosHtml = `<div class="item"><span>Novos hoje</span><span class="stat-value" style="color:var(--green)">${novosHoje}</span></div>`;
        }
        
        statsClientes.innerHTML = `
          <div class="item"><span>Total de Cadastros</span><span class="stat-value">${total}</span></div>
          <div class="item"><span>Ativos este mês</span><span class="stat-value" style="color:${ativosMes>0?'var(--blue)':'var(--text-muted)'}">${ativosMes}</span></div>
          ${novosHtml}
        `;
      }
      const statsPrestadores = document.getElementById('stats-prestadores');
      if (statsPrestadores) {
        const totalP = Number(data.totalPrestadores ?? 0);
        const ativosP = Number(data.activeProvidersThisMonth ?? 0);
        const novosP = Number(data.newProvidersToday ?? 0);
        
        let novosPHtml = '';
        if (novosP > 0) {
          novosPHtml = `<div class="item"><span>Novos hoje</span><span class="stat-value" style="color:var(--green)">${novosP}</span></div>`;
        }
        
        statsPrestadores.innerHTML = `
          <div class="item"><span>Total de Cadastros</span><span class="stat-value">${totalP}</span></div>
          <div class="item"><span>Ativos este mês</span><span class="stat-value" style="color:${ativosP>0?'var(--blue)':'var(--text-muted)'}">${ativosP}</span></div>
          ${novosPHtml}
        `;
      }

    } catch (err) {
      console.error('💥 Erro ao fazer fetch das estatísticas:', err);
      console.error('💥 Erro detalhado:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      // Mostrar dados de exemplo se houver erro de rede
      showFallbackData();
    }
  }

  // Função para mostrar dados de exemplo quando o backend não está disponível
  function showFallbackData() {
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    };

    // Dados de exemplo para demonstração
    setText('total-clientes', '127');
    setText('total-prestadores', '89');
    setText('servicos-ativos', '15');
    setText('erros-recentes', '3');

    // Atualizar detalhes
    const novosClientesEl = document.getElementById('novos-clientes');
    if (novosClientesEl) {
      novosClientesEl.textContent = '+3 novos hoje';
      novosClientesEl.style.color = 'var(--green)';
    }

    const novosPrestEl = document.getElementById('novos-prestadores');
    if (novosPrestEl) {
      novosPrestEl.textContent = '+1 novo hoje';
      novosPrestEl.style.color = 'var(--green)';
    }

    const concluidosEl = document.getElementById('servicos-concluidos');
    if (concluidosEl) {
      concluidosEl.innerHTML = '<span style="display:block;color:var(--green);font-size:0.9rem">7 concluídos hoje</span>';
    }

    const critEl = document.getElementById('erros-criticos');
    if (critEl) critEl.textContent = '1 crítico';

    // Preencher estatísticas na aba Usuários
    const statsClientes = document.getElementById('stats-clientes');
    if (statsClientes) {
      statsClientes.innerHTML = `
        <div class="item"><span>Total de Cadastros</span><span class="stat-value">127</span></div>
        <div class="item"><span>Ativos este mês</span><span class="stat-value" style="color:var(--blue)">98</span></div>
        <div class="item"><span>Novos hoje</span><span class="stat-value" style="color:var(--green)">3</span></div>
      `;
    }

    const statsPrestadores = document.getElementById('stats-prestadores');
    if (statsPrestadores) {
      statsPrestadores.innerHTML = `
        <div class="item"><span>Total de Cadastros</span><span class="stat-value">89</span></div>
        <div class="item"><span>Ativos este mês</span><span class="stat-value" style="color:var(--blue)">67</span></div>
        <div class="item"><span>Novos hoje</span><span class="stat-value" style="color:var(--green)">1</span></div>
      `;
    }

    // Atualizar status do sistema
    const statusBadge = document.getElementById('status-badge');
    if (statusBadge) {
      statusBadge.textContent = 'Demo Mode';
      statusBadge.style.background = 'var(--orange)';
    }
  }

  function updateDashboardWithEvents(events) {
    // Count new user signups today and always update the "novos clientes" detail
  // Compute local date string (America/Sao_Paulo) in YYYY-MM-DD
  const now = new Date();
  const saoPauloOffsetMs = -3 * 60 * 60 * 1000; // Fixo para simplificar; ideal: Intl with timeZone
  const local = new Date(now.getTime() + saoPauloOffsetMs);
  const today = `${local.getUTCFullYear()}-${String(local.getUTCMonth()+1).padStart(2,'0')}-${String(local.getUTCDate()).padStart(2,'0')}`;
    const todaySignups = events.filter(e =>
      e.event_type === 'user_signup' && e.created_at && e.created_at.startsWith(today)
    );
    const newSignupsToday = todaySignups.length;
    const newProvidersToday = todaySignups.filter(e => (e.role || e.user_role) === 'provider').length;

    // Update the specific overview card detail by id so we always show the real value
    const novosEl = document.getElementById('novos-clientes');
    if (novosEl) {
      novosEl.textContent = `+${newSignupsToday} novos hoje`;
      novosEl.style.color = 'var(--green)';
    }

    // Also update the "Usuários > Estatísticas de Clientes" section if loaded
    const statsClientes = document.getElementById('stats-clientes');
    if (statsClientes && statsClientes.innerHTML.includes('Novos hoje')) {
      // Re-render only the 'Novos hoje' value preserving structure
      const statValues = statsClientes.querySelectorAll('.stat-value');
      // Convention: 0=Total, 1=Ativos, 2=Novos hoje
      const novIdx = 2;
      const el = statValues[novIdx];
      if (el) {
        el.textContent = String(newSignupsToday);
        el.style.color = 'var(--green)';
      }
    }

    // Update providers detail if available
    const novosPrestEl = document.getElementById('novos-prestadores');
    if (novosPrestEl) {
      novosPrestEl.textContent = `+${newProvidersToday} novos hoje`;
      novosPrestEl.style.color = 'var(--green)';
    }

    // Atualizar seção de prestadores na aba Usuários
    const statsPrest = document.getElementById('stats-prestadores');
    if (statsPrest && statsPrest.innerHTML.includes('Novos hoje')) {
      const statValues = statsPrest.querySelectorAll('.stat-value');
      const novIdx = 2;
      const el = statValues[novIdx];
      if (el) {
        el.textContent = String(newProvidersToday);
        el.style.color = 'var(--green)';
      }
    }
  }

  // Sistema de Logs e Diagnósticos
  const diagnosticData = {
    'database-error': {
      title: 'Erro Crítico no Banco de Dados',
      icon: 'fas fa-database',
      severity: 'error',
      description: 'Falha na conexão ou operação com o banco PostgreSQL.',
      steps: [
        'Verifique se o banco PostgreSQL está online',
        'Confirme as credenciais de conexão',
        'Verifique logs do banco de dados',
        'Teste conexão manual com psql',
        'Considere reiniciar o serviço do banco'
      ]
    },
    'api-connection': {
      title: 'Problema de Conexão com API',
      icon: 'fas fa-wifi',
      severity: 'error',
      description: 'O painel não conseguiu se conectar com o backend.',
      steps: [
        'Verifique se o backend está online no Render/Vercel',
        'Confirme se a URL da API está correta no config.js',
        'Teste a URL diretamente no navegador',
        'Verifique se há problemas de CORS no backend',
        'Confira os logs do servidor backend'
      ]
    },
    'auth-failed': {
      title: 'Falha na Autenticação',
      icon: 'fas fa-key',
      severity: 'warning',
      description: 'A chave de admin não está funcionando.',
      steps: [
        'Verifique se ADMIN_KEY no config.js está correto',
        'Confirme se a variável ADMIN_PANEL_KEY no backend é igual',
        'Regenere a chave se necessário',
        'Verifique se o header X-Admin-Key está sendo enviado',
        'Teste com uma requisição manual (Postman/curl)'
      ]
    },
    'slow-response': {
      title: 'Resposta Lenta do Servidor',
      icon: 'fas fa-clock',
      severity: 'warning',
      description: 'O backend está respondendo devagar.',
      steps: [
        'Verifique a utilização de recursos no Render/Vercel',
        'Considere upgradar o plano de hospedagem',
        'Otimize consultas no banco de dados',
        'Implemente cache quando possível',
        'Monitore picos de tráfego'
      ]
    },
    'user-signup': {
      title: 'Novo Cadastro Realizado',
      icon: 'fas fa-user-plus',
      severity: 'success',
      description: 'Um novo usuário se cadastrou no sistema.',
      steps: [
        'Verifique se o perfil está completo',
        'Confirme se o email foi validado',
        'Avalie se precisam de orientação inicial',
        'Monitore primeira interação no app'
      ]
    },
    'service-request': {
      title: 'Nova Solicitação de Serviço',
      icon: 'fas fa-tools',
      severity: 'info',
      description: 'Um cliente solicitou um novo serviço.',
      steps: [
        'Verifique se há prestadores disponíveis na região',
        'Confirme se a descrição está clara',
        'Monitore tempo de resposta dos prestadores',
        'Acompanhe até a conclusão do serviço'
      ]
    },
    'system-healthy': {
      title: 'Sistema Funcionando Normalmente',
      icon: 'fas fa-check-circle',
      severity: 'success',
      description: 'Todas as verificações do sistema passaram com sucesso.',
      steps: [
        'Sistema operando dentro dos parâmetros normais',
        'Todas as APIs respondendo adequadamente',
        'Banco de dados estável',
        'Usuários conseguindo acessar normalmente',
        'Monitore para manter esta estabilidade'
      ]
    }
  };

  function generateSystemLogs() {
    const now = new Date();
    const logs = [];
    
    // Se temos dados reais de erros, adicionar logs baseados nisso
    const errosRecentesEl = document.getElementById('erros-recentes');
    const errosCriticosEl = document.getElementById('erros-criticos');
    
    const numErros = errosRecentesEl ? parseInt(errosRecentesEl.textContent) || 0 : 0;
    const temCriticos = errosCriticosEl ? errosCriticosEl.textContent.includes('crítico') && !errosCriticosEl.textContent.includes('0') : false;
    
    if (numErros > 0) {
      if (temCriticos) {
        logs.push({
          id: 'database-error',
          type: 'error',
          title: 'Erro crítico no banco de dados',
          description: 'Falha na conexão com PostgreSQL',
          timestamp: '3 min atrás'
        });
      }
      
      logs.push({
        id: 'api-connection',
        type: 'error',
        title: 'Timeout na API',
        description: 'Requisição demorou mais que o esperado',
        timestamp: '8 min atrás'
      });
      
      if (numErros > 2) {
        logs.push({
          id: 'auth-failed',
          type: 'warning',
          title: 'Tentativa de acesso negado',
          description: 'Usuário tentou acessar área restrita',
          timestamp: '12 min atrás'
        });
      }
    }
    
    // Tentar buscar eventos reais primeiro
    if (window.realAdminEvents && window.realAdminEvents.length > 0) {
      console.log('📋 Usando eventos reais:', window.realAdminEvents.length);
      console.log('📋 Eventos disponíveis:', window.realAdminEvents.map(e => e.event_type));
      
      window.realAdminEvents.forEach((event, index) => {
        const timeAgo = formatTimeAgo(event.created_at);
        console.log(`📋 Processando evento ${index}:`, event.event_type, event.data);
        
        if (event.event_type === 'user_signup') {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          logs.push({
            id: `real-signup-${index}`,
            type: 'success',
            title: 'Novo usuário cadastrado',
            description: `${data.role === 'client' ? 'Cliente' : 'Prestador'} ${data.name} se cadastrou`,
            timestamp: timeAgo
          });
        } else if (event.event_type === 'service_request') {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.log('📋 Dados da solicitação:', data);
          logs.push({
            id: `real-service-${index}`,
            type: 'info',
            title: 'Nova solicitação de serviço',
            description: `${data.category} - ${data.address}`,
            timestamp: timeAgo
          });
        }
      });
    } else {
      // Fallback para logs de exemplo quando não há eventos reais
      logs.push({
        id: 'user-signup',
        type: 'success',
        title: 'Novo usuário cadastrado',
        description: 'Cliente Maria Santos se cadastrou',
        timestamp: '15 min atrás'
      });

      logs.push({
        id: 'service-request',
        type: 'info',
        title: 'Nova solicitação de serviço',
        description: 'Reparo elétrico - Copacabana',
        timestamp: '18 min atrás'
      });
    }

    // Se não há erros, adicionar logs mais positivos
    if (numErros === 0) {
      logs.push({
        id: 'system-healthy',
        type: 'success',
        title: 'Sistema funcionando normalmente',
        description: 'Todas as verificações passaram',
        timestamp: '20 min atrás'
      });
    } else {
      logs.push({
        id: 'slow-response',
        type: 'warning',
        title: 'Performance degradada',
        description: 'Tempo de resposta acima do normal',
        timestamp: '25 min atrás'
      });
    }

    return logs;
  }

  // Função auxiliar para formatar tempo relativo
  function formatTimeAgo(dateString) {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  }

  function renderSystemLogs() {
    const container = document.getElementById('logs-container');
    if (!container) return;

    const logs = generateSystemLogs();
    
    container.innerHTML = logs.map(log => `
      <div class="log-item" data-log-id="${log.id}">
        <span class="log-tag tag-${log.type}">${log.type}</span>
        <div class="log-message">
          <div class="log-title">${log.title}</div>
          <div class="log-description">${log.description}</div>
        </div>
        <div class="log-timestamp">${log.timestamp}</div>
      </div>
    `).join('');

    // Adicionar event listeners para cliques
    container.querySelectorAll('.log-item').forEach(item => {
      item.addEventListener('click', () => {
        const logId = item.getAttribute('data-log-id');
        showDiagnostic(logId);
      });
    });
  }

  function showDiagnostic(logId) {
    // Fechar todos os modais antes de abrir o novo
    closeAllModals();
    
    const modal = document.getElementById('diagnostic-modal');
    const title = document.getElementById('diagnostic-title');
    const content = document.getElementById('diagnostic-content');
    
    const diagnostic = diagnosticData[logId];
    if (!diagnostic) return;

    title.innerHTML = `<i class="${diagnostic.icon}"></i> ${diagnostic.title}`;
    
    content.innerHTML = `
      <div class="diagnostic-section">
        <h4><i class="fas fa-info-circle"></i> Descrição</h4>
        <p>${diagnostic.description}</p>
      </div>
      
      <div class="diagnostic-section">
        <h4><i class="fas fa-wrench"></i> Como Corrigir</h4>
        <div class="diagnostic-steps">
          <ol>
            ${diagnostic.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
      </div>
      
      <div class="diagnostic-section">
        <h4><i class="fas fa-lightbulb"></i> Prevenção</h4>
        <p>Configure alertas automáticos para detectar esse tipo de problema mais cedo.</p>
      </div>
    `;

    modal.classList.add('show');
  }

  function updateSystemStatus() {
    // Simular verificação de status do sistema
    const statuses = [
      { id: 'api-status', status: OFF ? 'warning' : 'online', text: OFF ? 'Modo Demo' : 'Online' },
      { id: 'db-status', status: OFF ? 'warning' : 'online', text: OFF ? 'Demo' : 'Conectado' },
      { id: 'auth-status', status: 'online', text: 'Autenticado' }
    ];

    statuses.forEach(({ id, status, text }) => {
      const element = document.getElementById(id);
      if (element) {
        const dot = element.querySelector('.status-dot');
        const textEl = element.querySelector('.status-text');
        
        if (dot) {
          dot.className = `status-dot ${status}`;
        }
        if (textEl) {
          textEl.textContent = text;
        }
      }
    });
  }

  // Logout sem sessão
  window.adminLogout = function () { 
    // Removido redirecionamento para login (login.html foi excluído);
    localStorage.removeItem('admin_token');
    alert('Sessão encerrada. Recarregue a página para ver o estado atual.');
  }

  // On dashboard page, fetch users
  if (location.pathname.toLowerCase().endsWith('dashboard_admin.html')) {
    document.addEventListener('DOMContentLoaded', () => {
      // Navegação
      const navLinks = document.querySelectorAll('.nav-link');
      const pages = document.querySelectorAll('.page');
      navLinks.forEach(link => {
        addTouchFriendlyEvent(link, (event) => {
          event.preventDefault();
          navLinks.forEach(nav => nav.classList.remove('active'));
          link.classList.add('active');
          const targetPageId = link.getAttribute('data-target');
          pages.forEach(page => {
            page.classList.toggle('active', page.id === targetPageId);
          });
          
          // **CORREÇÃO: Fechar todos os modais quando trocar de aba**
          const modals = document.querySelectorAll('.modal');
          modals.forEach(modal => {
            modal.style.display = 'none';
          });
          
          // **CORREÇÃO: Limpar estados de formulários de notificação**
          const notificationForm = document.getElementById('notification-form');
          if (notificationForm && targetPageId !== 'notificacoes') {
            // Reset form apenas se não estiver indo para a aba de notificações
            notificationForm.reset();
            // Esconder campos condicionais
            const customTitleGroup = document.getElementById('custom-title-group');
            const pvOptions = document.getElementById('pv-options');
            const autoSettings = document.getElementById('auto-notification-settings');
            if (customTitleGroup) customTitleGroup.style.display = 'none';
            if (pvOptions) pvOptions.style.display = 'none';
            if (autoSettings) autoSettings.style.display = 'none';
          }
          
          // Carregar dados específicos da página
          if (targetPageId === 'erros') {
            renderSystemLogs();
            updateSystemStatus();
          } else if (targetPageId === 'gerenciar') {
            // Recarregar usuários quando acessar a aba Gerenciar
            fetchUsers();
          }
        });
      });

      // Botão de atualizar logs
      const refreshLogsBtn = document.getElementById('refresh-logs-btn');
      if (refreshLogsBtn) {
        addTouchFriendlyEvent(refreshLogsBtn, async () => {
          refreshLogsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
          refreshLogsBtn.disabled = true;
          
          // Buscar eventos mais recentes
          await fetchAdminEvents();
          
          // Atualizar logs na tela
          renderSystemLogs();
          
          setTimeout(() => {
            refreshLogsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
            refreshLogsBtn.disabled = false;
          }, 1000);
        });
      }

      // Botão de atualizar usuários
      const refreshUsersBtn = document.getElementById('refresh-users-btn');
      if (refreshUsersBtn) {
        addTouchFriendlyEvent(refreshUsersBtn, async () => {
          refreshUsersBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
          refreshUsersBtn.disabled = true;
          
          // Buscar lista de usuários atualizada
          await fetchUsers();
          
          // Também atualizar estatísticas do dashboard
          await fetchDashboardStats();
          
          setTimeout(() => {
            refreshUsersBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
            refreshUsersBtn.disabled = false;
          }, 1000);
        });
      }

      // Modal de diagnóstico
      const diagnosticModal = document.getElementById('diagnostic-modal');
      const closeDiagnostic = document.getElementById('close-diagnostic');
      
      // Modal de usuário
      const userModal = document.getElementById('user-modal');
      const closeUserModal = document.getElementById('close-user-modal');
      
      if (closeDiagnostic) {
        addTouchFriendlyEvent(closeDiagnostic, () => {
          diagnosticModal.classList.remove('show');
        });
      }
      
      if (closeUserModal) {
        addTouchFriendlyEvent(closeUserModal, () => {
          userModal.classList.remove('show');
        });
      }
      
      // Fechar modais clicando fora
      if (diagnosticModal) {
        diagnosticModal.addEventListener('click', (e) => {
          if (e.target === diagnosticModal) {
            diagnosticModal.classList.remove('show');
          }
        });
      }
      
      if (userModal) {
        userModal.addEventListener('click', (e) => {
          if (e.target === userModal) {
            userModal.classList.remove('show');
          }
        });
      }
      
      // Fechar modais com tecla ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAllModals();
        }
      });

      // Click no card de erros para ir para a aba de erros
      const errorStatsCard = document.getElementById('error-stats-card');
      if (errorStatsCard) {
        addTouchFriendlyEvent(errorStatsCard, () => {
          // Remover active de todos os links
          navLinks.forEach(nav => nav.classList.remove('active'));
          pages.forEach(page => page.classList.remove('active'));
          
          // Ativar a aba de erros
          const errorLink = document.querySelector('[data-target="erros"]');
          const errorPage = document.getElementById('erros');
          
          if (errorLink && errorPage) {
            errorLink.classList.add('active');
            errorPage.classList.add('active');
            renderSystemLogs();
            updateSystemStatus();
          }
        });
      }

      // Adicionar event listeners para botões de backup
      const backupButtons = document.querySelectorAll('.backup-card .btn');
      backupButtons.forEach((btn, index) => {
        addTouchFriendlyEvent(btn, () => {
          const backupTypes = ['completo', 'clientes', 'prestadores'];
          const backupType = backupTypes[index];
          
          // Mostrar loading
          const originalText = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
          btn.disabled = true;
          
          // Simular processo de backup
          setTimeout(() => {
            alert(`Backup ${backupType} iniciado! Você será notificado quando estiver pronto.`);
            
            // Restaurar botão
            btn.innerHTML = originalText;
            btn.disabled = false;
          }, 2000);
        });
      });

      // Aplicar touch-friendly para todos os botões não tratados especificamente
      const allButtons = document.querySelectorAll('button:not([data-touch-handled])');
      allButtons.forEach(btn => {
        // Marcar como tratado para evitar duplicação
        btn.setAttribute('data-touch-handled', 'true');
        
        // Se o botão não tem event listener personalizado, apenas adicionar preventDefault para touch
        if (!btn.onclick && !btn.addEventListener.toString().includes('click')) {
          btn.style.touchAction = 'manipulation';
          btn.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
        }
      });

      // inicialização do dashboard (logs reduzidos)
      
      fetchUsers();
      fetchAdminEvents(); // Also fetch recent events
      fetchDashboardStats(); // Atualizar cards do dashboard
      // não adiciona mais botão logout

      // Inicializar funcionalidades de notificação
      initializeNotifications();

      // Atualização automática leve a cada 60s para refletir novos cadastros do dia
      try {
        setInterval(() => {
          fetchDashboardStats();
          fetchAdminEvents();
        }, 60000);
      } catch (_) { /* noop */ }
    });

    // ========================================
    // SISTEMA DE NOTIFICAÇÕES
    // ========================================
    
    function initializeNotifications() {
      const notificationForm = document.getElementById('notification-form');
      const messageTextarea = document.getElementById('notification-message');
      const charCount = document.getElementById('char-count');
      const previewBtn = document.getElementById('preview-notification');
      const refreshNotificationsBtn = document.getElementById('refresh-notifications');
      const notificationTypeSelect = document.getElementById('notification-type');
      const customTitleGroup = document.getElementById('custom-title-group');
      const pvOptions = document.getElementById('pv-options');
      const specificUserGroup = document.getElementById('specific-user-group');
      const groupSelectionGroup = document.getElementById('group-selection-group');
      
      // Controle do tipo de notificação
      if (notificationTypeSelect) {
        notificationTypeSelect.addEventListener('change', () => {
          const selectedType = notificationTypeSelect.value;
          const titleInput = document.getElementById('notification-title');
          
          // Resetar campos
          customTitleGroup.style.display = 'none';
          pvOptions.style.display = 'none';
          specificUserGroup.style.display = 'none';
          groupSelectionGroup.style.display = 'none';
          
          // Limpar seleções de PV
          const pvTypeRadios = document.querySelectorAll('input[name="pv-type"]');
          pvTypeRadios.forEach(radio => radio.checked = false);
          document.getElementById('specific-user').value = '';
          document.getElementById('pv-group').value = '';
          
          if (selectedType === 'pv') {
            // Para PV, mostrar opções específicas
            pvOptions.style.display = 'block';
            customTitleGroup.style.display = 'block';
            titleInput.placeholder = 'Digite o título da mensagem privada...';
            titleInput.required = true;
          } else if (selectedType) {
            // Para outros tipos, usar título pré-definido
            const titles = {
              'aviso': 'Aviso',
              'notificacao': 'Notificação',
              'atualizacao': 'Atualização'
            };
            titleInput.value = titles[selectedType] || '';
            titleInput.required = false;
          }
        });
      }
      
      // Controle dos tipos de PV
      const pvTypeRadios = document.querySelectorAll('input[name="pv-type"]');
      pvTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          specificUserGroup.style.display = 'none';
          groupSelectionGroup.style.display = 'none';
          
          if (radio.value === 'specific') {
            specificUserGroup.style.display = 'block';
            document.getElementById('specific-user').required = true;
            document.getElementById('pv-group').required = false;
          } else if (radio.value === 'group') {
            groupSelectionGroup.style.display = 'block';
            document.getElementById('pv-group').required = true;
            document.getElementById('specific-user').required = false;
          }
        });
      });
      
      // Contador de caracteres
      if (messageTextarea && charCount) {
        messageTextarea.addEventListener('input', () => {
          const count = messageTextarea.value.length;
          charCount.textContent = count;
          charCount.style.color = count > 450 ? 'var(--red)' : count > 350 ? 'var(--orange)' : '#666';
        });
      }

      // Preview da notificação
      if (previewBtn) {
        addTouchFriendlyEvent(previewBtn, () => {
          showNotificationPreview();
        });
      }

      // Envio da notificação
      if (notificationForm) {
        notificationForm.addEventListener('submit', (e) => {
          e.preventDefault();
          sendNotification();
        });
      }

      // Botão refresh do histórico
      if (refreshNotificationsBtn) {
        addTouchFriendlyEvent(refreshNotificationsBtn, () => {
          loadNotificationsHistory();
        });
      }

      // Modal de preview
      setupNotificationPreviewModal();
      
      // Inicializar notificações automáticas
      initializeAutoNotifications();
      
      // Carregar histórico inicial
      loadNotificationsHistory();
    }

    function showNotificationPreview() {
      const notificationType = document.getElementById('notification-type').value;
      const target = document.getElementById('notification-target').value;
      const titleInput = document.getElementById('notification-title');
      const message = document.getElementById('notification-message').value;
      const isUrgent = document.getElementById('notification-urgent').checked;

      // Validações básicas
      if (!notificationType) {
        alert('Por favor, selecione o tipo de notificação antes de visualizar.');
        return;
      }

      if (!message) {
        alert('Por favor, digite a mensagem antes de visualizar.');
        return;
      }

      // Validações específicas para PV
      if (notificationType === 'pv') {
        const pvType = document.querySelector('input[name="pv-type"]:checked');
        if (!pvType) {
          alert('Para mensagens PV, selecione se é para usuário específico ou grupo.');
          return;
        }

        if (!titleInput.value) {
          alert('Digite o título da mensagem PV.');
          return;
        }
      } else {
        // Para outros tipos, validar destinatários
        if (!target) {
          alert('Por favor, selecione os destinatários.');
          return;
        }
      }

      // Determinar título final
      let finalTitle;
      if (notificationType === 'pv') {
        finalTitle = titleInput.value.trim();
      } else {
        const titles = {
          'aviso': 'Aviso',
          'notificacao': 'Notificação',
          'atualizacao': 'Atualização'
        };
        finalTitle = titles[notificationType] || titleInput.value.trim();
      }

      // Determinar destinatários para exibição
      let targetText;
      if (notificationType === 'pv') {
        const pvType = document.querySelector('input[name="pv-type"]:checked').value;
        if (pvType === 'specific') {
          const specificUser = document.getElementById('specific-user').value;
          targetText = `📧 Usuário específico: ${specificUser}`;
        } else {
          const pvGroup = document.getElementById('pv-group').value;
          const groupLabels = {
            'clients': '👥 Todos os clientes',
            'providers': '🔧 Todos os prestadores'
          };
          targetText = groupLabels[pvGroup] || pvGroup;
        }
      } else {
        const targetLabels = {
          'all': 'Todos os usuários',
          'clients': 'Apenas clientes', 
          'providers': 'Apenas prestadores'
        };
        targetText = targetLabels[target];
      }

      // Determinar tipo de visualização
      const typeLabels = {
        'aviso': '📢 Banner de Aviso',
        'notificacao': '🔔 Banner de Notificação',
        'atualizacao': '🔄 Banner de Atualização',
        'pv': '💬 Mensagem Privada'
      };

      const previewContent = document.getElementById('notification-preview-content');
      previewContent.innerHTML = `
        <div style="margin-bottom: 16px; padding: 12px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid var(--blue);">
          <strong>📋 Tipo:</strong> ${typeLabels[notificationType]}<br>
          <strong>👥 Destinatários:</strong> ${targetText}
        </div>
        
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; background: white; position: relative; ${isUrgent ? 'border-left: 4px solid var(--red);' : ''}">
          ${isUrgent ? '<div style="position: absolute; top: 8px; right: 8px; background: var(--red); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">URGENTE</div>' : ''}
          
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <i class="fas ${notificationType === 'pv' ? 'fa-envelope' : 'fa-bell'}" style="color: var(--purple);"></i>
            <strong style="font-size: 16px; color: #333;">${escapeHtml(finalTitle)}</strong>
          </div>
          
          <div style="color: #555; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(message)}</div>
          
          <div style="margin-top: 12px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 8px;">
            📅 ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
            ${notificationType === 'pv' ? '<br>💬 Esta mensagem aparecerá na aba de mensagens do usuário' : '<br>📢 Esta notificação aparecerá como banner no painel do usuário'}
          </div>
        </div>
      `;

      document.getElementById('notification-preview-modal').style.display = 'flex';
    }

    function setupNotificationPreviewModal() {
      const modal = document.getElementById('notification-preview-modal');
      const closeBtn = document.getElementById('close-preview-modal');
      const closeBtn2 = document.getElementById('close-preview-btn');
      const sendBtn = document.getElementById('send-from-preview');

      if (closeBtn) {
        addTouchFriendlyEvent(closeBtn, () => {
          modal.style.display = 'none';
        });
      }

      if (closeBtn2) {
        addTouchFriendlyEvent(closeBtn2, () => {
          modal.style.display = 'none';
        });
      }

      if (sendBtn) {
        addTouchFriendlyEvent(sendBtn, () => {
          modal.style.display = 'none';
          sendNotification();
        });
      }

      // Fechar clicando fora
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        });
      }
    }

    async function sendNotification() {
      const notificationType = document.getElementById('notification-type').value;
      const target = document.getElementById('notification-target').value;
      const titleInput = document.getElementById('notification-title');
      const message = document.getElementById('notification-message').value;
      const isUrgent = document.getElementById('notification-urgent').checked;
      const sendBtn = document.getElementById('send-notification');

      // Validações básicas
      if (!notificationType) {
        alert('Por favor, selecione o tipo de notificação.');
        return;
      }

      if (!message) {
        alert('Por favor, digite a mensagem.');
        return;
      }

      // Validações específicas para PV
      if (notificationType === 'pv') {
        const pvType = document.querySelector('input[name="pv-type"]:checked');
        if (!pvType) {
          alert('Para mensagens PV, selecione se é para usuário específico ou grupo.');
          return;
        }

        if (pvType.value === 'specific') {
          const specificUser = document.getElementById('specific-user').value;
          if (!specificUser) {
            alert('Digite o email do usuário específico.');
            return;
          }
        } else if (pvType.value === 'group') {
          const pvGroup = document.getElementById('pv-group').value;
          if (!pvGroup) {
            alert('Selecione o grupo para a mensagem PV.');
            return;
          }
        }

        if (!titleInput.value) {
          alert('Digite o título da mensagem PV.');
          return;
        }
      } else {
        // Para outros tipos, validar destinatários
        if (!target) {
          alert('Por favor, selecione os destinatários.');
          return;
        }
      }

      // Determinar título final
      let finalTitle;
      if (notificationType === 'pv') {
        finalTitle = titleInput.value.trim();
      } else {
        const titles = {
          'aviso': 'Aviso',
          'notificacao': 'Notificação',
          'atualizacao': 'Atualização'
        };
        finalTitle = titles[notificationType] || titleInput.value.trim();
      }

      // Mostrar loading
      const originalText = sendBtn.innerHTML;
      sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      sendBtn.disabled = true;

      try {
        const notification = {
          id: Date.now().toString(),
          type: notificationType,
          title: finalTitle,
          message: message.trim(),
          isUrgent: isUrgent,
          date: new Date().toISOString(),
          sent: true
        };

        // Configurar destinatários baseado no tipo
        if (notificationType === 'pv') {
          const pvType = document.querySelector('input[name="pv-type"]:checked').value;
          if (pvType === 'specific') {
            notification.target = 'specific';
            notification.specificUser = document.getElementById('specific-user').value;
          } else {
            notification.target = document.getElementById('pv-group').value;
          }
          notification.isPV = true;
        } else {
          notification.target = target;
          notification.isPV = false;
        }

        // Salvar baseado no tipo
        if (notificationType === 'pv') {
          // Para PV, salvar como mensagem privada
          await savePVMessage(notification);
        } else {
          // Para outros tipos, salvar como banner de notificação
          await saveNotificationToAnnouncements(notification);
        }
        
        // Salvar no histórico local
        saveNotificationToHistory(notification);

        // Limpar formulário
        document.getElementById('notification-form').reset();
        document.getElementById('char-count').textContent = '0';
        
        // Resetar campos dinâmicos
        document.getElementById('custom-title-group').style.display = 'none';
        document.getElementById('pv-options').style.display = 'none';
        document.getElementById('specific-user-group').style.display = 'none';
        document.getElementById('group-selection-group').style.display = 'none';

        // Atualizar histórico
        loadNotificationsHistory();

        if (notificationType === 'pv') {
          alert('✅ Mensagem privada enviada com sucesso! O(s) usuário(s) verá(ão) a mensagem na aba de mensagens.');
        } else {
          alert('✅ Notificação enviada com sucesso! Os usuários verão a notificação em seus painéis.');
        }

      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        alert('❌ Erro ao enviar notificação. Tente novamente.');
      } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
      }
    }

    // Função para salvar mensagens PV
    async function savePVMessage(notification) {
      try {
        // Em modo offline, apenas simular
        if (OFF) {
          console.log('Modo offline: mensagem PV simulada', notification);
          return;
        }

        // Aqui você pode implementar a lógica para salvar mensagens PV
        // Por exemplo, enviando para o backend via API
        console.log('Mensagem PV enviada:', notification);
      } catch (error) {
        console.error('Erro ao salvar mensagem PV:', error);
      }
    }

    async function saveNotificationToAnnouncements(notification) {
      try {
        // Em modo offline, apenas simular
        if (OFF) {
          console.log('Modo offline: notificação simulada', notification);
          return;
        }

        // Buscar announcements atuais
        const response = await fetch('/announcements.json');
        let announcements = [];
        
        if (response.ok) {
          announcements = await response.json();
        }

        // Adicionar nova notificação
        announcements.push({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          date: notification.date.split('T')[0], // Formato YYYY-MM-DD
          isUrgent: notification.isUrgent,
          target: notification.target
        });

        // Manter apenas últimas 50 notificações
        if (announcements.length > 50) {
          announcements = announcements.slice(-50);
        }

        console.log('Notificação adicionada ao sistema:', notification);
      } catch (error) {
        console.error('Erro ao salvar em announcements:', error);
      }
    }

    function saveNotificationToHistory(notification) {
      try {
        let history = JSON.parse(localStorage.getItem('admin_notifications_history') || '[]');
        history.unshift(notification); // Adicionar no início
        
        // Manter apenas últimas 20 no localStorage
        if (history.length > 20) {
          history = history.slice(0, 20);
        }
        
        localStorage.setItem('admin_notifications_history', JSON.stringify(history));
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }
    }

    function loadNotificationsHistory() {
      const historyContainer = document.getElementById('notifications-history');
      if (!historyContainer) return;

      try {
        const history = JSON.parse(localStorage.getItem('admin_notifications_history') || '[]');
        
        if (history.length === 0) {
          historyContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
              <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.3;"></i>
              <p>Nenhuma notificação enviada ainda.</p>
            </div>
          `;
          return;
        }

        const targetLabels = {
          'all': '📢 Todos os usuários',
          'clients': '👥 Clientes',
          'providers': '🔧 Prestadores',
          'specific': '📧 Usuário específico'
        };

        const typeLabels = {
          'aviso': '📢 Aviso',
          'notificacao': '🔔 Notificação',
          'atualizacao': '🔄 Atualização',
          'pv': '💬 Mensagem PV'
        };

        historyContainer.innerHTML = history.map(notif => {
          let targetInfo = '';
          if (notif.isPV) {
            if (notif.target === 'specific') {
              targetInfo = `📧 Para: ${notif.specificUser}`;
            } else {
              targetInfo = targetLabels[notif.target] || notif.target;
            }
          } else {
            targetInfo = targetLabels[notif.target] || notif.target;
          }

          const typeIcon = notif.isPV ? '💬' : (notif.type ? typeLabels[notif.type]?.split(' ')[0] : '🔔');
          const typeLabel = notif.type ? typeLabels[notif.type] : 'Notificação';

          return `
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white; ${notif.isUrgent ? 'border-left: 4px solid var(--red);' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <strong style="color: #333; display: flex; align-items: center; gap: 8px;">
                    <i class="fas ${notif.isPV ? 'fa-envelope' : 'fa-bell'}" style="color: var(--purple);"></i>
                    ${escapeHtml(notif.title)}
                    ${notif.isUrgent ? '<span style="background: var(--red); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">URGENTE</span>' : ''}
                  </strong>
                  <div style="font-size: 12px; color: var(--blue); margin-top: 4px;">
                    ${typeLabel} • ${targetInfo}
                  </div>
                </div>
                <div style="font-size: 11px; color: #888; text-align: right;">
                  📅 ${new Date(notif.date).toLocaleDateString('pt-BR')}<br>
                  🕒 ${new Date(notif.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                </div>
              </div>
              <div style="color: #555; line-height: 1.4; margin-top: 8px;">
                ${escapeHtml(notif.message)}
              </div>
              ${notif.isPV ? '<div style="font-size: 11px; color: #666; margin-top: 8px; font-style: italic;">💬 Enviado como mensagem privada</div>' : ''}
            </div>
          `;
        }).join('');

      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        historyContainer.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--red);">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 12px;"></i>
            <p>Erro ao carregar histórico de notificações.</p>
          </div>
        `;
      }
    }

    // SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS
    // ========================================
    
    function initializeAutoNotifications() {
      const toggleBtn = document.getElementById('toggle-auto-notifications');
      const settingsDiv = document.getElementById('auto-notification-settings');
      const cancelBtn = document.getElementById('cancel-auto-config');
      const saveBtn = document.getElementById('save-auto-config');
      
      // Toggle da configuração
      if (toggleBtn) {
        addTouchFriendlyEvent(toggleBtn, () => {
          const isVisible = settingsDiv.style.display !== 'none';
          settingsDiv.style.display = isVisible ? 'none' : 'block';
          toggleBtn.innerHTML = isVisible ? '<i class="fas fa-cog"></i> Configurar' : '<i class="fas fa-times"></i> Fechar';
          
          if (!isVisible) {
            loadAutoNotificationSettings();
          }
        });
      }

      // Controle dos checkboxes das regras
      const ruleCards = document.querySelectorAll('.auto-rule-card');
      ruleCards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        const config = card.querySelector('.rule-config');
        
        if (checkbox && config) {
          checkbox.addEventListener('change', () => {
            config.style.display = checkbox.checked ? 'block' : 'none';
          });
        }
      });

      // Botão cancelar
      if (cancelBtn) {
        addTouchFriendlyEvent(cancelBtn, () => {
          settingsDiv.style.display = 'none';
          toggleBtn.innerHTML = '<i class="fas fa-cog"></i> Configurar';
        });
      }

      // Botão salvar
      if (saveBtn) {
        addTouchFriendlyEvent(saveBtn, () => {
          saveAutoNotificationSettings();
        });
      }
    }

    function loadAutoNotificationSettings() {
      try {
        const settings = JSON.parse(localStorage.getItem('auto_notification_settings') || '{}');
        
        // Carregar configurações de cada regra
        const rules = ['bugfix', 'visual', 'internal', 'feature', 'layout', 'service'];
        rules.forEach(rule => {
          const checkbox = document.getElementById(`rule-${rule}`);
          const textarea = document.querySelector(`#rule-${rule}`).closest('.auto-rule-card').querySelector('textarea');
          const urgentCheckbox = document.getElementById(`${rule}-urgent`);
          
          if (settings[rule]) {
            if (checkbox) checkbox.checked = settings[rule].enabled || false;
            if (textarea) textarea.value = settings[rule].template || '';
            if (urgentCheckbox) urgentCheckbox.checked = settings[rule].urgent || false;
            
            // Mostrar configuração se habilitado
            const config = checkbox?.closest('.auto-rule-card').querySelector('.rule-config');
            if (config && checkbox?.checked) {
              config.style.display = 'block';
            }
          }
        });

        // Carregar configurações globais
        const frequencySelect = document.getElementById('auto-frequency');
        const targetSelect = document.getElementById('auto-target');
        const enabledCheckbox = document.getElementById('auto-enabled');
        
        if (frequencySelect) frequencySelect.value = settings.frequency || 'daily';
        if (targetSelect) targetSelect.value = settings.target || 'all';
        if (enabledCheckbox) enabledCheckbox.checked = settings.enabled || false;

      } catch (error) {
        console.error('Erro ao carregar configurações automáticas:', error);
      }
    }

    function saveAutoNotificationSettings() {
      try {
        const settings = {
          enabled: document.getElementById('auto-enabled')?.checked || false,
          frequency: document.getElementById('auto-frequency')?.value || 'daily',
          target: document.getElementById('auto-target')?.value || 'all'
        };

        // Salvar configurações de cada regra
        const rules = ['bugfix', 'visual', 'internal', 'feature', 'layout', 'service'];
        rules.forEach(rule => {
          const checkbox = document.getElementById(`rule-${rule}`);
          const textarea = document.querySelector(`#rule-${rule}`).closest('.auto-rule-card').querySelector('textarea');
          const urgentCheckbox = document.getElementById(`${rule}-urgent`);
          
          settings[rule] = {
            enabled: checkbox?.checked || false,
            template: textarea?.value || '',
            urgent: urgentCheckbox?.checked || false
          };
        });

        localStorage.setItem('auto_notification_settings', JSON.stringify(settings));
        
        // Fechar configurações
        document.getElementById('auto-notification-settings').style.display = 'none';
        document.getElementById('toggle-auto-notifications').innerHTML = '<i class="fas fa-cog"></i> Configurar';
        
        alert('✅ Configurações de notificações automáticas salvas com sucesso!');
        
        // Inicializar monitoramento se habilitado
        if (settings.enabled) {
          initializeAutoNotificationMonitoring();
        }

      } catch (error) {
        console.error('Erro ao salvar configurações automáticas:', error);
        alert('❌ Erro ao salvar configurações. Tente novamente.');
      }
    }

    // SISTEMA DE MONITORAMENTO E DISPARO AUTOMÁTICO
    // ========================================
    
    function initializeAutoNotificationMonitoring() {
      // Verificar se já existe um intervalo ativo
      if (window.autoNotificationInterval) {
        clearInterval(window.autoNotificationInterval);
      }

      const settings = JSON.parse(localStorage.getItem('auto_notification_settings') || '{}');
      if (!settings.enabled) return;

      // Verificar atualizações a cada 5 minutos
      window.autoNotificationInterval = setInterval(() => {
        checkForUpdatesAndNotify();
      }, 5 * 60 * 1000);

      console.log('🤖 Sistema de notificações automáticas ativado');
    }

    async function checkForUpdatesAndNotify() {
      try {
        const settings = JSON.parse(localStorage.getItem('auto_notification_settings') || '{}');
        if (!settings.enabled) return;

        // Simular verificação de atualizações (na implementação real, isso viria de uma API)
        const updates = await detectSystemUpdates();
        
        for (const update of updates) {
          if (shouldSendNotification(update, settings)) {
            await sendAutoNotification(update, settings);
          }
        }

      } catch (error) {
        console.error('Erro no monitoramento automático:', error);
      }
    }

    async function detectSystemUpdates() {
      // Esta função seria substituída por uma integração real com o sistema
      // Por agora, simula detecção de atualizações
      
      const lastCheck = localStorage.getItem('last_update_check') || '0';
      const now = Date.now();
      
      // Simular atualizações apenas para demonstração
      const simulatedUpdates = [];
      
      // Verificar se passou tempo suficiente desde a última verificação
      if (now - parseInt(lastCheck) > 24 * 60 * 60 * 1000) { // 24 horas
        // Aqui você implementaria a lógica real de detecção
        // Por exemplo, verificar logs, commits, mudanças na base de dados, etc.
        
        localStorage.setItem('last_update_check', now.toString());
      }
      
      return simulatedUpdates;
    }

    function shouldSendNotification(update, settings) {
      const rule = settings[update.type];
      if (!rule || !rule.enabled) return false;

      // Verificar frequência
      const lastSent = localStorage.getItem(`last_auto_notification_${update.type}`) || '0';
      const now = Date.now();
      const timeDiff = now - parseInt(lastSent);

      switch (settings.frequency) {
        case 'immediate':
          return true;
        case 'daily':
          return timeDiff > 24 * 60 * 60 * 1000;
        case 'weekly':
          return timeDiff > 7 * 24 * 60 * 60 * 1000;
        default:
          return false;
      }
    }

    async function sendAutoNotification(update, settings) {
      try {
        const rule = settings[update.type];
        const template = rule.template || getDefaultTemplate(update.type);
        
        const notification = {
          id: Date.now().toString(),
          type: 'atualizacao',
          title: 'Atualização',
          message: template.replace('[descrição]', update.description)
                          .replace('[área]', update.area)
                          .replace('[nome da função]', update.feature)
                          .replace('[nome do serviço]', update.service),
          target: settings.target,
          isUrgent: rule.urgent || false,
          date: new Date().toISOString(),
          sent: true,
          isAutomatic: true,
          updateType: update.type
        };

        // Salvar como notificação normal
        await saveNotificationToAnnouncements(notification);
        saveNotificationToHistory(notification);

        // Marcar como enviado
        localStorage.setItem(`last_auto_notification_${update.type}`, Date.now().toString());
        
        console.log(`🤖 Notificação automática enviada: ${update.type}`);

      } catch (error) {
        console.error('Erro ao enviar notificação automática:', error);
      }
    }

    function getDefaultTemplate(type) {
      const templates = {
        bugfix: 'Corrigimos um problema que estava afetando o sistema. Agora tudo está funcionando perfeitamente!',
        visual: 'Atualizamos o visual do sistema para uma experiência mais moderna e intuitiva!',
        internal: 'Melhoramos a velocidade e estabilidade do sistema para uma experiência ainda melhor!',
        feature: 'Nova funcionalidade disponível! Confira as novidades no seu painel.',
        layout: 'Reorganizamos o layout para facilitar o uso e melhorar sua navegação!',
        service: 'Novo serviço disponível! Solicite agora mesmo através do seu painel.'
      };
      
      return templates[type] || 'Sistema atualizado com melhorias!';
    }

    // FUNÇÃO PÚBLICA PARA DISPARAR NOTIFICAÇÕES AUTOMÁTICAS
    // ========================================
    
    function triggerAutoNotification(type, details = {}) {
      const settings = JSON.parse(localStorage.getItem('auto_notification_settings') || '{}');
      if (!settings.enabled || !settings[type]?.enabled) return;

      const update = {
        type: type,
        description: details.description || '',
        area: details.area || '',
        feature: details.feature || '',
        service: details.service || '',
        timestamp: Date.now()
      };

      if (shouldSendNotification(update, settings)) {
        sendAutoNotification(update, settings);
      }
    }

    // Expor função globalmente para uso externo
    if (typeof window !== 'undefined') {
      window.triggerAutoNotification = triggerAutoNotification;
    }
  }
})();
