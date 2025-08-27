# Deploy: Frontend (GitHub Pages) and Backend (Render)

Resumo rápido:
- Frontend: publicado no GitHub Pages (branch `gh-pages`). O fluxo de CI já está criado em `.github/workflows/deploy_front.yml`.
- Backend: deploy no Render como Web Service; configure `DATABASE_URL` no painel do Render com a URL do banco.

Passos frontend (GitHub):
1. No repo GitHub, vá em Settings → Secrets → Actions e crie um secret `RENDER_BACKEND_URL` com a URL pública do backend (ex: `https://api-meuapp.onrender.com/api`).
2. Faça push para `main`. O workflow irá rodar, gerar `dist/` e publicar em `gh-pages`.
3. Habilite GitHub Pages no repositório apontando para a branch `gh-pages` (Settings → Pages).

Passos backend (Render):
1. Crie um novo Web Service no Render, conecte ao seu repositório e selecione a pasta `backend` como root (Root Directory = `backend`).
2. Build Command: `npm run build` (executa `tsc`), Start Command: `npm start` (ou `node dist/index.js`).
3. Adicione variáveis de ambiente no painel do Render:
   - `DATABASE_URL` = a URL do PostgreSQL que o Render cria para você (ou sua instância); use a URL interna se estiver usando Postgres no mesmo serviço.
   - `NODE_ENV` = `production`
4. Após deploy, copie a URL pública do serviço (ex: `https://api-meuapp.onrender.com`) e adicione ao secret `RENDER_BACKEND_URL` no GitHub.

Observações:
- O frontend usa `import.meta.env.VITE_API_BASE` quando definido; caso contrário usa `/api` (útil quando o backend e frontend ficam juntos). Para GitHub Pages, a variável `VITE_API_BASE` deve apontar para a URL do backend (ex: `https://api-meuapp.onrender.com/api`).
- Não é necessário manter um PC ligado: GitHub Pages e Render hospedam os sites/serviços na nuvem.

Troubleshooting (403 when pushing to gh-pages):

- If the Actions job fails with a 403 while pushing to `gh-pages`, check the repository's branch protection rules:
   - Settings → Branches → Branch protection rules: if `main` or `gh-pages` has required status checks or required reviews, the `GITHUB_TOKEN` may be blocked from pushing.
   - Either relax the rule for the `gh-pages` branch, or add a rule exception for GitHub Actions. Alternatively, create a personal access token (PAT) with repo write permissions and store it as a secret, then use that token in the workflow instead of `GITHUB_TOKEN`.

- Ensure the workflow file includes `permissions: contents: write` and `pages: write` (the repository already has this in `.github/workflows/deploy_front.yml`).

- If your repo is part of an organization with stricter policies, you may need Org Owner approval for Actions to create or push to branches.
