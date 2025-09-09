// Mo// URL base do backend (quando ADMIN_OFFLINE = false)
// Ex.: 'https://seu-backend.onrender.com'
window.API_BASE = 'https://marido-de-aluguel-carioca.onrender.com';

// Comentado teste local por enquanto - vamos usar direto a API do Render
// if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.0.0.1'))) {
//   window.API_BASE = 'http://localhost:3001';
// }NE (GitHub Pages sem backend):
// - Defina ADMIN_OFFLINE = true para habilitar login simbólico e dados locais (localStorage).
// - Para usar backend depois, defina ADMIN_OFFLINE = false e preencha API_BASE com a URL da Render/Vercel.
window.ADMIN_OFFLINE = false;

// URL base do backend (quando ADMIN_OFFLINE = false)
// Ex.: 'https://seu-backend.onrender.com'
window.API_BASE = 'https://marido-de-aluguel-carioca.onrender.com';

// Se estiver testando localmente (servidor em localhost:3001), usar URL local do backend
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.0.0.1'))) {
	window.API_BASE = 'http://localhost:3001';
}
// Chave do painel admin (deve coincidir com ADMIN_PANEL_KEY configurado no backend)
window.ADMIN_KEY = 'OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA=';
