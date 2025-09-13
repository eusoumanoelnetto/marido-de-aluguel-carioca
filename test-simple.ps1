# Script para testar mensagens end-to-end

$API_BASE = "http://localhost:3001"

Write-Host "=== Teste End-to-End do Sistema de Mensagens ===" -ForegroundColor Green

Write-Host "`n1. Obtendo token de teste..." -ForegroundColor Yellow
try {
    $tokenResponse = Invoke-RestMethod -Uri "$API_BASE/api/messages/test-token" -Method GET
    Write-Host "OK Token obtido:" -ForegroundColor Green
    $token = $tokenResponse.token
    Write-Host "Usuario: $($tokenResponse.user.email)" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO ao obter token:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Buscando mensagens existentes..." -ForegroundColor Yellow
try {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $messagesResponse = Invoke-RestMethod -Uri "$API_BASE/api/messages/user" -Method GET -Headers $authHeaders
    Write-Host "OK Mensagens encontradas: $($messagesResponse.messages.Count)" -ForegroundColor Green
    
    foreach ($msg in $messagesResponse.messages) {
        $urgentText = if ($msg.is_urgent) { "[URGENTE]" } else { "" }
        $readText = if ($msg.is_read) { "[Lida]" } else { "[Nao lida]" }
        Write-Host "  - $($msg.title) $urgentText $readText" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERRO ao buscar mensagens:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n3. Enviando nova mensagem via admin..." -ForegroundColor Yellow
try {
    $adminHeaders = @{
        "Content-Type" = "application/json"
        "x-admin-key" = "OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA="
    }
    
    $messageBody = @{
        toUserEmail = "cliente@teste.com"
        title = "Nova mensagem de teste"
        message = "Esta mensagem foi enviada durante o teste end-to-end"
        isUrgent = $false
    } | ConvertTo-Json
    
    $sendResponse = Invoke-RestMethod -Uri "$API_BASE/api/messages/send" -Method POST -Headers $adminHeaders -Body $messageBody
    Write-Host "OK Nova mensagem enviada!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao enviar mensagem:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n4. Verificando mensagens atualizadas..." -ForegroundColor Yellow
try {
    $messagesResponse = Invoke-RestMethod -Uri "$API_BASE/api/messages/user" -Method GET -Headers $authHeaders
    Write-Host "OK Total de mensagens agora: $($messagesResponse.messages.Count)" -ForegroundColor Green
    
    # Mostrar apenas a mensagem mais recente
    $latestMessage = $messagesResponse.messages | Sort-Object created_at -Descending | Select-Object -First 1
    if ($latestMessage) {
        Write-Host "Mensagem mais recente:" -ForegroundColor Cyan
        Write-Host "   Titulo: $($latestMessage.title)" -ForegroundColor White
        Write-Host "   Conteudo: $($latestMessage.message)" -ForegroundColor White
    }
} catch {
    Write-Host "ERRO ao verificar mensagens:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=== Teste End-to-End Concluido ===" -ForegroundColor Green
Write-Host "Agora teste no frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Token para usar no localStorage: $token" -ForegroundColor Gray