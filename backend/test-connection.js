const http = require('http');

console.log('🔍 Testando conexão com o servidor na porta 3002...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`✅ Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Resposta:', data);
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro: ${e.message}`);
});

req.on('timeout', () => {
  console.error('❌ Timeout: Conexão demorou mais de 5 segundos');
  req.destroy();
});

req.end();