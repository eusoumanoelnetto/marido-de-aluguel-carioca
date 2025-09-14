#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Lista todos os pontos de restauração disponíveis

.DESCRIPTION
    Este script lista todas as tags de restauração criadas, ordenadas por data,
    mostrando informações detalhadas sobre cada ponto.

.PARAMETER Tipo
    Filtrar por tipo de ponto: estavel, funcional, experimental (opcional)

.PARAMETER Ultimos
    Mostrar apenas os N pontos mais recentes (padrão: todos)

.EXAMPLE
    .\listar-pontos-restauracao.ps1
    .\listar-pontos-restauracao.ps1 -Tipo estavel
    .\listar-pontos-restauracao.ps1 -Ultimos 5

.NOTES
    Mostra apenas tags que seguem o padrão: restore-YYYYMMDD-HHMMSS-tipo
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("estavel", "funcional", "experimental")]
    [string]$Tipo,
    
    [Parameter(Mandatory=$false)]
    [int]$Ultimos
)

# Verificar se estamos em um repositório Git
if (-not (Test-Path ".git")) {
    Write-Error "❌ Erro: Este diretório não é um repositório Git."
    exit 1
}

Write-Host "📋 PONTOS DE RESTAURAÇÃO DISPONÍVEIS" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Buscar todas as tags de restauração
$padrao = "restore-*"
if ($Tipo) {
    $padrao = "restore-*-$Tipo"
}

$tags = git tag -l $padrao --sort=-version:refname

if (-not $tags) {
    Write-Host "❌ Nenhum ponto de restauração encontrado." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Para criar um ponto de restauração:" -ForegroundColor Cyan
    Write-Host "   .\criar-ponto-restauracao.ps1 -Descricao 'Sua descrição aqui'" -ForegroundColor White
    exit 0
}

# Limitar quantidade se especificado
if ($Ultimos -and $Ultimos -gt 0) {
    $tags = $tags | Select-Object -First $Ultimos
}

$contador = 0
foreach ($tag in $tags) {
    $contador++
    
    # Extrair informações da tag
    $partes = $tag -split "-"
    if ($partes.Length -ge 4) {
        $data = $partes[1]
        $hora = $partes[2]
        $tipoTag = $partes[3]
        
        # Formatar data e hora
        $dataFormatada = $data.Substring(6,2) + "/" + $data.Substring(4,2) + "/" + $data.Substring(0,4)
        $horaFormatada = $hora.Substring(0,2) + ":" + $hora.Substring(2,2) + ":" + $hora.Substring(4,2)
        
        # Obter mensagem da tag
        $mensagem = git tag -l --format='%(contents)' $tag
        
        # Obter commit hash
        $commit = git rev-list -n 1 $tag
        $commitCurto = $commit.Substring(0,7)
        
        # Verificar se é o commit atual
        $commitAtual = git rev-parse HEAD
        $isCurrent = $commit -eq $commitAtual
        
        # Determinar ícone e cor do tipo
        $icone = switch ($tipoTag) {
            "estavel" { "🟢" }
            "funcional" { "🟡" }
            "experimental" { "🔴" }
            default { "📌" }
        }
        
        # Mostrar informações
        Write-Host ""
        Write-Host "$contador. $icone $tag" -ForegroundColor White
        if ($isCurrent) {
            Write-Host "   👆 POSIÇÃO ATUAL" -ForegroundColor Green
        }
        Write-Host "   📅 Data: $dataFormatada às $horaFormatada" -ForegroundColor Gray
        Write-Host "   🏷️  Tipo: $tipoTag" -ForegroundColor Gray
        Write-Host "   🔗 Commit: $commitCurto" -ForegroundColor Gray
        
        if ($mensagem) {
            # Extrair apenas a descrição (remover o prefixo padrão)
            $descricao = $mensagem -replace "^PONTO DE RESTAURAÇÃO \[.*?\]: ", ""
            $descricao = $descricao -replace " \(criado em .*?\)$", ""
            Write-Host "   📝 $descricao" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "📊 Total: $contador pontos encontrados" -ForegroundColor Cyan

if ($tags.Count -gt 0) {
    Write-Host ""
    Write-Host "💡 Para restaurar um ponto:" -ForegroundColor Cyan
    Write-Host "   .\restaurar-ponto.ps1 -Tag [nome-da-tag]" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Para criar um novo ponto:" -ForegroundColor Cyan
    Write-Host "   .\criar-ponto-restauracao.ps1 -Descricao 'Sua descrição'" -ForegroundColor White
}