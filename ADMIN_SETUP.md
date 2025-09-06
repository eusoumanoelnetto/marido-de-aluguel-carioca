# 🚀 Configuração do Painel Admin - Instruções

## ✅ Já configurado automaticamente:

### 1. Frontend (GitHub Pages)
- ✅ `dashboard-admin/config.js` já está configurado
- ✅ ADMIN_KEY: `OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA=`
- ✅ API_BASE: `https://marido-de-aluguel-carioca.onrender.com`

### 2. Backend (Render)
- ✅ Arquivo `.env.production` criado com todas as variáveis

## 📋 O que você precisa fazer:

### 1. No Render (configurar variáveis de ambiente):
Copie e cole estas variáveis no painel Environment Variables do Render:

```
JWT_SECRET=sua_chave_jwt_64_caracteres_aqui
DATABASE_URL=sua_url_postgres_aqui
FRONTEND_ORIGIN=https://eusoumanoelnetto.github.io
ADMIN_PANEL_KEY=OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA=
```

### 2. JWT_SECRET:
Use a chave de 64 caracteres que você gerou anteriormente no PowerShell, ou gere uma nova:
```powershell
$bytes = New-Object 'System.Byte[]' 64; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

### 3. DATABASE_URL:
Será fornecida automaticamente quando você criar um PostgreSQL no Render.

### 4. Commit e Deploy:
```bash
git add .
git commit -m "Configure admin panel with backend integration"
git push origin main
```

## 🎯 URLs finais:
- **App público:** https://marido-de-aluguel-carioca.vercel.app
- **Painel admin:** https://eusoumanoelnetto.github.io/dashboard-admin/dashboard_admin.html
- **Backend:** https://marido-de-aluguel-carioca.onrender.com

## 🔐 Acesso admin:
Depois do deploy, o painel vai automaticamente:
- ✅ Listar todos os usuários
- ✅ Permitir editar/deletar usuários
- ✅ Resetar senhas
- ✅ Enviar notificações
- ✅ Mostrar novos cadastros em tempo real
