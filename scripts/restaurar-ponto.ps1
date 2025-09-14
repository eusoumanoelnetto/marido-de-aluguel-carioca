#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Restaura o projeto para um ponto de restauração específico

.DESCRIPTION
    Este script permite voltar o projeto para um ponto de restauração criado anteriormente,
    com opções de backup e confirmação de segurança.

.PARAMETER Tag
    Nome da tag do ponto de restauração (obrigatório)

.PARAMETER Forcar
    Força a restauração sem confirmação (use com cuidado)

.PARAMETER CriarBackup
    Cria um backup automático antes da restauração (padrão: true)

.EXAMPLE
    .\restaurar-ponto.ps1 -Tag restore-20241214-143022-estavel
    .\restaurar-ponto.ps1 -Tag restore-20241214-143022-estavel -Forcar

.NOTES
    ATENÇÃO: Esta operação pode sobrescrever mudanças não commitadas!
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Tag,
    
    [Parameter(Mandatory=$false)]
    [switch]$Forcar,
    
    [Parameter(Mandatory=$false)]
    [bool]$CriarBackup = $true
)

# Verificar se estamos em um repositório Git
if (-not (Test-Path ".git")) {
    Write-Error "❌ Erro: Este diretório não é um repositório Git."
    exit 1
}

# Verificar se a tag existe
$tagExiste = git tag -l $Tag
if (-not $tagExiste) {
    Write-Error "❌ Erro: A tag '$Tag' não foi encontrada."
    Write-Host ""
    Write-Host "💡 Para listar tags disponíveis:" -ForegroundColor Cyan
    Write-Host "   .\listar-pontos-restauracao.ps1" -ForegroundColor White
    exit 1
}

# Obter informações da tag
$mensagemTag = git tag -l --format='%(contents)' $Tag
$commitTag = git rev-list -n 1 $Tag
$commitAtual = git rev-parse HEAD

# Verificar se já estamos neste ponto
if ($commitTag -eq $commitAtual) {
    Write-Host "✅ Você já está no ponto de restauração '$Tag'!" -ForegroundColor Green
    exit 0
}

Write-Host "🏷️  RESTAURAÇÃO DE PONTO" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Gray
Write-Host "📌 Tag: $Tag" -ForegroundColor Yellow
Write-Host "📝 Descrição: $mensagemTag" -ForegroundColor White
Write-Host "🔗 Commit: $($commitTag.Substring(0,7))" -ForegroundColor Gray
Write-Host ""

# Verificar mudanças não commitadas
$status = git status --porcelain
if ($status -and -not $Forcar) {
    Write-Warning "⚠️  ATENÇÃO: Há mudanças não commitadas que serão perdidas:"
    git status --short
    Write-Host ""
}

# Criar backup se solicitado
if ($CriarBackup -and -not $Forcar) {
    Write-Host "💾 Criando backup automático..." -ForegroundColor Cyan
    $timestampBackup = Get-Date -Format "yyyyMMdd-HHmmss"
    $tagBackup = "backup-antes-restauracao-$timestampBackup"
    
    # Committar mudanças pendentes no backup
    if ($status) {
        git add .
        git commit -m "backup automático antes de restaurar para $Tag"
    }
    
    git tag -a $tagBackup -m "BACKUP AUTOMÁTICO: Criado antes de restaurar para $Tag ($(Get-Date -Format 'dd/MM/yyyy HH:mm:ss'))"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup criado: $tagBackup" -ForegroundColor Green
    } else {
        Write-Warning "⚠️  Erro ao criar backup, mas continuando..."
    }
    Write-Host ""
}

# Confirmação final
if (-not $Forcar) {
    Write-Host "❓ CONFIRMAÇÃO NECESSÁRIA" -ForegroundColor Red
    Write-Host "Esta operação irá:" -ForegroundColor Yellow
    Write-Host "  • Sobrescrever mudanças não commitadas" -ForegroundColor Yellow
    Write-Host "  • Voltar o projeto para o estado da tag $Tag" -ForegroundColor Yellow
    Write-Host "  • Potencialmente perder trabalho não salvo" -ForegroundColor Yellow
    Write-Host ""
    
    $confirmacao = Read-Host "Tem certeza que deseja continuar? Digite 'CONFIRMO' para prosseguir"
    
    if ($confirmacao -ne "CONFIRMO") {
        Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔄 Iniciando restauração..." -ForegroundColor Cyan

# Fazer a restauração
git reset --hard $Tag

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Erro durante a restauração."
    exit 1
}

Write-Host "✅ Restauração concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Estado atual:" -ForegroundColor Cyan
Write-Host "  • Posição: $(git log -1 --format='%h - %s')" -ForegroundColor White
Write-Host "  • Data: $(git log -1 --format='%ci')" -ForegroundColor White

# Perguntar sobre push
if (-not $Forcar) {
    Write-Host ""
    $push = Read-Host "Deseja fazer push das mudanças para o repositório remoto? (s/N)"
    if ($push -eq "s" -or $push -eq "S") {
        Write-Host "🚀 Fazendo push..." -ForegroundColor Cyan
        git push --force-with-lease origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
        } else {
            Write-Warning "⚠️  Erro ao fazer push. Verifique o repositório remoto."
        }
    }
}

Write-Host ""
Write-Host "🎉 Projeto restaurado para o ponto: $Tag" -ForegroundColor Green