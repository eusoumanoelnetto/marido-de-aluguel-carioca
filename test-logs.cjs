#!/usr/bin/env node

/**
 * Script de Teste - Simular Atividade Real
 * Este script cria dados de exemplo para testar o sistema de logs
 */

const API_BASE = 'https://marido-de-aluguel-carioca.onrender.com';
// Para teste local: const API_BASE = 'http://localhost:3001';

async function testSignup() {
  console.log('🧪 Testando cadastro de usuário...');
  
  const userData = {
    name: 'João Silva Teste',
    email: `teste.${Date.now()}@exemplo.com`,
    phone: '(21) 99999-9999',
    role: 'client',
    password: '123456',
    cep: '22071-900'
  };

  try {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Usuário cadastrado:', data.user.email);
      return data.token;
    } else {
      const error = await response.json();
      console.log('❌ Erro no cadastro:', error.message);
    }
  } catch (err) {
    console.log('❌ Erro de conexão:', err.message);
  }
  
  return null;
}

async function testServiceRequest(token) {
  console.log('🧪 Testando solicitação de serviço...');
  
  const serviceData = {
    id: `req_${Date.now()}`,
    clientName: 'João Silva Teste',
    clientEmail: 'teste@exemplo.com',
    address: 'Rua Teste, 123 - Copacabana, Rio de Janeiro',
    contact: '(21) 99999-9999',
    category: 'Elétrica',
    description: 'Teste de solicitação - trocar tomadas',
    status: 'Pendente',
    isEmergency: false,
    requestDate: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE}/api/services`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(serviceData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Solicitação criada:', data.id);
    } else {
      const error = await response.json();
      console.log('❌ Erro na solicitação:', error.message);
    }
  } catch (err) {
    console.log('❌ Erro de conexão:', err.message);
  }
}

async function checkLogs() {
  console.log('🧪 Verificando logs...');
  
  try {
    const response = await fetch(`${API_BASE}/api/users/events`, {
      headers: { 'X-Admin-Key': 'OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA=' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('📋 Eventos encontrados:', data.events.length);
      
      data.events.slice(0, 3).forEach(event => {
        const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log(`   - ${event.event_type}: ${eventData.name || eventData.category || 'Unknown'}`);
      });
    } else {
      console.log('❌ Erro ao buscar logs');
    }
  } catch (err) {
    console.log('❌ Erro de conexão:', err.message);
  }
}

async function runTest() {
  console.log('🚀 Iniciando teste de logs em tempo real...');
  console.log('');
  
  // 1. Cadastrar usuário
  const token = await testSignup();
  
  if (token) {
    console.log('');
    
    // 2. Criar solicitação de serviço
    await testServiceRequest(token);
    
    console.log('');
    
    // 3. Aguardar um pouco
    console.log('⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Verificar logs
    await checkLogs();
  }
  
  console.log('');
  console.log('✨ Teste concluído! Verifique o dashboard admin na aba "Erros" > "Logs de Atividade"');
  console.log('💡 Clique no botão "Atualizar" para ver os novos eventos');
}

// Executar teste se chamado diretamente
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { testSignup, testServiceRequest, checkLogs };