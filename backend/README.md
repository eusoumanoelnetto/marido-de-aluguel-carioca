# Marido de Aluguel Hub - Backend

Este é o servidor backend para a aplicação, agora configurado para usar um banco de dados PostgreSQL para persistência de dados.

## Como Rodar Localmente

### Pré-requisito: Criar um Banco de Dados PostgreSQL

Recomendamos usar o serviço gratuito do [Render](https://render.com/) para criar seu banco de dados online.

1.  **Crie uma conta no Render.**
2.  No seu dashboard, clique em **"New +"** e selecione **"PostgreSQL"**.
3.  Dê um nome para o seu banco (ex: `marido-hub-db`), escolha o plano **"Free"** e clique em **"Create Database"**.
4.  Aguarde alguns minutos para o banco ser criado.
5.  Na página do seu banco de dados no Render, vá para a seção **"Connect"** e copie a URL do campo **"External Database URL"**. Ela se parecerá com `postgres://user:password@host.render.com/database`. (A URL externa é necessária para conectar do seu computador local).

### 1. Configure o Ambiente

-   Na pasta `backend/`, crie um arquivo chamado `.env`.
-   Dentro do arquivo `.env`, adicione a linha abaixo, colando a URL que você copiou do Render:
    ```
    DATABASE_URL=postgres://user:password@host.render.com/database
    ```

### 2. Navegue até a pasta do backend

```bash
cd backend
```

### 3. Instale as dependências

Se você já rodou `npm install` antes, pode pular. Caso contrário, ou se houver novas dependências (como agora), rode novamente:
```bash
npm install
```

### 4. Inicie o servidor em modo de desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3001`. Ele se conectará automaticamente ao seu banco de dados no Render. As tabelas necessárias (`users` e `service_requests`) serão criadas automaticamente na primeira vez que o servidor iniciar.

## Solução de Problemas

-   **Erro `getaddrinfo ENOTFOUND`:** Isso significa que a `DATABASE_URL` está incorreta ou o endereço não pôde ser encontrado. Verifique se você está usando a **"External Database URL"** do Render no seu arquivo `.env` local.

-   **Erro `read ECONNRESET`:** Este erro geralmente indica um problema na conexão SSL. Os bancos de dados do Render exigem conexões SSL. O código no arquivo `src/db.ts` já inclui a configuração necessária para isso. Se você encontrar este erro, confirme que seu código está atualizado.

## Deploying to Render

Para colocar seu backend no ar, siga estes passos:

1.  **Crie um repositório no GitHub** e envie o código do projeto para ele.
2.  No seu dashboard do [Render](https://render.com/), clique em **"New +"** e selecione **"Web Service"**.
3.  Conecte sua conta do GitHub e selecione o repositório do projeto.
4.  Configure o serviço web com as seguintes informações:
    -   **Name**: Dê um nome para o seu serviço (ex: `marido-hub-api`).
    -   **Root Directory**: `backend` (Isso diz ao Render para rodar os comandos a partir desta pasta).
    -   **Environment**: `Node`.
    -   **Build Command**: `npm install && npm run build`
    -   **Start Command**: `npm start`
5.  Vá para a seção **"Environment"** e adicione a variável de ambiente:
    -   **Key**: `DATABASE_URL`
    -   **Value**: Cole a URL do seu banco de dados PostgreSQL do Render, mas desta vez, use a **"Internal Database URL"**. Isso garante a melhor performance entre os serviços do Render.
6.  Clique em **"Create Web Service"**. O Render irá fazer o build e o deploy da sua aplicação. Após alguns minutos, seu backend estará online!