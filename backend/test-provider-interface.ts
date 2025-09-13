import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3003';

async function testProviderInterface() {
  console.log('🧪 Testando Interface de Mensagens para Providers...');
  
  try {
    // 1. Gerar token de teste para provider
    console.log('\n1️⃣ Gerando token de teste para provider...');
    
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev_secret';
    
    const providerPayload = {
      email: 'provider@teste.com',
      role: 'provider'
    };

    const providerToken = jwt.sign(providerPayload, secret, { expiresIn: '24h' });
    console.log('✅ Token de provider gerado');

    // 2. Gerar token para cliente também
    const clientPayload = {
      email: 'cliente@teste.com',
      role: 'client'
    };

    const clientToken = jwt.sign(clientPayload, secret, { expiresIn: '24h' });
    console.log('✅ Token de cliente gerado');

    // 3. Provider envia mensagem para cliente
    console.log('\n2️⃣ Provider enviando mensagem para cliente...');
    
    const sendResponse = await fetch(`${SERVER_URL}/api/messages/provider/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerToken}`
      },
      body: JSON.stringify({
        clientEmail: 'cliente@teste.com',
        title: 'Orçamento do seu serviço',
        message: 'Olá! Analisei sua solicitação e posso realizar o serviço por R$ 150. O trabalho será feito na próxima terça-feira. Confirma?'
      })
    });

    if (sendResponse.ok) {
      const sendResult = await sendResponse.json();
      console.log('✅ Mensagem enviada:', sendResult);
    } else {
      console.log('❌ Erro ao enviar mensagem:', await sendResponse.text());
    }

    // 4. Provider busca suas mensagens
    console.log('\n3️⃣ Provider buscando suas mensagens...');
    
    const getResponse = await fetch(`${SERVER_URL}/api/messages/provider`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${providerToken}`
      }
    });

    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ Mensagens do provider:', JSON.stringify(getResult, null, 2));
    } else {
      console.log('❌ Erro ao buscar mensagens:', await getResponse.text());
    }

    // 5. Cliente envia mensagem para provider (simulando resposta)
    console.log('\n4️⃣ Cliente enviando mensagem para admin (simulando resposta)...');
    
    const clientResponse = await fetch(`${SERVER_URL}/api/messages/send-to-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        title: 'Resposta sobre orçamento',
        message: 'Perfeito! Confirmo o serviço para terça-feira. Obrigado!'
      })
    });

    if (clientResponse.ok) {
      const clientResult = await clientResponse.json();
      console.log('✅ Cliente respondeu:', clientResult);
    } else {
      console.log('❌ Erro na resposta do cliente:', await clientResponse.text());
    }

    // 6. Provider responde ao cliente
    console.log('\n5️⃣ Provider respondendo ao cliente...');
    
    const replyResponse = await fetch(`${SERVER_URL}/api/messages/provider/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerToken}`
      },
      body: JSON.stringify({
        clientEmail: 'cliente@teste.com',
        message: 'Ótimo! Estarei aí na terça às 14h. Obrigado pela confiança!'
      })
    });

    if (replyResponse.ok) {
      const replyResult = await replyResponse.json();
      console.log('✅ Provider respondeu:', replyResult);
    } else {
      console.log('❌ Erro na resposta do provider:', await replyResponse.text());
    }

    // 7. Buscar mensagens novamente para ver o histórico
    console.log('\n6️⃣ Verificando histórico final...');
    
    const finalResponse = await fetch(`${SERVER_URL}/api/messages/provider`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${providerToken}`
      }
    });

    if (finalResponse.ok) {
      const finalResult = await finalResponse.json();
      console.log('✅ Histórico final:', JSON.stringify(finalResult, null, 2));
    } else {
      console.log('❌ Erro ao buscar histórico:', await finalResponse.text());
    }

    console.log('\n🎉 Teste da Interface de Providers concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testProviderInterface().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Falha no teste:', error);
  process.exit(1);
});