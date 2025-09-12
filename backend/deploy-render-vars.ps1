# Script para configurar variáveis de ambiente no Render
# Execute este script e copie as variáveis para o painel do Render

Write-Host "=== VARIÁVEIS DE AMBIENTE PARA O RENDER ===" -ForegroundColor Green
Write-Host ""
Write-Host "Copie as seguintes variáveis para o painel Environment Variables do Render:" -ForegroundColor Yellow
Write-Host ""

$envVars = @(
    @{Name="JWT_SECRET"; Value="sua_chave_jwt_64_caracteres_aqui"; Description="Chave JWT para autenticação"},
    @{Name="DATABASE_URL"; Value="postgresql://..."; Description="URL do banco PostgreSQL do Render"},
    @{Name="FRONTEND_ORIGIN"; Value="https://eusoumanoelnetto.github.io"; Description="Origem permitida pelo CORS"},
    @{Name="ADMIN_PANEL_KEY"; Value="OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA="; Description="Chave do painel admin"}
)

foreach ($var in $envVars) {
    Write-Host "$($var.Name)=" -NoNewline -ForegroundColor Cyan
    Write-Host "$($var.Value)" -ForegroundColor White
    Write-Host "  # $($var.Description)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "=== INSTRUÇÕES ===" -ForegroundColor Green
Write-Host "1. Acesse o dashboard do Render"
Write-Host "2. Vá para seu serviço backend"
Write-Host "3. Acesse 'Environment' no menu lateral"
Write-Host "4. Adicione cada variável acima"
Write-Host "5. Clique em 'Save Changes'"
Write-Host ""
Write-Host "🚀 Após configurar, o backend funcionará corretamente!" -ForegroundColor Green