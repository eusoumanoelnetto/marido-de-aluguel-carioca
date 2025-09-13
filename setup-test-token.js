// Script para configurar token de teste no localStorage do navegador
// Cole este código no console do navegador (F12) quando estiver em http://localhost:5173

const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImNsaWVudGVAdGVzdGUuY29tIiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTc1Nzc3MjI1MiwiaZXhwIjoxNzU3ODU4NjUyfQ.Caimqv8M6GZbDYulgF1hj7JG_L57BSnWo6oPnyWmZ7w';

// Configurar dados de teste no localStorage
localStorage.setItem('token', testToken);
localStorage.setItem('user', JSON.stringify({
    name: 'Cliente Teste',
    email: 'cliente@teste.com',
    phone: '21999999999',
    role: 'client',
    cep: '20000000'
}));

console.log('✅ Token de teste configurado!');
console.log('📧 Usuário: cliente@teste.com');
console.log('🔄 Recarregue a página para fazer login automático');

// Recarregar a página para ativar o login
window.location.reload();