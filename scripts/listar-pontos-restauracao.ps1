#!/usr/bin/env pwsh
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("estavel", "funcional", "experimental")]
    [string]$Tipo,
    
    [Parameter(Mandatory=$false)]
    [int]$Ultimos
)

# Verificar se estamos em um repositorio Git
if (-not (Test-Path ".git")) {
    Write-Error "Erro: Este diretorio nao e um repositorio Git."
    exit 1
}

Write-Host "PONTOS DE RESTAURACAO DISPONIVEIS" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Buscar todas as tags de restauracao
$padrao = "restore-*"
if ($Tipo) {
    $padrao = "restore-*-$Tipo"
}

$tags = git tag -l $padrao --sort=-version:refname

if (-not $tags) {
    Write-Host "Nenhum ponto de restauracao encontrado." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para criar um ponto de restauracao:" -ForegroundColor Cyan
    Write-Host "   .\criar-ponto-restauracao.ps1 -Descricao 'Sua descricao aqui'" -ForegroundColor White
    exit 0
}

# Limitar quantidade se especificado
if ($Ultimos -and $Ultimos -gt 0) {
    $tags = $tags | Select-Object -First $Ultimos
}

$contador = 0
foreach ($tag in $tags) {
    $contador++
    
    # Extrair informacoes da tag
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
        
        # Verificar se e o commit atual
        $commitAtual = git rev-parse HEAD
        $isCurrent = $commit -eq $commitAtual
        
        # Determinar tipo
        $icone = switch ($tipoTag) {
            "estavel" { "[ESTAVEL]" }
            "funcional" { "[FUNCIONAL]" }
            "experimental" { "[EXPERIMENTAL]" }
            default { "[PONTO]" }
        }
        
        # Mostrar informacoes
        Write-Host ""
        Write-Host "$contador. $icone $tag" -ForegroundColor White
        if ($isCurrent) {
            Write-Host "   >>> POSICAO ATUAL <<<" -ForegroundColor Green
        }
        Write-Host "   Data: $dataFormatada as $horaFormatada" -ForegroundColor Gray
        Write-Host "   Tipo: $tipoTag" -ForegroundColor Gray
        Write-Host "   Commit: $commitCurto" -ForegroundColor Gray
        
        if ($mensagem) {
            Write-Host "   Descricao: $mensagem" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "Total: $contador pontos encontrados" -ForegroundColor Cyan

if ($tags.Count -gt 0) {
    Write-Host ""
    Write-Host "Para restaurar um ponto:" -ForegroundColor Cyan
    Write-Host "   .\restaurar-ponto.ps1 -Tag [nome-da-tag]" -ForegroundColor White
    Write-Host ""
    Write-Host "Para criar um novo ponto:" -ForegroundColor Cyan
    Write-Host "   .\criar-ponto-restauracao.ps1 -Descricao 'Sua descricao'" -ForegroundColor White
}