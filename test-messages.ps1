# Script para testar o sistema de mensagens

# URL da API
$API_BASE = "http://localhost:3001"
$ADMIN_KEY = "OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA="

Write-Host "=== Testando Sistema de Mensagens ===" -ForegroundColor Green

# Teste 1: Enviar mensagem PV para usuário específico
Write-Host "`n1. Enviando mensagem PV para cliente..." -ForegroundColor Yellow

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-key" = $ADMIN_KEY
}

$body = @{
    toUserEmail = "cliente@teste.com"
    title = "Mensagem de Teste"
    message = "Esta é uma mensagem de teste enviada através da API"
    isUrgent = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/messages/send" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Mensagem enviada com sucesso!" -ForegroundColor Green
    Write-Host "Resposta: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro ao enviar mensagem:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Teste 2: Buscar mensagens para usuário (requer token)
Write-Host "`n2. Testando busca de mensagens..." -ForegroundColor Yellow
Write-Host "Nota: Este teste requer autenticação de usuário" -ForegroundColor Gray

Write-Host "`n=== Teste Concluído ===" -ForegroundColor Green