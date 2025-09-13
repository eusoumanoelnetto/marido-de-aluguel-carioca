const jwt = require('jsonwebtoken');

const secret = 'dev_secret'; // Mesmo secret usado no authMiddleware

// Token para cliente
const clientToken = jwt.sign({
  userId: 'teste_cliente',
  userEmail: 'cliente@teste.com', 
  userRole: 'client'
}, secret, { expiresIn: '7d' });

// Token para admin
const adminToken = jwt.sign({
  userId: 'admin',
  userEmail: 'admin@example.com',
  userRole: 'admin'
}, secret, { expiresIn: '7d' });

console.log('🔑 Token Cliente:');
console.log(clientToken);
console.log('\n🔑 Token Admin:');
console.log(adminToken);