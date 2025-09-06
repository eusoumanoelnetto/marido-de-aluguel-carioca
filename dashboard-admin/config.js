// Modo OFFLINE (GitHub Pages sem backend):
// - Defina ADMIN_OFFLINE = true para habilitar login simbólico e dados locais (localStorage).
// - Para usar backend depois, defina ADMIN_OFFLINE = false e preencha API_BASE com a URL da Render/Vercel.
window.ADMIN_OFFLINE = false;

// URL base do backend (quando ADMIN_OFFLINE = false)
// Ex.: 'https://seu-backend.onrender.com'
window.API_BASE = 'https://marido-de-aluguel-carioca.onrender.com';

// Chave do painel admin (defina a mesma em ADMIN_PANEL_KEY no backend quando contratar o serviço)
window.ADMIN_KEY = 'DEFINA_AQUI_E_NO_BACKEND';
