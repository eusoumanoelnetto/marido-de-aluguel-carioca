try {
    $headers = @{
        'X-Admin-Key' = 'OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA='
    }
    
    Write-Host "Testando API remota..."
    $response = Invoke-RestMethod -Uri 'https://marido-de-aluguel-carioca.onrender.com/api/admin/stats' -Headers $headers -Method GET
    
    Write-Host "Sucesso! Dados recebidos:"
    Write-Host "Total Clientes: $($response.totalClientes)"
    Write-Host "Total Prestadores: $($response.totalPrestadores)"
    Write-Host "Serviços Ativos: $($response.servicosAtivos)"
    Write-Host "Serviços Concluídos Hoje: $($response.servicosConcluidosHoje)"
    Write-Host "Erros Recentes: $($response.errosRecentes)"
    Write-Host "Erros Críticos: $($response.errosCriticos)"
    
} catch {
    Write-Host "Erro ao acessar API:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    }
}
