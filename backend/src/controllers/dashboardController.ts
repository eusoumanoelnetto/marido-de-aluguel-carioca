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
    // Query modificada para ser mais precisa e garantir que estamos filtrando pelo dia atual
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Primeiro buscar todos os prestadores cadastrados hoje para diagnóstico
    const providersToday = await pool.query(
      `SELECT email, name, created_at, 
              (created_at AT TIME ZONE 'America/Sao_Paulo')::date as created_date,
              (NOW() AT TIME ZONE 'America/Sao_Paulo')::date as today_date
       FROM users 
       WHERE role = $1 
         AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
       ORDER BY created_at DESC`,
      ['provider']
    );
    
    // Verificar dados para diagnosticar o problema
    console.log(`[DEBUG] Prestadores cadastrados hoje (${todayStr}):`, 
                providersToday.rows.length, 
                providersToday.rows.map(r => ({ 
                  email: r.email, 
                  created: r.created_at, 
                  created_date: r.created_date,
                  today: r.today_date 
                })));
    
    // Manter contagem original mas com logging extra
    const newProvidersTodayRes = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE role = $1 
         AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date`,
      ['provider']
    );
    const newProvidersToday = Number(newProvidersTodayRes.rows?.[0]?.count || 0);
    
    // Log extra para diagnóstico
    console.log(`[INFO] Contagem de prestadores novos hoje: ${newProvidersToday}`);
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
    // Prestadores ativos no mês (fizeram login neste mês)
    const activeProvidersRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = $1 AND last_login_at >= $2::date`,
      ['provider', firstDay]
    );
    const activeProvidersThisMonth = Number(activeProvidersRes.rows?.[0]?.count || 0);
    // Erros recentes (últimas 24h)
    const errosRecentes = await pool.query(
      `SELECT COUNT(*) FROM admin_events WHERE event_type = 'error' AND created_at >= NOW() - INTERVAL '1 day'`
    );
    // Erros críticos (últimas 24h)
    const errosCriticos = await pool.query(
      `SELECT COUNT(*) FROM admin_events WHERE event_type = 'error' AND data->>'level' = 'critical' AND created_at >= NOW() - INTERVAL '1 day'`
    );

  // Se os logs de debug mostraram mais de um prestador hoje,
  // vamos validar se realmente são prestadores criados hoje
  // ou se há algum erro de timestamp/timezone
  let verificadoProvidersToday = newProvidersToday;
  
  if (newProvidersToday > 1) {
    // Verifica manualmente a data
    const providerList = providersToday.rows || [];
    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    
    // Filtra apenas os que REALMENTE foram criados hoje, com verificação manual de data
    const reallyCreatedToday = providerList.filter(p => {
      const createdDate = new Date(p.created_at);
      const createdDateOnly = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate()
      ).getTime();
      
      return createdDateOnly === todayDateOnly;
    });
    
    // Usa o valor verificado manualmente
    verificadoProvidersToday = reallyCreatedToday.length;
    console.log(`[CORREÇÃO] Prestadores hoje ajustado: ${newProvidersToday} -> ${verificadoProvidersToday}`);
  }

  res.status(200).json({
      totalClientes: Number(clientes.rows[0].count),
      totalPrestadores: Number(prestadores.rows[0].count),
      servicosAtivos: Number(servicosAtivos.rows[0].count),
      servicosConcluidosHoje: Number(servicosConcluidosHoje.rows[0].count),
      fraseConcluidosHoje: `${servicosConcluidosHoje.rows[0].count} concluídos hoje`,
      newSignupsToday,
      newClientsToday: newSignupsToday,
      // Usar o valor verificado ao invés do original
      newProvidersToday: verificadoProvidersToday, 
      activeClientsThisMonth,
      activeProvidersThisMonth,
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
    
    // Verificar possíveis duplicatas por email (caso tenha mais de um registro com mesmo email)
    const duplicateCheck = await pool.query(`
      SELECT email, COUNT(*) 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length > 0) {
      console.log("[ALERTA] Emails duplicados encontrados:", 
                  duplicateCheck.rows.map(r => `${r.email} (${r.count}x)`));
      
      // Remover duplicatas mantendo apenas o registro mais recente
      for (const dup of duplicateCheck.rows) {
        await pool.query(`
          DELETE FROM users 
          WHERE email = $1 
          AND created_at < (
            SELECT MAX(created_at) FROM users WHERE email = $1
          )
        `, [dup.email]);
      }
    }
    
    // Remover usuários de teste - com critérios adicionais para cobrir mais casos
    const deletedUsers = await pool.query(`
      DELETE FROM users 
      WHERE email LIKE '%test%' 
      OR email LIKE '%exemplo%'
      OR email LIKE '%demo%'
      OR email LIKE '%temp%'
      OR email LIKE '%dummy%'
      OR name LIKE '%Test%'
      OR name LIKE '%Demo%'
      OR name LIKE '%Temp%'
      OR name LIKE '%Dummy%'
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
