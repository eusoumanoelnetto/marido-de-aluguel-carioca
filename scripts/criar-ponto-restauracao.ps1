#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Cria um ponto de restauração usando Git tags

.DESCRIPTION
    Este script cria uma tag Git com timestamp e descrição personalizada,
    permitindo voltar facilmente a este ponto no futuro.

.PARAMETER Descricao
    Descrição do ponto de restauração (obrigatório)

.PARAMETER Tipo
    Tipo do ponto: estavel, funcional, experimental (padrão: estavel)

.EXAMPLE
    .\criar-ponto-restauracao.ps1 -Descricao "Sistema de notificações funcionando"
    .\criar-ponto-restauracao.ps1 -Descricao "Antes de grandes mudanças" -Tipo experimental

.NOTES
    As tags criadas seguem o padrão: restore-YYYYMMDD-HHMMSS-tipo
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Descricao,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("estavel", "funcional", "experimental")]
    [string]$Tipo = "estavel"
)

# Verificar se estamos em um repositório Git
if (-not (Test-Path ".git")) {
    Write-Error "❌ Erro: Este diretório não é um repositório Git."
    exit 1
}

# Verificar se há mudanças não commitadas
$status = git status --porcelain
if ($status) {
    Write-Warning "⚠️  Há mudanças não commitadas:"
    git status --short
    
    $confirma = Read-Host "Deseja commitá-las antes de criar o ponto de restauração? (s/N)"
    if ($confirma -eq "s" -or $confirma -eq "S") {
        $mensagemCommit = Read-Host "Digite a mensagem do commit"
        if ([string]::IsNullOrWhiteSpace($mensagemCommit)) {
            $mensagemCommit = "checkpoint: $Descricao"
        }
        
        git add .
        git commit -m $mensagemCommit
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "❌ Erro ao fazer commit."
            exit 1
        }
        
        Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
    }
}

# Gerar timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Criar nome da tag
$nomeTag = "restore-$timestamp-$Tipo"

# Criar a tag com descrição
$mensagemTag = "PONTO DE RESTAURAÇÃO [$Tipo]: $Descricao (criado em $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss'))"

Write-Host "🏷️  Criando ponto de restauração..." -ForegroundColor Cyan
git tag -a $nomeTag -m $mensagemTag

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erro ao criar a tag."
    exit 1
}

Write-Host "✅ Ponto de restauração criado com sucesso!" -ForegroundColor Green
Write-Host "📌 Tag: $nomeTag" -ForegroundColor Yellow
Write-Host "📝 Descrição: $Descricao" -ForegroundColor White

# Perguntar se deve fazer push da tag
$pushTag = Read-Host "Deseja fazer push da tag para o repositório remoto? (S/n)"
if ($pushTag -ne "n" -and $pushTag -ne "N") {
    Write-Host "🚀 Fazendo push da tag..." -ForegroundColor Cyan
    git push origin $nomeTag
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tag enviada para o repositório remoto!" -ForegroundColor Green
    } else {
        Write-Warning "⚠️  Erro ao enviar tag, mas ela foi criada localmente."
    }
}

Write-Host ""
Write-Host "📋 Para voltar a este ponto no futuro, use:" -ForegroundColor Cyan
Write-Host "   .\restaurar-ponto.ps1 -Tag $nomeTag" -ForegroundColor White
Write-Host ""
Write-Host "📋 Para listar todos os pontos disponíveis:" -ForegroundColor Cyan
Write-Host "   .\listar-pontos-restauracao.ps1" -ForegroundColor White