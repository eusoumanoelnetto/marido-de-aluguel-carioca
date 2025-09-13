# Script para testar busca de mensagens no frontend

# URL da API
$API_BASE = "http://localhost:3001"

Write-Host "=== Testando Busca de Mensagens ===" -ForegroundColor Green

# Primeiro vamos verificar se existe um endpoint para criar usuário de teste
Write-Host "`n1. Verificando se há usuários de teste..." -ForegroundColor Yellow

# Tentar fazer login com um usuário de teste
$loginData = @{
    email = "cliente@teste.com"
    password = "123456"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    Write-Host "Tentando fazer login..." -ForegroundColor Gray
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/login" -Method POST -Headers $headers -Body $loginData
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    $token = $loginResponse.token
    
    # Buscar mensagens
    Write-Host "`n2. Buscando mensagens para o usuário..." -ForegroundColor Yellow
    $authHeaders = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $messagesResponse = Invoke-RestMethod -Uri "$API_BASE/api/messages/user" -Method GET -Headers $authHeaders
    Write-Host "✅ Mensagens encontradas:" -ForegroundColor Green
    Write-Host ($messagesResponse | ConvertTo-Json -Depth 3) -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nTentando criar usuário de teste..." -ForegroundColor Yellow
    
    # Tentar criar usuário
    $userData = @{
        name = "Cliente Teste"
        email = "cliente@teste.com"
        phone = "21999999999"
        cep = "20000000"
        role = "client"
        password = "123456"
    } | ConvertTo-Json
    
    try {
        $createResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/register" -Method POST -Headers $headers -Body $userData
        Write-Host "✅ Usuário criado! Tentando login novamente..." -ForegroundColor Green
        
        # Tentar login novamente
        $loginResponse = Invoke-RestMethod -Uri "$API_BASE/api/auth/login" -Method POST -Headers $headers -Body $loginData
        $token = $loginResponse.token
        
        # Buscar mensagens
        $authHeaders = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $messagesResponse = Invoke-RestMethod -Uri "$API_BASE/api/messages/user" -Method GET -Headers $authHeaders
        Write-Host "✅ Mensagens encontradas:" -ForegroundColor Green
        Write-Host ($messagesResponse | ConvertTo-Json -Depth 3) -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ Erro ao criar usuário:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host "`n=== Teste Concluído ===" -ForegroundColor Green