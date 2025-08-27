# Instruções locais — projeto marido-de-aluguel-carioca

Resumo rápido
- Backend: `backend/` (Node + Express + TypeScript). Usa Postgres via `DATABASE_URL` quando disponível; cai para um armazenamento em memória para desenvolvimento quando o banco não está acessível.
- Frontend: App Vite + React. Em dev serve em `http://localhost:5173/marido-de-aluguel-carioca/` (configurado).

Como rodar localmente (Win / PowerShell)

1) Backend

```powershell
cd "c:\Users\Public\Documents\OneDrive\PROJETOS 2.0\marido-de-aluguel-carioca\backend"
npm install
# Opcional: configure .env com DATABASE_URL e JWT_SECRET
# Se não houver Postgres disponível, o servidor iniciará com fallback em memória
npm run build
npm run dev
```

Logs esperados
- Se não houver Postgres: `Could not connect to Postgres, falling back to in-memory stores.` e `Server started without DB connection on http://localhost:3001`.

2) Frontend (dev)

```powershell
cd "c:\Users\Public\Documents\OneDrive\PROJETOS 2.0\marido-de-aluguel-carioca"
npm install
npm run dev
# Abra http://localhost:5173/marido-de-aluguel-carioca/
```

Testes rápidos de API (PowerShell)

```powershell
# Signup
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/auth/signup -Body (ConvertTo-Json @{ name='Teste'; email='test@example.com'; password='senha123'; role='client' }) -ContentType 'application/json'

# Login (retorna { user, token })
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/auth/login -Body (ConvertTo-Json @{ email='test@example.com'; password='senha123' }) -ContentType 'application/json'
```

Comportamento implementado
- O backend retorna um JWT em `signup` e `login` (padrão `JWT_SECRET` `dev_secret` quando não configurado).
- O frontend armazena o token em `localStorage` (chave `mdac_token`) e usa um wrapper `authFetch` que:
  - checa o claim `exp` do JWT antes de requisições e força logout local se expirado;
  - ao receber 401 do servidor limpa o token e emite um evento global `mdac:logout` para que o `AuthProvider` faça logout automaticamente.
- Para desenvolvimento sem Postgres há um fallback em memória (dados não persistem entre reinícios).

Notas de segurança
- O armazenamento em `localStorage` é simples para desenvolvimento; para produção considere cookies HttpOnly/Secure e fluxo de refresh tokens.

Se quiser que eu: (A) force testes adicionais (401/expiry), (B) abra um PR com as mudanças, ou (C) mantenha assim — diga a opção.