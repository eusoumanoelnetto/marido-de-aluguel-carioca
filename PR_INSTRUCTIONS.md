PR: firebase-messages -> main

Link para criar PR no GitHub (clique para abrir):
https://github.com/eusoumanoelnetto/marido-de-aluguel-carioca/compare/main...firebase-messages?expand=1

Descrição curta:
Integra Firebase Firestore para mensagens em tempo real com fallback para API. Inclui:
- `services/firebaseConfig.ts`, `services/firebaseMessages.ts`
- Atualização em `components/ServiceDetailView.tsx` para assinar/ler env
- Exemplo `.env.example` e instruções em `README-FIREBASE.md`

Testes locais:
1. Preencha as variáveis `VITE_FIREBASE_*` em `.env.local` (não comite).
2. Inicie frontend: `npm run dev`.
3. Inicie backend: `cd backend && npm run dev` (ou `npm run build && node dist/index.js`).
4. Abra o app e teste o envio de mensagens.

Observações:
- O arquivo `.env.local` está no `.gitignore`.
- Se ocorrerem erros 500 no backend, consulte `backend_stderr.log` e `backend_stdout.log`.

Próximo passo sugerido:
- Crie o PR via link acima, revise e mescle quando pronto. Após merge, eu atualizo o deploy se desejar.
