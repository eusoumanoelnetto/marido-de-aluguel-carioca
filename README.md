<div align="center">
   <img src="public/assets/banner_capa.png" alt="Banner Marido de Aluguel Carioca" style="max-width:100%;height:auto;" />
</div>

# Marido de Aluguel Carioca

Conectamos você aos melhores profissionais para resolver seus problemas domésticos.

---

## Instalação como App (PWA)

Você pode instalar o Marido de Aluguel Carioca como aplicativo no seu celular Android ou iPhone:

**Android:**
1. Abra o site no Chrome
2. Toque no menu (⋮)
3. Selecione **Instalar app** ou **Adicionar à tela inicial**

**iPhone (Safari):**
1. Abra o site no Safari
2. Toque no botão de compartilhamento (quadrado com seta para cima)
3. Toque em **Adicionar à Tela de Início**

O ícone do app será igual ao favicon do site.

---

## Sobre o Projeto

Este projeto é uma plataforma completa para conectar clientes e prestadores de serviços domésticos no Rio de Janeiro. O frontend foi desenvolvido em React + Vite, com integração Gemini 2.5 Pro (Google Studio AI) e backend Node.js rodando no Render.

---

## Ferramentas Utilizadas

- **Frontend:** React, Vite, Gemini 2.5 Pro (Google Studio AI)
- **Backend:** Node.js, Express, GPT-5 Mini (GitHub Copilot)
- **Correção de bugs:** Cloud Sonnet 4 (GitHub Copilot)
- **Hospedagem Backend:** Render
- **Deploy Frontend:** GitHub Pages

---

## Como rodar localmente

1. Clone o repositório:

   ```bash
   git clone https://github.com/eusoumanoelnetto/marido-de-aluguel-carioca.git
   cd marido-de-aluguel-carioca
   ```

2. Instale as dependências (raiz):

   ```bash
   npm install
   ```

3. Rode o frontend:

   ```bash
   npm run dev
   ```

4. Backend:

   ```bash
   cd backend
   npm install
   npm run dev   # (ou npm start, conforme script configurado)
   ```

5. Crie um arquivo `.env` (exemplo):

   ```bash
   GEMINI_API_KEY=coloque_sua_chave
   VITE_BASE=/marido-de-aluguel-carioca/
   ```

---

## Como fazer deploy

- **Frontend:** O deploy é feito automaticamente via GitHub Actions para a branch `gh-pages`.
- **Backend:** O deploy é feito no Render. Configure a variável de ambiente `RENDER_BACKEND_URL` no GitHub para apontar para o backend.

---

## Links Úteis

- [Vite - Deploy to GitHub Pages](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [Render - Hospedagem Backend](https://render.com/)
- [Google Studio AI](https://studio.bot.google.com/)
- [GitHub Copilot](https://github.com/features/copilot)
- [Cloud Sonnet](https://cloud.google.com/vertex-ai/docs/generative-ai/sonnet)

---

## Licença

MIT

Licença completa em `LICENSE`.

Veja também: [AI Studio App](https://ai.studio/apps/drive/1n5qqfZR86dV2YJaGQhbbN14p8ivaTKd4)

---

## Deploy no Render via GitHub

Siga esses passos para configurar deploy automático no [Render](https://render.com/) usando seu repositório GitHub:

### Backend

1. No dashboard do Render, clique em **New +** e selecione **Web Service**.
2. Conecte sua conta GitHub e escolha o repositório deste projeto.
3. Em **Root Directory**, selecione `backend`.
4. Configure:  
   - **Environment**: `Node`  
   - **Build Command**: `npm install && npm run build`  
   - **Start Command**: `npm start`  
5. Em **Environment**, adicione:  
   - `DATABASE_URL` com a URL do seu PostgreSQL (Render ou outro provider).  
6. Clique em **Create Web Service**.

### Frontend

1. No dashboard do Render, clique em **New +** e selecione **Static Site**.
2. Conecte o mesmo repositório do GitHub.
3. Em **Root Directory**, deixe em branco (raiz do projeto) ou selecione o diretório onde está o `index.html`.
4. Configure:  
   - **Build Command**: `npm install && npm run build`  
   - **Publish Directory**: `dist`  
5. (Opcional) Adicione variáveis de ambiente se precisar de chaves como `GEMINI_API_KEY`.
6. Clique em **Create Static Site**.

Após alguns minutos, seu front-end e backend estarão ativos com deploy contínuo a partir do GitHub.
