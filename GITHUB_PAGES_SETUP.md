# 🚀 Como Configurar o Painel Admin no GitHub Pages

## Passo 1: Preparar o Repositório

1. **Commit e Push das mudanças:**
```bash
git add dashboard-admin/
git commit -m "feat: Add GitHub Pages support for admin panel"
git push origin main
```

## Passo 2: Ativar GitHub Pages

1. Vá para seu repositório no GitHub: `https://github.com/eusoumanoelnetto/marido-de-aluguel-carioca`

2. Clique em **Settings** (Configurações)

3. Role até a seção **Pages** no menu lateral esquerdo

4. Em **Source**, selecione:
   - **Deploy from a branch**
   - **Branch: main**
   - **Folder: / (root)**

5. Clique em **Save**

## Passo 3: Aguardar Deploy

O GitHub Pages levará alguns minutos para fazer o deploy. Você receberá uma notificação quando estiver pronto.

## Passo 4: Acessar o Painel

Após o deploy, o painel estará disponível em:

**🔗 URL Principal:** 
`https://eusoumanoelnetto.github.io/marido-de-aluguel-carioca/dashboard-admin/`

**🔗 URL Alternativa (página inicial):**
`https://eusoumanoelnetto.github.io/marido-de-aluguel-carioca/dashboard-admin/index.html`

## Passo 5: Configurar CORS no Backend (Importante!)

Para que o painel funcione, você precisa adicionar o domínio do GitHub Pages nas configurações CORS do seu backend Render:

1. Vá para o dashboard do Render
2. Acesse seu serviço backend
3. Vá em **Environment**
4. Adicione/edite a variável:
   ```
   FRONTEND_ORIGIN=https://eusoumanoelnetto.github.io
   ```
5. **Redeploy** o serviço

## Passo 6: Testar o Painel

1. Acesse a URL do GitHub Pages
2. Clique em "Acessar Dashboard"
3. Verifique se os dados aparecem corretamente
4. Se houver erro CORS, revise o Passo 5

## 🔧 Troubleshooting

### Erro CORS
- Verifique se `FRONTEND_ORIGIN` está configurado no backend
- Confirme se a URL está correta (sem barra no final)

### Dados não aparecem
- Abra F12 → Console para ver logs
- Verifique se o backend está online
- Confirme se `ADMIN_PANEL_KEY` está correto

### Página não carrega
- Aguarde alguns minutos após ativar Pages
- Verifique se o commit foi feito corretamente
- Confirme se a pasta `dashboard-admin` existe no repositório

---

**✅ Após seguir estes passos, seu painel administrativo estará online e acessível via GitHub Pages!**
