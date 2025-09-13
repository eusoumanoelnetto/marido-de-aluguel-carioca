import { io } from 'socket.io-client';
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';

async function testWebSocketClient() {
  console.log('🧪 Testando cliente WebSocket...');
  
  try {
    // 1. Primeiro obter um token de teste
    console.log('🔑 Obtendo token de teste...');
    const tokenResponse = await fetch(`${SERVER_URL}/api/messages/test-token`);
    
    if (!tokenResponse.ok) {
      throw new Error(`HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✅ Token obtido:', tokenData.user);
    
    // 2. Conectar ao WebSocket com o token
    console.log('🔌 Conectando ao WebSocket...');
    const socket = io(SERVER_URL, {
      auth: {
        token: tokenData.token
      },
      timeout: 5000
    });
    
    // 3. Configurar event listeners
    socket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket!', socket.id);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Erro de conexão WebSocket:', error.message);
    });
    
    socket.on('notification', (data) => {
      console.log('🔔 Notificação recebida:', data);
    });
    
    socket.on('newMessage', (data) => {
      console.log('💬 Nova mensagem:', data);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado:', reason);
    });
    
    // 4. Aguardar conexão e testar envio de mensagem
    await new Promise((resolve) => {
      socket.on('connect', async () => {
        console.log('📤 Enviando mensagem de teste...');
        
        try {
          // Enviar mensagem via API REST
          const messageResponse = await fetch(`${SERVER_URL}/api/messages/send-to-admin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenData.token}`
            },
            body: JSON.stringify({
              title: 'Teste WebSocket',
              message: 'Esta é uma mensagem de teste para verificar as notificações WebSocket!'
            })
          });
          
          if (messageResponse.ok) {
            const result = await messageResponse.json();
            console.log('✅ Mensagem enviada:', result);
          } else {
            console.log('❌ Erro ao enviar mensagem:', await messageResponse.text());
          }
        } catch (error) {
          console.log('❌ Erro ao enviar mensagem:', error);
        }
        
        // Aguardar um pouco para receber notificações
        setTimeout(() => {
          socket.disconnect();
          resolve(true);
        }, 3000);
      });
    });
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testWebSocketClient().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Falha no teste:', error);
  process.exit(1);
});