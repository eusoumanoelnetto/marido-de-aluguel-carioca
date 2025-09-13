import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3004';

async function testAdminPanel() {
  console.log('🧪 Testando Painel Administrativo...');
  
  try {
    // 1. Gerar token de admin
    console.log('\n1️⃣ Gerando token de admin...');
    
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev_secret';
    
    const adminPayload = {
      email: 'admin@sistema.com',
      role: 'admin'
    };

    const adminToken = jwt.sign(adminPayload, secret, { expiresIn: '24h' });
    console.log('✅ Token de admin gerado');

    // 2. Buscar estatísticas do dashboard
    console.log('\n2️⃣ Buscando estatísticas do dashboard...');
    
    const statsResponse = await fetch(`${SERVER_URL}/api/admin-panel/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      console.log('✅ Estatísticas:', JSON.stringify(statsResult, null, 2));
    } else {
      console.log('❌ Erro ao buscar estatísticas:', await statsResponse.text());
    }

    // 3. Buscar histórico de mensagens
    console.log('\n3️⃣ Buscando histórico de mensagens...');
    
    const messagesResponse = await fetch(`${SERVER_URL}/api/admin-panel/messages?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (messagesResponse.ok) {
      const messagesResult = await messagesResponse.json();
      console.log('✅ Histórico de mensagens:', JSON.stringify(messagesResult, null, 2));
    } else {
      console.log('❌ Erro ao buscar mensagens:', await messagesResponse.text());
    }

    // 4. Buscar mensagens com filtros
    console.log('\n4️⃣ Testando filtros de mensagens...');
    
    const filteredResponse = await fetch(`${SERVER_URL}/api/admin-panel/messages?type=client_to_admin&status=unread`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (filteredResponse.ok) {
      const filteredResult = await filteredResponse.json();
      console.log('✅ Mensagens filtradas:', JSON.stringify(filteredResult, null, 2));
    } else {
      console.log('❌ Erro ao buscar mensagens filtradas:', await filteredResponse.text());
    }

    // 5. Buscar detalhes de uma mensagem específica
    console.log('\n5️⃣ Buscando detalhes de mensagem...');
    
    const detailResponse = await fetch(`${SERVER_URL}/api/admin-panel/messages/1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (detailResponse.ok) {
      const detailResult = await detailResponse.json();
      console.log('✅ Detalhes da mensagem:', JSON.stringify(detailResult, null, 2));
    } else {
      console.log('❌ Erro ao buscar detalhes:', await detailResponse.text());
    }

    // 6. Marcar mensagens como lidas
    console.log('\n6️⃣ Marcando mensagens como lidas...');
    
    const markReadResponse = await fetch(`${SERVER_URL}/api/admin-panel/messages/mark-read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        messageIds: ['1', '2']
      })
    });

    if (markReadResponse.ok) {
      const markReadResult = await markReadResponse.json();
      console.log('✅ Mensagens marcadas como lidas:', markReadResult);
    } else {
      console.log('❌ Erro ao marcar como lidas:', await markReadResponse.text());
    }

    // 7. Gerar relatório de atividade
    console.log('\n7️⃣ Gerando relatório de atividade...');
    
    const reportResponse = await fetch(`${SERVER_URL}/api/admin-panel/reports/activity?period=7d`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (reportResponse.ok) {
      const reportResult = await reportResponse.json();
      console.log('✅ Relatório de atividade:', JSON.stringify(reportResult, null, 2));
    } else {
      console.log('❌ Erro ao gerar relatório:', await reportResponse.text());
    }

    console.log('\n🎉 Teste do Painel Administrativo concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testAdminPanel().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Falha no teste:', error);
  process.exit(1);
});