#!/usr/bin/env node

/**
 * Teste Específico - Solicitação de Serviço
 * Testa se as solicitações estão sendo registradas nos logs
 */

const API_BASE = 'https://marido-de-aluguel-carioca.onrender.com';

async function testServiceOnly() {
  console.log('🔧 Teste específico de solicitação de serviço');
  console.log('');

  // Dados de teste para solicitação
  const serviceData = {
    id: `teste_${Date.now()}`,
    clientName: 'João Teste Logs',
    clientEmail: 'teste.logs@exemplo.com',
    address: 'Rua Teste dos Logs, 123 - Ipanema, Rio de Janeiro',
    contact: '(21) 99999-1234',
    category: 'Hidráulica',
    description: 'TESTE DE LOGS - Vazamento na pia da cozinha',
    status: 'Pendente',
    isEmergency: false,
    requestDate: new Date().toISOString()
  };

  console.log('📋 Dados da solicitação:');
  console.log(`   - ID: ${serviceData.id}`);
  console.log(`   - Cliente: ${serviceData.clientName}`);
  console.log(`   - Categoria: ${serviceData.category}`);
  console.log(`   - Endereço: ${serviceData.address}`);
  console.log('');

  try {
    console.log('🚀 Enviando solicitação...');
    const response = await fetch(`${API_BASE}/api/services`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serviceData)
    });

    console.log(`📊 Status da resposta: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Solicitação criada com sucesso!');
      console.log(`   - ID retornado: ${result.id}`);
    } else {
      const error = await response.json();
      console.log('❌ Erro na solicitação:', error.message);
      return false;
    }
  } catch (err) {
    console.log('❌ Erro de conexão:', err.message);
    return false;
  }

  console.log('');
  console.log('⏳ Aguardando 3 segundos para o evento ser registrado...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verificar se o evento foi registrado
  try {
    console.log('📋 Verificando eventos registrados...');
    const response = await fetch(`${API_BASE}/api/users/events`, {
      headers: { 'X-Admin-Key': 'OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA=' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Total de eventos: ${data.events.length}`);
      
      const serviceEvents = data.events.filter(e => e.event_type === 'service_request');
      console.log(`🔧 Eventos de solicitação: ${serviceEvents.length}`);
      
      if (serviceEvents.length > 0) {
        console.log('');
        console.log('📋 Últimos eventos de solicitação:');
        serviceEvents.slice(0, 3).forEach((event, i) => {
          const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.log(`   ${i+1}. ${eventData.category} - ${eventData.clientName}`);
          console.log(`      Endereço: ${eventData.address}`);
          console.log(`      Criado: ${event.created_at}`);
        });
        
        console.log('');
        console.log('✅ SUCESSO! As solicitações estão sendo registradas nos logs.');
      } else {
        console.log('');
        console.log('❌ PROBLEMA! Nenhum evento de solicitação encontrado.');
        console.log('💡 Verifique se o backend está registrando os eventos corretamente.');
      }
      
      console.log('');
      console.log('📋 Todos os tipos de eventos encontrados:');
      const eventTypes = [...new Set(data.events.map(e => e.event_type))];
      eventTypes.forEach(type => {
        const count = data.events.filter(e => e.event_type === type).length;
        console.log(`   - ${type}: ${count}`);
      });
      
    } else {
      console.log('❌ Erro ao buscar eventos:', response.status);
    }
  } catch (err) {
    console.log('❌ Erro ao verificar eventos:', err.message);
  }

  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('1. Acesse o dashboard admin');
  console.log('2. Vá para aba "Erros"');
  console.log('3. Clique em "Atualizar" nos logs');
  console.log('4. Verifique se a solicitação aparece');
  console.log('');
  console.log('💡 Se não aparecer, verifique os logs do servidor backend');
}

// Executar teste
testServiceOnly().catch(console.error);