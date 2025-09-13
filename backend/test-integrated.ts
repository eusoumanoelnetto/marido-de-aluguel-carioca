// Script de teste integrado para mensagens bidirecionais

// DEFINIR PORTA ANTES DE IMPORTAR
process.env.PORT = '3003';

import { app, startServer } from './src/index';
import { dbManager } from './src/db-enhanced';

async function testMessagingSystem() {
  console.log('🧪 Iniciando teste do sistema de mensagens...');
  
  try {
    // Conectar ao banco
    await dbManager.connect();
    console.log('✅ Banco conectado');
    
    // Criar usuários de teste se não existirem
    try {
      await dbManager.query(`
        INSERT OR IGNORE INTO users (email, name, role, password_hash, created_at)
        VALUES 
        ('cliente@teste.com', 'Cliente Teste', 'client', 'hash_teste', datetime('now')),
        ('admin@example.com', 'Admin Sistema', 'admin', 'hash_admin', datetime('now'))
      `);
      console.log('✅ Usuários de teste criados/verificados');
    } catch (e) {
      console.log('ℹ️ Usuários já existem ou erro:', e);
    }
    
    // Iniciar servidor (porta já definida no início do arquivo)
    const server = startServer();
    console.log('✅ Servidor iniciado na porta 3003');
    
    // Aguardar um pouco para garantir que o servidor está rodando
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fazer chamadas HTTP para testar
    const http = require('http');
    
    function makeRequest(options: any, data?: string): Promise<any> {
      return new Promise((resolve, reject) => {
        const req = http.request(options, (res: any) => {
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
        if (data) {
          req.write(data);
        }
        req.end();
      });
    }
    
    const clientToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0ZV9jbGllbnRlIiwidXNlckVtYWlsIjoiY2xpZW50ZUB0ZXN0ZS5jb20iLCJ1c2VyUm9sZSI6ImNsaWVudCIsImlhdCI6MTc1Nzc4MDk3OSwiZXhwIjoxNzU4Mzg1Nzc5fQ.J8_52dXtoZwR3K8Tw2W4zL3jaPnB-miS4LyEjD0MjE0';
    const adminToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInVzZXJFbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidXNlclJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Nzc4MDk3OSwiZXhwIjoxNzU4Mzg1Nzc5fQ.60WWUerqQvh0MK4tww4etvt6yQic-cX8cigeQX4TI1c';
    
    // Teste 1: Cliente busca mensagens
    console.log('\n1. 🔍 Cliente busca mensagens...');
    try {
      const messages = await makeRequest({
        hostname: 'localhost',
        port: 3003,
        path: '/api/messages',
        method: 'GET',
        headers: { 'Authorization': clientToken }
      });
      console.log('✅ Mensagens do cliente:', messages);
    } catch (error: any) {
      console.log('❌ Erro:', error.message);
    }
    
    // Teste 2: Cliente envia mensagem para admin
    console.log('\n2. 📤 Cliente envia mensagem para admin...');
    try {
      const messageData = JSON.stringify({
        title: 'Pedido de ajuda',
        message: 'Olá, preciso de ajuda com meu pedido',
        service_id: 'test_service_123'
      });
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3003,
        path: '/api/messages/send-to-admin',
        method: 'POST',
        headers: {
          'Authorization': clientToken,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(messageData)
        }
      }, messageData);
      
      console.log('✅ Mensagem enviada:', response);
    } catch (error: any) {
      console.log('❌ Erro:', error.message);
    }
    
    // Teste 3: Admin busca mensagens
    console.log('\n3. 👨‍💼 Admin busca mensagens...');
    try {
      const adminMessages = await makeRequest({
        hostname: 'localhost',
        port: 3003,
        path: '/api/messages/admin',
        method: 'GET',
        headers: { 'Authorization': adminToken }
      });
      console.log('✅ Mensagens para admin:', adminMessages);
    } catch (error: any) {
      console.log('❌ Erro:', error.message);
    }
    
    console.log('\n🎉 Teste concluído!');
    server.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

testMessagingSystem();