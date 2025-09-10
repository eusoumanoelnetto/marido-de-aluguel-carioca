// Tipos amplos para compatibilidade com diferentes ambientes de checagem
import pool from '../db';

// Retorna estatísticas para o dashboard admin
export const getDashboardStats = async (req: any, res: any) => {
  const role = (req as any).userRole;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }

  try {
    // Total de clientes
    const clientes = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['client']);
    // Total de prestadores
    const prestadores = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['provider']);
    
    // Debug completo: ver todos os dados
    const allServices = await pool.query('SELECT id, status, "clientEmail", "providerEmail", "requestDate" FROM service_requests ORDER BY "requestDate" DESC LIMIT 20');
    const statusDebug = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM service_requests 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
  // Logs suprimidos para evitar ruído em produção
    
    // Serviços ativos: considerar também 'Pendente' e 'Orçamento Enviado'
    const servicosAtivos = await pool.query(`
      SELECT COUNT(*) FROM service_requests 
      WHERE status IN ('Em andamento', 'Aceito', 'Pendente', 'Orçamento Enviado')
      AND "providerEmail" IS NOT NULL
    `);
    
    // Serviços concluídos hoje
    const hoje = new Date().toISOString().split('T')[0];
    const servicosConcluidosHoje = await pool.query(
      `SELECT COUNT(*) FROM service_requests WHERE status = $1 AND "requestDate"::date = $2`,
      ['Concluído', hoje]
    );
    // Novos clientes cadastrados hoje (ajustado para fuso America/Sao_Paulo)
    const newSignupsTodayRes = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE role = $1 
         AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date`,
      ['client']
    );
    const newSignupsToday = Number(newSignupsTodayRes.rows?.[0]?.count || 0);

    // Novos prestadores cadastrados hoje (ajustado para fuso America/Sao_Paulo)
    const newProvidersTodayRes = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE role = $1 
         AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date`,
      ['provider']
    );
    const newProvidersToday = Number(newProvidersTodayRes.rows?.[0]?.count || 0);
    // Clientes ativos no mês (fizeram login neste mês)
    const now = new Date();
    const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .split('T')[0];
    const activeThisMonthRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = $1 AND last_login_at >= $2::date`,
      ['client', firstDay]
    );
    const activeClientsThisMonth = Number(activeThisMonthRes.rows?.[0]?.count || 0);
    // Erros recentes (últimas 24h)
    const errosRecentes = await pool.query(
      `SELECT COUNT(*) FROM admin_events WHERE event_type = 'error' AND created_at >= NOW() - INTERVAL '1 day'`
    );
    // Erros críticos (últimas 24h)
    const errosCriticos = await pool.query(
      `SELECT COUNT(*) FROM admin_events WHERE event_type = 'error' AND data->>'level' = 'critical' AND created_at >= NOW() - INTERVAL '1 day'`
    );

  res.status(200).json({
      totalClientes: Number(clientes.rows[0].count),
      totalPrestadores: Number(prestadores.rows[0].count),
      servicosAtivos: Number(servicosAtivos.rows[0].count),
      servicosConcluidosHoje: Number(servicosConcluidosHoje.rows[0].count),
      fraseConcluidosHoje: `${servicosConcluidosHoje.rows[0].count} concluídos hoje`,
  newSignupsToday,
  newClientsToday: newSignupsToday,
  newProvidersToday,
  activeClientsThisMonth,
      errosRecentes: Number(errosRecentes.rows[0].count),
      errosCriticos: Number(errosCriticos.rows[0].count)
    });
  } catch (error) {
  // Log suprimido em produção
    res.status(500).json({ message: 'Erro ao buscar estatísticas do dashboard.' });
  }
};

// Limpar dados de teste/mock (usar com cuidado!)
export const cleanTestData = async (req: any, res: any) => {
  const role = (req as any).userRole;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }

  try {
    // Remover serviços sem providerEmail ou com emails de teste
    const deletedServices = await pool.query(`
      DELETE FROM service_requests 
      WHERE "clientEmail" LIKE '%test%' 
      OR "clientEmail" LIKE '%exemplo%'
      OR "clientEmail" LIKE '%demo%'
      OR id LIKE '%test%'
      OR id LIKE '%demo%'
      RETURNING id
    `);
    
    // Remover usuários de teste
    const deletedUsers = await pool.query(`
      DELETE FROM users 
      WHERE email LIKE '%test%' 
      OR email LIKE '%exemplo%'
      OR email LIKE '%demo%'
      OR name LIKE '%Test%'
      OR name LIKE '%Demo%'
      RETURNING email
    `);

    res.status(200).json({
      message: 'Dados de teste removidos',
      deletedServices: deletedServices.rowCount,
      deletedUsers: deletedUsers.rowCount,
      serviceIds: deletedServices.rows.map((r: any) => r.id),
      userEmails: deletedUsers.rows.map((r: any) => r.email)
    });
  } catch (error) {
  // Log suprimido em produção
    res.status(500).json({ message: 'Erro ao limpar dados de teste.' });
  }
};
