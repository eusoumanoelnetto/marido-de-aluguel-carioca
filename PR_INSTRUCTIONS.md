Resumo das mudanças

- Removido todo o código de mensagens da interface (cliente e prestador).
- Removido helper Firebase para mensagens (`services/firebaseMessages.ts`).
- Atualizado `components/ServiceDetailView.tsx`, `pages/ClientPage.tsx`, `pages/ProviderPage.tsx` para remover UI e imports de mensagens.

Por que foi feito

O objetivo foi deixar os painéis do cliente e do prestador "extremamente limpos" removendo toda lógica de mensagens e dependência Firebase, mantendo um backup antes das mudanças.

Recuperação (se necessário)

Se precisar restaurar a funcionalidade de mensagens, a branch com todo o estado anterior está disponível em:

  - `backup-before-reset-20250919-092124`

Para voltar ao estado anterior localmente:

```powershell
# buscar remote atualizado
git fetch origin
# criar branch local baseada no backup remoto
git checkout -b restore-messages origin/backup-before-reset-20250919-092124
```

Para reverter apenas o arquivo de helper Firebase:

```powershell
git checkout origin/backup-before-reset-20250919-092124 -- services/firebaseMessages.ts
git add services/firebaseMessages.ts
git commit -m "revert: restore firebaseMessages helper from backup"
```

Testes recomendados

- Rodar `npx tsc --noEmit` no workspace para verificar tipos.
- Rodar `npm run build` para garantir que o empacotamento está ok.

Notas

- O backup completo foi preservado em `backup-before-reset-20250919-092124` e a branch de limpeza com as remoções é `cleanup/remove-messages`.
- Se desejar que eu abra o PR e coloque reviewers, posso fazê-lo.
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
