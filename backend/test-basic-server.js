const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Servidor HTTP básico funcionando!',
    timestamp: new Date().toISOString() 
  }));
});

server.listen(3003, () => {
  console.log('✅ Servidor HTTP básico rodando na porta 3003');
});

server.on('error', (error) => {
  console.error('❌ Erro no servidor HTTP básico:', error);
});

// Testar conexão
setTimeout(() => {
  const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Auto-teste: Status ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('✅ Auto-teste resposta:', data));
  });

  req.on('error', (e) => {
    console.error(`❌ Auto-teste erro: ${e.message}`);
  });

  req.end();
}, 1000);