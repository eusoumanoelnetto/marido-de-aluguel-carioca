<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1n5qqfZR86dV2YJaGQhbbN14p8ivaTKd4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

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
