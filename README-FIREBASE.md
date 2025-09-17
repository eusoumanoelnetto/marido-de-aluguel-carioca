# Integração Firebase (Firestore) - Mensagens

Este documento descreve como configurar o Firebase para habilitar o chat em tempo real no projeto.

1) Criar projeto no Firebase
- Acesse https://console.firebase.google.com
- Crie um novo projeto ou selecione um existente

2) Registrar app web
- No painel do projeto, clique em "Adicionar app" (ícone </>)
- Informe um nome (ex: marido-de-aluguel-web) e registre
- Ao finalizar, copie o objeto de configuração exibido (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)

3) Configurar variáveis de ambiente local
- Na raiz do projeto, crie um arquivo `.env.local` (não comitar)
- Cole as variáveis conforme exemplo em `.env.example`:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

4) Reiniciar dev server
- Pare o servidor de dev (se estiver rodando) e execute:

```powershell
npm run dev
```

5) Testar
- Acesse o app, abra a tela de detalhes do serviço e envie uma mensagem. As mensagens devem ser armazenadas no Firestore e aparecer em tempo real.

Observações:
- O backend continuará sendo responsável por orçamentos e lógica de negócio.
- Não comite suas credenciais no repositório.
