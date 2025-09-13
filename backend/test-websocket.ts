// Script de teste para WebSocket notifications

// DEFINIR PORTA ANTES DE IMPORTAR
process.env.PORT = '3004';

import { app, startServer } from './src/index';
import { dbManager } from './src/db-enhanced';
import { io as Client } from 'socket.io-client';

async function testWebSocketNotifications() {
  console.log('🧪 Iniciando teste de notificações WebSocket...');
  
  try {
    // Conectar ao banco e criar usuários
    await dbManager.connect();
    console.log('✅ Banco conectado');
    
    try {
      await dbManager.query(`
        INSERT OR IGNORE INTO users (email, name, role, password_hash, created_at)
        VALUES 
        ('cliente@teste.com', 'Cliente Teste', 'client', 'hash_teste', datetime('now')),
        ('admin@example.com', 'Admin Sistema', 'admin', 'hash_admin', datetime('now'))
      `);
      console.log('✅ Usuários de teste criados/verificados');
    } catch (e) {
      console.log('ℹ️ Usuários já existem');
    }
    
    // Iniciar servidor
    const server = startServer();
    console.log('✅ Servidor iniciado na porta 3004');
    
    // Aguardar servidor inicializar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tokens de teste
    const clientToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0ZV9jbGllbnRlIiwidXNlckVtYWlsIjoiY2xpZW50ZUB0ZXN0ZS5jb20iLCJ1c2VyUm9sZSI6ImNsaWVudCIsImlhdCI6MTc1Nzc4MDk3OSwiZXhwIjoxNzU4Mzg1Nzc5fQ.J8_52dXtoZwR3K8Tw2W4zL3jaPnB-miS4LyEjD0MjE0';
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInVzZXJFbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidXNlclJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Nzc4MDk3OSwiZXhwIjoxNzU4Mzg1Nzc5fQ.60WWUerqQvh0MK4tww4etvt6yQic-cX8cigeQX4TI1c';
    
    // Conectar cliente admin via WebSocket
    console.log('\n🔌 Conectando admin via WebSocket...');
    const adminSocket = Client('http://localhost:3004', {
      auth: { token: adminToken }
    });
    
    adminSocket.on('connect', () => {
      console.log('✅ Admin conectado via WebSocket');
    });
    
    adminSocket.on('new-message-for-admin', (data) => {
      console.log('🔔 Admin recebeu notificação:', data);
    });
    
    adminSocket.on('connect_error', (error) => {
      console.log('❌ Erro de conexão admin:', error.message);
    });
    
    // Aguardar conexão
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enviar mensagem via HTTP API
    console.log('\n📤 Enviando mensagem do cliente para admin...');
    const http = require('http');
    
    const messageData = JSON.stringify({
      title: 'Teste WebSocket',
      message: 'Esta mensagem deveria gerar uma notificação WebSocket',
      service_id: 'test_websocket'
    });
    
    const postData = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3004,
        path: '/api/messages/send-to-admin',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(messageData)
        }
      }, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      });
      
      req.on('error', reject);
      req.write(messageData);
      req.end();
    });
    
    console.log('✅ Resposta da API:', postData);
    
    // Aguardar notificação
    console.log('\n⏳ Aguardando notificação WebSocket...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🎉 Teste de WebSocket concluído!');
    
    adminSocket.disconnect();
    server.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

testWebSocketNotifications();