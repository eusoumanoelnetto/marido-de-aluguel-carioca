param(
    [Parameter(Mandatory=$true)]
    [int]$Numero
)

# Busca o commit hash do workflow (PR) pelo número
$commit = git log --oneline --grep "#${Numero}" | Select-Object -First 1

if (-not $commit) {
    Write-Host "❌ Não foi encontrado workflow com #$Numero no histórico de commits." -ForegroundColor Red
    exit 1
}

# Extrai o hash do commit
$hash = $commit -split ' ' | Select-Object -First 1

Write-Host "Voltando para o workflow #$Numero (commit $hash)..." -ForegroundColor Yellow

git reset --hard $hash

Write-Host "✔️ Projeto restaurado para o workflow #$Numero!" -ForegroundColor Green
