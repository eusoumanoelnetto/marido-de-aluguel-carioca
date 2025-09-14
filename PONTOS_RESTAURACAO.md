# 📌 Sistema de Pontos de Restauração

Este sistema permite criar, listar e restaurar pontos específicos do projeto usando Git tags de forma automatizada e segura.

## 🎯 Visão Geral

O sistema consiste em três scripts PowerShell que facilitam o controle de versões:

- **`criar-ponto-restauracao.ps1`** - Cria novos pontos de restauração
- **`listar-pontos-restauracao.ps1`** - Lista pontos disponíveis
- **`restaurar-ponto.ps1`** - Volta para um ponto específico

## 🔧 Scripts Disponíveis

### 1. Criar Ponto de Restauração

```powershell
.\scripts\criar-ponto-restauracao.ps1 -Descricao "Sistema de notificações funcionando"
.\scripts\criar-ponto-restauracao.ps1 -Descricao "Antes de grandes mudanças" -Tipo experimental
```

**Parâmetros:**
- `-Descricao` (obrigatório): Descrição do ponto
- `-Tipo` (opcional): `estavel`, `funcional`, `experimental` (padrão: estavel)

**Tipos de Pontos:**
- 🟢 **estavel**: Funcionalidades completas e testadas
- 🟡 **funcional**: Funciona mas pode ter melhorias pendentes  
- 🔴 **experimental**: Mudanças em teste, pode ter problemas

### 2. Listar Pontos de Restauração

```powershell
.\scripts\listar-pontos-restauracao.ps1
.\scripts\listar-pontos-restauracao.ps1 -Tipo estavel
.\scripts\listar-pontos-restauracao.ps1 -Ultimos 5
```

**Parâmetros:**
- `-Tipo` (opcional): Filtrar por tipo específico
- `-Ultimos` (opcional): Mostrar apenas os N mais recentes

### 3. Restaurar Ponto

```powershell
.\scripts\restaurar-ponto.ps1 -Tag restore-20241214-143022-estavel
.\scripts\restaurar-ponto.ps1 -Tag restore-20241214-143022-estavel -Forcar
```

**Parâmetros:**
- `-Tag` (obrigatório): Nome da tag do ponto
- `-Forcar` (opcional): Pula confirmações (use com cuidado)
- `-CriarBackup` (opcional): Cria backup antes da restauração (padrão: true)

## 🚀 Uso Recomendado

### Workflow Típico

1. **Antes de mudanças importantes:**
   ```powershell
   .\scripts\criar-ponto-restauracao.ps1 -Descricao "Admin panel funcionando perfeitamente"
   ```

2. **Após implementar uma funcionalidade:**
   ```powershell
   .\scripts\criar-ponto-restauracao.ps1 -Descricao "Sistema de notificações implementado" -Tipo funcional
   ```

3. **Para experimentos:**
   ```powershell
   .\scripts\criar-ponto-restauracao.ps1 -Descricao "Testando nova UI" -Tipo experimental
   ```

4. **Listar pontos disponíveis:**
   ```powershell
   .\scripts\listar-pontos-restauracao.ps1
   ```

5. **Voltar quando necessário:**
   ```powershell
   .\scripts\restaurar-ponto.ps1 -Tag restore-20241214-143022-estavel
   ```

## ⚡ Funcionalidades Especiais

### ✅ Verificações de Segurança
- Detecta mudanças não commitadas
- Oferece opção de commitá-las antes da criação
- Cria backups automáticos antes de restaurações
- Confirmação obrigatória para operações destrutivas

### 📊 Informações Detalhadas
- Timestamp preciso (data e hora)
- Descrições personalizadas
- Indicação da posição atual
- Hash do commit para referência

### 🔄 Sincronização
- Push automático de tags para repositório remoto
- Suporte a `--force-with-lease` para segurança
- Compatibilidade com fluxos de trabalho em equipe

## 📋 Exemplos Práticos

### Cenário 1: Desenvolvimento de Nova Feature
```powershell
# Criar ponto antes de começar
.\scripts\criar-ponto-restauracao.ps1 -Descricao "Estado estável antes de nova feature"

# ... desenvolver feature ...

# Salvar progresso funcional
.\scripts\criar-ponto-restauracao.ps1 -Descricao "Feature XYZ implementada" -Tipo funcional

# ... testes e refinamentos ...

# Marcar como estável
.\scripts\criar-ponto-restauracao.ps1 -Descricao "Feature XYZ completa e testada" -Tipo estavel
```

### Cenário 2: Resolução de Problemas
```powershell
# Listar pontos disponíveis
.\scripts\listar-pontos-restauracao.ps1

# Voltar para último ponto estável
.\scripts\restaurar-ponto.ps1 -Tag restore-20241214-143022-estavel

# Trabalhar na correção
# ... fix bugs ...

# Criar novo ponto após correção
.\scripts\criar-ponto-restauracao.ps1 -Descricao "Bugs corrigidos - sistema funcionando"
```

## 🛡️ Segurança e Boas Práticas

### ✅ Sempre Fazer
- Criar pontos antes de mudanças significativas
- Usar descrições claras e informativas
- Escolher o tipo apropriado (estavel/funcional/experimental)
- Revisar a lista de mudanças antes de restaurar

### ❌ Evitar
- Forçar restaurações sem verificar mudanças pendentes
- Usar descrições vagas como "teste" ou "mudança"
- Criar muitos pontos experimentais sem limpeza
- Restaurar sem criar backup quando há trabalho importante

## 🔧 Configuração Inicial

Os scripts estão prontos para uso, mas você pode personalizar:

1. **Localização dos scripts:** Mantenha na pasta `scripts/`
2. **Política de push:** Configurável em cada script
3. **Padrões de nomenclatura:** Modificáveis nos scripts

## 📞 Solução de Problemas

### Problema: "Este diretório não é um repositório Git"
**Solução:** Execute os scripts apenas na raiz do projeto (onde está o `.git`)

### Problema: "Tag não encontrada"
**Solução:** Use `listar-pontos-restauracao.ps1` para ver tags disponíveis

### Problema: "Erro ao fazer push"
**Solução:** Verifique conexão com repositório remoto e permissões

## 📈 Vantagens do Sistema

✅ **Simplicidade**: Comandos intuitivos e diretos
✅ **Segurança**: Verificações e backups automáticos  
✅ **Rastreabilidade**: Histórico completo com timestamps
✅ **Flexibilidade**: Diferentes tipos para diferentes necessidades
✅ **Integração**: Funciona com qualquer repositório Git
✅ **Automação**: Reduz erros manuais no controle de versão

---

*💡 **Dica:** Use este sistema sempre que quiser experimentar algo novo ou antes de fazer mudanças que podem quebrar o código funcionando!*