#!/usr/bin/env node

// Script para testar as notificações push localmente
const http = require('http');

const postData = JSON.stringify({
    title: 'Teste Local',
    body: 'Verificando se as notificações funcionam!'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/push/send-test',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': 'OxQ6ppr/SYasGbB30fnyrZyh3x5e4fcbmI231UmBXVA=',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🧪 Testando notificações push...');
console.log('📡 Enviando para: http://localhost:3001/api/push/send-test');

const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📝 Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('📋 Resposta:');
            console.log(JSON.stringify(response, null, 2));
            
            if (res.statusCode === 200) {
                const results = response.results || [];
                const sentCount = results.filter(r => r.status === 'sent').length;
                console.log(`✅ Teste concluído: ${sentCount}/${results.length} notificações enviadas`);
                
                if (results.length === 0) {
                    console.log('ℹ️  Nenhum usuário inscrito para push notifications ainda');
                    console.log('💡 Instale o PWA em um dispositivo para testar');
                }
            } else {
                console.log('❌ Erro no teste');
            }
        } catch (e) {
            console.log('📄 Resposta (texto):', data);
        }
    });
});

req.on('error', (e) => {
    console.error('💥 Erro na requisição:', e.message);
    console.log('❓ Verifique se o servidor backend está rodando na porta 3001');
});

req.write(postData);
req.end();