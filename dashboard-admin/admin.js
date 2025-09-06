// admin.js — proteger dashboard e fornecer list/delete de usuários
(function () {
  const API = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
  const token = localStorage.getItem('admin_token');
  if (!token) {
    // se não estiver logado, redireciona para login (caminho relativo)
    const path = location.pathname.toLowerCase();
    if (!path.endsWith('login.html')) {
      location.replace('login.html');
      return;
    }
  }

  async function fetchUsers() {
    const listEl = document.querySelector('.user-list');
    if (!listEl) return;
    try {
  const res = await fetch(`${API}/api/users`, { headers: { 'Authorization': 'Bearer ' + token } });
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
      if (!users.length) {
        listEl.innerHTML = '<div class="card">Nenhum usuário encontrado.</div>';
        return;
      }
      listEl.innerHTML = users.map(u => {
        const tag = u.role === 'provider' ? 'tag-prestador' : (u.role === 'admin' ? 'tag-admin' : 'tag-cliente');
        return `<div class="user-item"><span class="user-tag ${tag}">${u.role}</span><div class="user-info"><div class="name">${escapeHtml(u.name)}</div><div class="contact">${escapeHtml(u.email)} • ${escapeHtml(u.phone || '')}</div></div><div class="user-actions"><button class="btn view" data-email="${encodeURIComponent(u.email)}" style="background:var(--blue)"><i class="fas fa-eye"></i></button><button class="btn delete" data-email="${encodeURIComponent(u.email)}" style="background:var(--red)"><i class="fas fa-trash"></i></button></div></div>`;
      }).join('');

      // attach delete handlers
      document.querySelectorAll('.user-actions .delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const email = decodeURIComponent(btn.getAttribute('data-email'));
          if (!confirm('Deletar usuário ' + email + '?')) return;
          const dres = await fetch(`${API}/api/users/` + encodeURIComponent(email), { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
          if (dres.ok) {
            fetchUsers();
          } else {
            alert('Falha ao deletar usuário');
          }
        })
      });

    } catch (err) {
      listEl.innerHTML = '<div class="card">Erro ao carregar usuários (rede).</div>';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]);
  }

  // Logout button helper
  window.adminLogout = function () {
    localStorage.removeItem('admin_token');
    location.replace('login.html');
  }

  // On dashboard page, fetch users
  if (location.pathname.endsWith('/dashboard_admin.html')) {
    document.addEventListener('DOMContentLoaded', () => {
      fetchUsers();
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
