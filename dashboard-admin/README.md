# Painel Administrativo - Marido de Aluguel Carioca

Este é o painel administrativo para gerenciar usuários, serviços e estatísticas do aplicativo Marido de Aluguel Carioca.

## 🚀 Acesso ao Painel

O painel está hospedado no GitHub Pages:
**[https://eusoumanoelnetto.github.io/marido-de-aluguel-carioca/dashboard-admin/](https://eusoumanoelnetto.github.io/marido-de-aluguel-carioca/dashboard-admin/)**

## 📋 Funcionalidades

- **Visão Geral**: Estatísticas em tempo real (clientes, prestadores, serviços)
- **Gestão de Usuários**: Listar, editar e remover usuários
- **Notificações**: Enviar avisos para clientes e prestadores
- **Monitoramento**: Acompanhar erros e logs do sistema
- **Backup**: Ferramentas de backup e limpeza de dados

## 🔐 Autenticação

O painel utiliza autenticação via `X-Admin-Key` header, conectando-se diretamente ao backend em produção.

## 🛠️ Configuração

O painel está configurado para conectar automaticamente ao backend em:
- **Produção**: `https://marido-de-aluguel-carioca.onrender.com`
- **Chave Admin**: Configurada via `ADMIN_PANEL_KEY` no backend

## 📱 Interface

Interface responsiva com:
- Design moderno e intuitivo
- Status em tempo real (Online/Offline)
- Navegação por abas
- Cards informativos com estatísticas

---

**Desenvolvido para o projeto Marido de Aluguel Carioca**
