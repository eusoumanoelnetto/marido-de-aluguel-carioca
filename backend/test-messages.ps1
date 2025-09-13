# Script de teste para sistema de mensagens bidirecionais

$baseUrl = "http://localhost:3002/api"
$clientToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0ZV9jbGllbnRlIiwidXNlckVtYWlsIjoiY2xpZW50ZUB0ZXN0ZS5jb20iLCJ1c2VyUm9sZSI6ImNsaWVudCIsImlhdCI6MTczNzY1ODgwMSwiZXhwIjo0ODkxMjU4ODAxfQ.Pz6EoYMoqhvtlLJ5-73yPNYn56LBSmXyHZFZP4vAEO8"
$adminToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInVzZXJFbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidXNlclJvbGUiOiJhZG1pbiIsImlhdCI6MTczNzY1ODgwMSwiZXhwIjo0ODkxMjU4ODAxfQ.sC1PTZJ6jj_QcjdJ9qUGFD5HnX9GUfIDrLzSvNhrzUE"

Write-Host "🧪 Testando Sistema de Mensagens Bidirecionais" -ForegroundColor Green

# Teste 1: Cliente busca suas mensagens
Write-Host "`n1. Cliente busca suas mensagens..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages" -Method GET -Headers @{"Authorization"=$clientToken}
    Write-Host "✅ Mensagens do cliente:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Cliente envia mensagem para admin
Write-Host "`n2. Cliente envia mensagem para admin..." -ForegroundColor Yellow
$messageData = @{
    content = "Olá, preciso de ajuda com meu pedido"
    service_id = "test_service_123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages/send-to-admin" -Method POST -Body $messageData -ContentType "application/json" -Headers @{"Authorization"=$clientToken}
    Write-Host "✅ Mensagem enviada:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Admin busca mensagens
Write-Host "`n3. Admin busca todas as mensagens..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages/admin" -Method GET -Headers @{"Authorization"=$adminToken}
    Write-Host "✅ Mensagens para admin:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: Admin responde para cliente
Write-Host "`n4. Admin responde para cliente..." -ForegroundColor Yellow
$adminReply = @{
    content = "Olá! Vou verificar seu pedido e retorno em breve."
    to_user_email = "cliente@teste.com"
    service_id = "test_service_123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages/admin/send" -Method POST -Body $adminReply -ContentType "application/json" -Headers @{"Authorization"=$adminToken}
    Write-Host "✅ Resposta do admin enviada:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 5: Cliente verifica novas mensagens
Write-Host "`n5. Cliente verifica novas mensagens..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/messages" -Method GET -Headers @{"Authorization"=$clientToken}
    Write-Host "✅ Mensagens atualizadas do cliente:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Teste completo!" -ForegroundColor Green