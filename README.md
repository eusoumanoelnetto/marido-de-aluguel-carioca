<div align="center">
   <img src="public/assets/banner_capa.png" alt="Banner Marido de Aluguel Carioca" style="max-width:100%;height:auto;" />
</div>

# Marido de Aluguel Carioca

Conectamos você aos melhores profissionais para resolver seus problemas domésticos.

---

## História

Meu primeiro app — criado numa época em que eu ainda não sabia escrever "PWA" corretamente. Uma amiga sugeriu que eu tentasse desenvolver um aplicativo para "marido de aluguel" porque, no meu condomínio, eu sempre fazia favores para os vizinhos e quase nunca recebia agradecimentos. A partir dessa ideia nasceu o Marido de Aluguel Carioca.

O projeto nasceu para tornar mais fácil conectar moradores do Rio de Janeiro com prestadores de serviços domésticos, priorizando uma experiência leve no celular (PWA), simplicidade no uso e deploy acessível. Se quiser, conte mais detalhes e eu adapto o texto para ficar com a sua voz.


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
- **Deploy Frontend:** GitHub Pages / Vercel

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

### Opção 1: GitHub Pages (existente)
- Deploy automático via GitHub Actions para a branch `gh-pages`.

### Opção 2: Vercel (novo)
1. Faça push das alterações (já contém `vercel.json`).
2. No dashboard do Vercel clique em "Add New..." → "Project" e importe este repositório.
3. Build Command: deixe em branco (auto) ou use `npm run vercel-build`.
4. Output / Dist Dir: `dist`.
5. Variáveis de ambiente (Environment Variables):
   - `GEMINI_API_KEY` (frontend)
   - `VITE_API_BASE` (URL pública do backend, ex: https://seu-backend.onrender.com/api ou apenas https://seu-backend.onrender.com se as rotas já incluem /api)
6. Deploy.

Rotas SPA: o arquivo `vercel.json` inclui rewrite para `index.html`, então navegação direta em subrotas funciona.

### Backend (Render)
- Continua no Render. Defina `DATABASE_URL`, e assegure CORS permitido para o domínio do Vercel.

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

### Deploy no Vercel (detalhado)

Se quiser usar Vercel em vez de Render Static Site ou GitHub Pages:
1. Remova `VITE_BASE` do `.env` (não é necessário no Vercel; base `/`).
2. Defina `VITE_API_BASE` apontando para o backend (ex: `https://seu-backend.onrender.com`).
3. (Opcional) Ative Analytics / Speed Insights do Vercel se desejar.
4. Teste rotas internas (refresh em `/provider` etc.) — devem funcionar pelo rewrite SPA.

Após alguns minutos, seu front-end e backend estarão ativos com deploy contínuo a partir do GitHub.

---

## Fluxo de Orçamento (Prestador)

Estados possíveis do serviço:
- Pendente → aguardando o prestador digitar e enviar valor
- Orçamento Enviado → prestador enviou o valor; cliente pode aceitar ou recusar
- Aceito → cliente aceitou o orçamento; vira compromisso na agenda
- Finalizado → serviço concluído
- Recusado → recusa de qualquer lado antes de ser aceito

Proteções implementadas contra perda do valor digitado:
1. Polling global pausa ao focar o campo de orçamento (evento `mdac:pausePolling`).
2. Enquanto o prestador digita (`editing` = true) o valor local não é sobrescrito por atualizações vindas do backend.
3. Ao desfocar, o polling é retomado (`mdac:resumePolling`) e o valor é normalizado para formato `0.00` (pt-BR adapta com vírgula na digitação).
4. Mudança de request (ID diferente) reseta estado local e evita carregar valor anterior incorretamente.
5. Botões ficam desabilitados durante envio para evitar duplo clique.

Eventos / integrações:
- `mdac:notify` (CustomEvent) usado para disparar toasts de feedback (sucesso, erro, info).
- `mdac:viewRequest` pode ser disparado globalmente com `{ detail: { id } }` para abrir diretamente um serviço específico.

Possíveis melhorias futuras:
- Debounce e máscara monetária com Intl.NumberFormat.
- Histórico de alterações de status para auditoria.
- Cancelamento / reenvio de orçamento antes de o cliente decidir.

---
