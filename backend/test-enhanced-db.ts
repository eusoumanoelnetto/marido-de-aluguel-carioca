import { dbManager } from './src/db-enhanced';

async function testEnhancedDB() {
  console.log('🧪 Testando sistema de banco aprimorado...');
  
  try {
    await dbManager.connect();
    console.log('✅ Conexão estabelecida!');
    console.log('📊 Tipo de banco:', dbManager.dbType);
    console.log('🔗 Conectado:', dbManager.isConnected);

    // Testar inserção de dados
    console.log('\n📝 Testando inserção de mensagem...');
    const messageId = Date.now().toString();
    
    if (dbManager.dbType === 'postgresql') {
      await dbManager.query(
        'INSERT INTO messages (id, from_admin, to_user_email, title, message) VALUES ($1, $2, $3, $4, $5)',
        [messageId, true, 'teste@teste.com', 'Teste Enhanced DB', 'Mensagem de teste do sistema aprimorado']
      );
    } else {
      await dbManager.query(
        'INSERT INTO messages (id, from_admin, to_user_email, title, message) VALUES (?, ?, ?, ?, ?)',
        [messageId, 1, 'teste@teste.com', 'Teste Enhanced DB', 'Mensagem de teste do sistema aprimorado']
      );
    }
    
    console.log('✅ Mensagem inserida com ID:', messageId);

    // Testar busca
    console.log('\n🔍 Testando busca de mensagens...');
    const result = await dbManager.query('SELECT * FROM messages WHERE to_user_email = ?', ['teste@teste.com']);
    console.log('📊 Mensagens encontradas:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('📋 Primeira mensagem:', {
        id: result.rows[0].id,
        title: result.rows[0].title,
        created_at: result.rows[0].created_at
      });
    }

    await dbManager.close();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

testEnhancedDB();