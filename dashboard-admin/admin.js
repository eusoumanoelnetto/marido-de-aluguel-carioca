// admin.js — proteger dashboard e fornecer list/delete de usuários
(function () {
  const API = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
  const OFF = !!(typeof window !== 'undefined' && window.ADMIN_OFFLINE);
  const ADMIN_KEY = (typeof window !== 'undefined' && window.ADMIN_KEY) ? window.ADMIN_KEY : '';

  async function fetchUsers() {
    const listEl = document.querySelector('.user-list');
    if (!listEl) return;
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
      btn.addEventListener('click', async () => {
        const email = decodeURIComponent(btn.getAttribute('data-email'));
        if (!confirm('Deletar usuário ' + email + '?')) return;
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
      btn.addEventListener('click', async () => {
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
      btn.addEventListener('click', async () => {
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
  // Função para exibir modal de usuário (view/edit)
  function showUserModal(user, editMode) {
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
    } else {
      viewDiv.style.display = 'block';
      editForm.style.display = 'none';
      viewDiv.innerHTML = `<h3 style="margin-bottom:8px;">${escapeHtml(user.name)}</h3><div style="color:var(--text-muted);margin-bottom:8px;">${escapeHtml(user.email)} • ${escapeHtml(user.phone || '')}</div><div><b>CEP:</b> ${escapeHtml(user.cep || '-')}</div><div><b>Tipo:</b> ${escapeHtml(user.role)}</div>`;
    }
    modal.style.display = 'flex';
    // Fechar modal
    document.getElementById('close-user-modal').onclick = () => { modal.style.display = 'none'; };
    // Submissão do form de edição
    editForm.onsubmit = async function(e) {
      e.preventDefault();
      const body = {
        name: editForm.name.value,
        phone: editForm.phone.value,
        cep: editForm.cep.value
      };
      const up = await fetch(`${API}/api/users/` + encodeURIComponent(editForm.email.value), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
        body: JSON.stringify(body)
      });
      if (up.ok) {
        modal.style.display = 'none';
        fetchUsers();
      } else {
        alert('Falha ao atualizar usuário');
      }
    };
  }

    // Password reset button logic
    document.querySelectorAll('.user-actions .password').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = decodeURIComponent(btn.getAttribute('data-email'));
        const password = prompt('Nova senha (mínimo 6 caracteres)');
        if (!password || password.length < 6) {
          alert('Senha inválida. Informe ao menos 6 caracteres.');
          return;
        }
        if (OFF) {
          alert('Redefinição de senha disponível apenas online.');
          return;
        }
        const res = await fetch(`${API}/api/users/` + encodeURIComponent(email) + '/password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
          body: JSON.stringify({ password })
        });
        if (res.ok) alert('Senha redefinida com sucesso.'); else alert('Falha ao redefinir senha');
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
      updateDashboardWithEvents(data.events || []);
    } catch (err) {
      // ignore events fetch errors
    }
  }

  // Fetch overall dashboard statistics and update overview cards
  async function fetchDashboardStats() {
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
      Object.values(elMap).forEach(el => { if (el) el.textContent = 'Offline'; });
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
      if (critEl) critEl.textContent = (data.errosCriticos ?? 0) > 0 ? `${data.errosCriticos} críticos` : '0 críticos';
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
    setText('erros-recentes', '2');

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
    if (critEl) critEl.textContent = '0 críticos';

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

  // Send notification function — can be called from the notification page
  window.sendNotification = async function () {
    const title = prompt('Título da notificação');
    const body = prompt('Mensagem da notificação');
    if (!title || !body) return;
    
    if (OFF) {
      alert('Notificações disponíveis apenas online.');
      return;
    }
    
    try {
      const res = await fetch(`${API}/api/push/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
        body: JSON.stringify({ title, body })
      });
      if (res.ok) alert('Notificação enviada para todos os usuários inscritos.'); else alert('Falha ao enviar notificação.');
    } catch (err) {
      alert('Erro ao enviar notificação.');
    }
  };

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
        link.addEventListener('click', (event) => {
          event.preventDefault();
          navLinks.forEach(nav => nav.classList.remove('active'));
          link.classList.add('active');
          const targetPageId = link.getAttribute('data-target');
          pages.forEach(page => {
            page.classList.toggle('active', page.id === targetPageId);
          });
        });
      });

      // inicialização do dashboard (logs reduzidos)
      
      fetchUsers();
      fetchAdminEvents(); // Also fetch recent events
      fetchDashboardStats(); // Atualizar cards do dashboard
      // não adiciona mais botão logout

      // Atualização automática leve a cada 60s para refletir novos cadastros do dia
      try {
        setInterval(() => {
          fetchDashboardStats();
          fetchAdminEvents();
        }, 60000);
      } catch (_) { /* noop */ }
    });
  }
})();
