import fetch from 'node-fetch';

async function testSimpleAPI() {
  console.log('🧪 Testando API simples...');
  
  try {
    // Health check
    console.log('1️⃣ Testando health check...');
    const healthResponse = await fetch('http://localhost:3001/');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Token endpoint
    console.log('2️⃣ Testando endpoint de token...');
    const tokenResponse = await fetch('http://localhost:3001/api/messages/test-token');
    const tokenData = await tokenResponse.json();
    console.log('✅ Token:', tokenData);
    
    console.log('🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testSimpleAPI();