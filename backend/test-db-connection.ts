import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com PostgreSQL...');
  console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'Não encontrada');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não está configurada no .env');
    return;
  }
  
  // Tentar primeiro uma conexão simples para diagnóstico
  const url = new URL(process.env.DATABASE_URL);
  console.log('🌐 Host:', url.hostname);
  console.log('🔌 Porta:', url.port || '5432');
  console.log('🗄️  Database:', url.pathname.substring(1));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Tentar sempre com SSL
    connectionTimeoutMillis: 15000, // 15 segundos
    idleTimeoutMillis: 30000,
    max: 10
  });

  try {
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar uma query simples
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Hora do servidor:', result.rows[0].current_time);
    
    // Verificar se a tabela messages existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
      );
    `);
    
    console.log('📋 Tabela messages existe:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  Criando tabela messages...');
      await client.query(`
        CREATE TABLE messages (
          id VARCHAR(255) PRIMARY KEY,
          from_admin BOOLEAN NOT NULL DEFAULT true,
          from_user_email VARCHAR(255),
          to_user_email VARCHAR(255),
          to_admin BOOLEAN DEFAULT false,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_urgent BOOLEAN DEFAULT false,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Tabela messages criada!');
    }
    
    client.release();
    await pool.end();
    
  } catch (error: any) {
    console.error('❌ Erro na conexão:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    
    // Tentar diagnosticar o problema
    if (error.message && error.message.includes('timeout')) {
      console.log('💡 Sugestão: Problema de timeout - verificar rede/firewall');
    } else if (error.message && error.message.includes('ENOTFOUND')) {
      console.log('💡 Sugestão: Host não encontrado - verificar URL do banco');
    } else if (error.message && error.message.includes('authentication')) {
      console.log('💡 Sugestão: Problema de autenticação - verificar credenciais');
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();