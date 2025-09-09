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
      return `<div class="user-item"><span class="user-tag ${tag}">${u.role}</span><div class="user-info"><div class="name">${escapeHtml(u.name)}</div><div class="contact">${escapeHtml(u.email)} • ${escapeHtml(u.phone || '')}</div></div><div class="user-actions"><button class="btn view" data-email="${encodeURIComponent(u.email)}" style="background:var(--blue)"><i class="fas fa-eye"></i></button><button class="btn password" data-email="${encodeURIComponent(u.email)}" style="background:var(--orange)"><i class="fas fa-key"></i></button><button class="btn delete" data-email="${encodeURIComponent(u.email)}" style="background:var(--red)"><i class="fas fa-trash"></i></button></div></div>`;
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

    // Edit button logic (simple prompt-based)
    document.querySelectorAll('.user-actions .view').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = decodeURIComponent(btn.getAttribute('data-email'));
        const name = prompt('Novo nome (deixe em branco para manter)');
        const phone = prompt('Novo telefone (deixe em branco para manter)');
        const cep = prompt('Novo CEP (deixe em branco para manter)');
        if (OFF) {
          const arr = JSON.parse(localStorage.getItem('admin_users') || '[]');
          const idx = arr.findIndex(u => (u.email || '').toLowerCase() === email.toLowerCase());
          if (idx > -1) {
            if (name) arr[idx].name = name;
            if (phone) arr[idx].phone = phone;
            if (cep) arr[idx].cep = cep;
            localStorage.setItem('admin_users', JSON.stringify(arr));
            fetchUsers();
          }
          return;
        }
        const body = {};
        if (name) body.name = name;
        if (phone) body.phone = phone;
        if (cep) body.cep = cep;
        const up = await fetch(`${API}/api/users/` + encodeURIComponent(email), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
          body: JSON.stringify(body)
        });
        if (up.ok) fetchUsers(); else alert('Falha ao atualizar usuário');
      });
    });

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
    // Preencher estatísticas de clientes e prestadores na aba correta
    const statsClientes = document.getElementById('stats-clientes');
    if (statsClientes) {
      statsClientes.innerHTML = `
        <div class="item"><span>Total de Cadastros</span><span class="stat-value">${data.totalClientes ?? 0}</span></div>
        <div class="item"><span>Ativos este mês</span><span class="stat-value">-</span></div>
        <div class="item"><span>Novos hoje</span><span class="stat-value">-</span></div>
      `;
    }
    const statsPrestadores = document.getElementById('stats-prestadores');
    if (statsPrestadores) {
      statsPrestadores.innerHTML = `
        <div class="item"><span>Total de Cadastros</span><span class="stat-value">${data.totalPrestadores ?? 0}</span></div>
        <div class="item"><span>Ativos este mês</span><span class="stat-value">-</span></div>
        <div class="item"><span>Novos hoje</span><span class="stat-value">-</span></div>
      `;
    }
    console.log('🚀 fetchDashboardStats iniciado');
    console.log('🔧 Configurações:', { API, OFF, ADMIN_KEY });
    
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

    console.log('🌐 Fazendo requisição para:', `${API}/api/admin/stats`);
    console.log('🔑 Headers:', { 'X-Admin-Key': ADMIN_KEY });
    
    try {
      const res = await fetch(`${API}/api/admin/stats`, { 
        headers: { 'X-Admin-Key': ADMIN_KEY },
        mode: 'cors'
      });
      console.log('📡 Response status:', res.status);
      console.log('📡 Response headers:', [...res.headers.entries()]);
      
      if (!res.ok) {
        console.error('❌ Response não OK:', res.status, res.statusText);
        return; // silently ignore, events or users will show messages
      }
      
      const data = await res.json();
      console.log('✅ Stats data received:', data);

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
        // prefer explicit value if backend provides "new signups" in future; currently reuse concluded today as an indicator
        novosClientesEl.textContent = data.newSignupsToday != null ? `+${data.newSignupsToday} novos hoje` : '+0 novos hoje';
        novosClientesEl.style.color = (data.newSignupsToday > 0) ? 'var(--green)' : 'var(--text-muted)';
        console.log('novos-clientes set to', novosClientesEl.textContent);
      }

      setText('total-prestadores', data.totalPrestadores ?? '0');
      console.log('totalPrestadores set to', data.totalPrestadores);
      const novosPrestEl = document.getElementById('novos-prestadores');
      if (novosPrestEl) novosPrestEl.textContent = '+0 novos hoje';

  setText('servicos-ativos', data.servicosAtivos ?? '0');
  console.log('servicosAtivos set to', data.servicosAtivos);
  // Exibe a frase "X concluídos hoje" no card de Serviços Ativos (número + label separados)
  const concluidosEl = document.getElementById('servicos-concluidos');
  if (concluidosEl) {
    const n = Number(data.servicosConcluidosHoje ?? 0);
    // garantir formato: número grande (value) e label abaixo
    concluidosEl.innerHTML = `<span style="display:block;color:var(--text-muted);font-weight:700">${n}</span><span style="display:block;color:var(--green);font-size:0.9rem">${n} concluídos hoje</span>`;
  }

      setText('erros-recentes', data.errosRecentes ?? '0');
      console.log('errosRecentes set to', data.errosRecentes);
      const critEl = document.getElementById('erros-criticos');
      if (critEl) critEl.textContent = (data.errosCriticos ?? 0) > 0 ? `${data.errosCriticos} críticos` : '0 críticos';
      console.log('errosCriticos set to', data.errosCriticos);

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
    // Simple logic: count new user signups today
    const today = new Date().toISOString().split('T')[0];
    const newSignupsToday = events.filter(e => 
      e.event_type === 'user_signup' && e.created_at && e.created_at.startsWith(today)
    ).length;
    
    // Update overview cards if visible
    const newUsersElement = document.querySelector('.overview-grid .stat-card .detail');
    if (newUsersElement && newUsersElement.textContent.includes('novos hoje')) {
      newUsersElement.textContent = `+${newSignupsToday} novos hoje`;
      newUsersElement.style.color = newSignupsToday > 0 ? 'var(--green)' : 'var(--text-muted)';
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
      console.log('Dashboard loading...');
      console.log('API_BASE:', API);
      console.log('ADMIN_KEY:', ADMIN_KEY);
      console.log('OFFLINE mode:', OFF);
      
      fetchUsers();
      fetchAdminEvents(); // Also fetch recent events
      fetchDashboardStats(); // Atualizar cards do dashboard
      // não adiciona mais botão logout
    });
  }
})();
