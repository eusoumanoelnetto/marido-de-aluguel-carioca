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

  const res = await fetch(`${API}/api/users`, { headers: { 'X-Admin-Key': ADMIN_KEY } });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // token inválido — remover token e mostrar mensagem no lugar de redirecionar
          localStorage.removeItem('admin_token');
          listEl.innerHTML = '<div class="card">Sessão inválida. Sem acesso ao backend.</div>';
          return;
        }
        listEl.innerHTML = '<div class="card">Erro ao carregar usuários.</div>';
        return;
      }
      const data = await res.json();
  const users = data.users || [];
  renderUsers(users);

    } catch (err) {
      listEl.innerHTML = '<div class="card">Erro ao carregar usuários (rede).</div>';
    }
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
      const res = await fetch(`${API}/api/admin/stats`, { 
        headers: { 'X-Admin-Key': ADMIN_KEY },
        mode: 'cors'
      });
  // status recebido (silenciado em produção)
      
      if (!res.ok) {
        console.error('❌ Response não OK:', res.status, res.statusText);
        return; // silently ignore, events or users will show messages
      }
      
      const data = await res.json();
  // dados recebidos

      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val != null ? val : '0');
      };

      setText('total-clientes', data.totalClientes ?? '0');
      console.log('totalClientes set to', data.totalClientes);
      const novos = data.servicosConcluidosHoje != null ? `+${data.servicosConcluidosHoje} concluídos hoje` : '+0 concluidos hoje';
      // Try to update the novos-clientes element only if exists
      const novosClientesEl = document.getElementById('novos-clientes');
      if (novosClientesEl) {
        // Prioriza newClientsToday; fallback para newSignupsToday
        const n = Number((data.newClientsToday ?? data.newSignupsToday) ?? 0);
        if (n > 0) {
          novosClientesEl.textContent = `+${n} novos hoje`;
          novosClientesEl.style.color = 'var(--green)';
          novosClientesEl.style.display = 'block';
          console.log('novos-clientes set to', novosClientesEl.textContent);
        } else {
          novosClientesEl.style.display = 'none';
          console.log('novos-clientes ocultado (0 cadastros hoje)');
        }
      }

      setText('total-prestadores', data.totalPrestadores ?? '0');
      console.log('totalPrestadores set to', data.totalPrestadores);
      const novosPrestEl = document.getElementById('novos-prestadores');
      if (novosPrestEl) {
        const p = Number(data.newProvidersToday ?? 0);
        if (p > 0) {
          novosPrestEl.textContent = `+${p} novos hoje`;
          novosPrestEl.style.color = 'var(--green)';
          novosPrestEl.style.display = 'block';
        } else {
          novosPrestEl.style.display = 'none';
        }
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
      
      // Mostrar erro visualmente nos cards
      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'Erro';
      };
      setText('total-clientes', 'Erro');
      setText('total-prestadores', 'Erro');
      setText('servicos-ativos', 'Erro');
      setText('servicos-concluidos', 'Erro');
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
      novosEl.style.color = newSignupsToday > 0 ? 'var(--green)' : 'var(--text-muted)';
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
        el.style.color = newSignupsToday > 0 ? 'var(--green)' : 'var(--text-muted)';
      }
    }

    // Update providers detail if available
    const novosPrestEl = document.getElementById('novos-prestadores');
    if (novosPrestEl) {
      novosPrestEl.textContent = `+${newProvidersToday} novos hoje`;
      novosPrestEl.style.color = newProvidersToday > 0 ? 'var(--green)' : 'var(--text-muted)';
    }

    // Atualizar seção de prestadores na aba Usuários
    const statsPrest = document.getElementById('stats-prestadores');
    if (statsPrest && statsPrest.innerHTML.includes('Novos hoje')) {
      const statValues = statsPrest.querySelectorAll('.stat-value');
      const novIdx = 2;
      const el = statValues[novIdx];
      if (el) {
        el.textContent = String(newProvidersToday);
        el.style.color = newProvidersToday > 0 ? 'var(--green)' : 'var(--text-muted)';
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
