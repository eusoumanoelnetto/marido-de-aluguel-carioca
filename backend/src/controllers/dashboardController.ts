import { Request, Response } from 'express';
import pool from '../db';

// Retorna estatísticas para o dashboard admin
export const getDashboardStats = async (req: Request, res: Response) => {
  const role = (req as any).userRole;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }

  try {
    // Total de clientes
    const clientes = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['client']);
    // Total de prestadores
    const prestadores = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['provider']);
    // Serviços ativos (status != "Concluído")
    const servicosAtivos = await pool.query('SELECT COUNT(*) FROM service_requests WHERE status != $1', ['Concluído']);
    // Serviços concluídos hoje
    const hoje = new Date().toISOString().split('T')[0];
    const servicosConcluidosHoje = await pool.query(
      `SELECT COUNT(*) FROM service_requests WHERE status = $1 AND "requestDate"::date = $2`,
      ['Concluído', hoje]
    );
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
      errosRecentes: Number(errosRecentes.rows[0].count),
      errosCriticos: Number(errosCriticos.rows[0].count)
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas do dashboard.' });
  }
};
