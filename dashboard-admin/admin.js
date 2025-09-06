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
        // Dados locais simulados
        const local = JSON.parse(localStorage.getItem('admin_users') || '[]');
        if (!local.length) {
          const seed = [
            { name: 'João Silva', email: 'joao@email.com', phone: '(21) 99999-1111', role: 'client' },
            { name: 'Maria Santos', email: 'maria@email.com', phone: '(21) 99999-2222', role: 'client' },
            { name: 'Pedro Costa', email: 'pedro@email.com', phone: '(21) 99999-3333', role: 'client' },
            { name: 'Carlos Ferreira', email: 'carlos@email.com', phone: '(21) 99999-4444', role: 'provider' },
            { name: 'Ana Oliveira', email: 'ana@email.com', phone: '(21) 99999-5555', role: 'provider' },
          ];
          localStorage.setItem('admin_users', JSON.stringify(seed));
        }
        const users = JSON.parse(localStorage.getItem('admin_users') || '[]');
        renderUsers(users);
        return;
      }

  const res = await fetch(`${API}/api/users`, { headers: { 'X-Admin-Key': ADMIN_KEY } });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // token inválido — redireciona para login
          localStorage.removeItem('admin_token');
          location.replace('/dashboard-admin/login.html');
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
  window.adminLogout = function () { alert('Sem sessão. Configure ADMIN_KEY no config.js.'); }

  // On dashboard page, fetch users
  if (location.pathname.toLowerCase().endsWith('dashboard_admin.html')) {
    document.addEventListener('DOMContentLoaded', () => {
      fetchUsers();
      fetchAdminEvents(); // Also fetch recent events
      // add logout button
      const header = document.querySelector('.main-header');
      if (header) {
        const btn = document.createElement('button');
        btn.textContent = 'Logout';
        btn.style.marginLeft = '12px';
        btn.style.padding = '8px 12px';
        btn.style.borderRadius = '8px';
        btn.style.background = '#fff';
        btn.style.color = '#8e44ad';
        btn.onclick = window.adminLogout;
        header.appendChild(btn);
      }
    });
  }
})();
