// Teste simples para verificar se conseguimos criar um servidor HTTP básico
const express = require('express');
const app = express();
const PORT = 3002; // Usar porta diferente para teste

app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor teste rodando na porta ${PORT}`);
});

server.on('error', (error) => {
  console.error('❌ Erro no servidor teste:', error);
});

// Teste de conectividade após 2 segundos
setTimeout(async () => {
  try {
    const response = await fetch(`http://localhost:${PORT}/test`);
    const data = await response.json();
    console.log('🎉 Teste de conectividade:', data);
  } catch (error) {
    console.error('❌ Falha no teste de conectividade:', error.message);
  }
}, 2000);