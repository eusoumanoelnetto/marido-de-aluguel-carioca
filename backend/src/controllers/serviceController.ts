import { Request, Response } from 'express';
import pool, { isDbConnected } from '../db';
import { ServiceRequest } from '../types';

export const getServiceRequests = async (req: Request, res: Response) => {
  // Smoke test: retornar lista vazia se não há conexão com o DB em desenvolvimento
  if (!isDbConnected && process.env.NODE_ENV !== 'production') {
    return res.status(200).json([]);
  }
  try {
    const userEmail = (req as any).userEmail as string | undefined;
    const userRole = (req as any).userRole as string | undefined;
    const result = await pool.query('SELECT * FROM service_requests ORDER BY "requestDate" DESC');
    let rows = result.rows as ServiceRequest[];

    if (userRole === 'provider') {
      // Prestador vê: pendentes + os que ele já enviou orçamento (providerEmail=seu) + os que foram aceitos por ele
      rows = rows.filter(r => r.status === 'Pendente' || r.providerEmail === userEmail);
    } else if (userRole === 'client') {
      // Cliente vê somente seus pedidos
      rows = rows.filter(r => r.clientEmail === userEmail);
    }
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Erro ao buscar solicitações.' });
  }
};

export const createServiceRequest = async (req: Request, res: Response) => {
  const newRequest: ServiceRequest = req.body;
  const { id, clientName, clientEmail, address, contact, category, description, photoBase64, status, isEmergency, requestDate } = newRequest;

  try {
    const result = await pool.query(
      `INSERT INTO service_requests (id, "clientName", "clientEmail", address, contact, category, description, "photoBase64", status, "isEmergency", "requestDate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, clientName, clientEmail, address, contact, category, description, photoBase64, status, isEmergency, requestDate]
    );
    console.log('New service request created:', result.rows[0].id);

    // Log event for admin notifications
    try {
      await pool.query(
        'INSERT INTO admin_events (event_type, data, created_at) VALUES ($1, $2, NOW())',
        ['service_request', JSON.stringify({ 
          id, 
          clientName, 
          clientEmail,
          category, 
          address: address.substring(0, 50) + '...', // Truncar endereço para privacidade
          isEmergency,
          status
        })]
      );
    } catch (eventError) {
      console.log('Could not log service request event:', eventError.message);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Erro ao criar solicitação.' });
  }
};

export const updateServiceRequestStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, quote, providerEmail } = req.body;
  const userEmail = (req as any).userEmail as string | undefined;
  const userRole = (req as any).userRole as string | undefined;

  try {
    // Buscar registro atual para regras
    const current = await pool.query('SELECT * FROM service_requests WHERE id = $1', [id]);
    if (current.rowCount === 0) {
      return res.status(404).json({ message: 'Solicitação não encontrada.' });
    }
    const existing: ServiceRequest = current.rows[0];

    // Regras de transição
    // Prestador pode: Pendente -> Orçamento Enviado (definindo quote e providerEmail=seu)
    // Cliente pode: Orçamento Enviado (onde providerEmail definido) -> Aceito
    // Qualquer outro fluxo rejeitar (simplificação)
    if (status === 'Orçamento Enviado') {
      if (userRole !== 'provider') return res.status(403).json({ message: 'Apenas prestadores podem enviar orçamento.' });
      if (existing.status !== 'Pendente') return res.status(400).json({ message: 'Só é possível enviar orçamento para solicitações pendentes.' });
      if (!quote || quote <= 0) return res.status(400).json({ message: 'Informe um orçamento válido.' });
    } else if (status === 'Aceito') {
      if (userRole !== 'client') return res.status(403).json({ message: 'Apenas o cliente pode aceitar o orçamento.' });
      if (existing.status !== 'Orçamento Enviado') return res.status(400).json({ message: 'Só é possível aceitar um orçamento que foi enviado.' });
      if (!existing.quote) return res.status(400).json({ message: 'Não há orçamento para aceitar.' });
    } else if (status === 'Recusado') {
      // Prestador recusa (ex: não pode atender) ou cliente recusa (não implementado detalhadamente)
      // Permitimos recusar se estava Pendente ou Orçamento Enviado (cliente) ou Pendente (prestador)
      if (!(existing.status === 'Pendente' || existing.status === 'Orçamento Enviado')) {
        return res.status(400).json({ message: 'Não é possível recusar neste estado.' });
      }
    } else if (status === 'Finalizado') {
      // Poderíamos exigir que seja prestador dono e que esteja Aceito antes; simplificado:
      if (existing.status !== 'Aceito') return res.status(400).json({ message: 'Só é possível finalizar um serviço aceito.' });
    } else if (status === 'Cancelado') {
      // Cancelamento permitido somente pelo cliente dono enquanto ainda não aceito
      if (userRole !== 'client') return res.status(403).json({ message: 'Apenas o cliente pode cancelar a solicitação.' });
      if (existing.clientEmail !== userEmail) return res.status(403).json({ message: 'Você não pode cancelar esta solicitação.' });
      if (!(existing.status === 'Pendente' || existing.status === 'Orçamento Enviado')) {
        return res.status(400).json({ message: 'Não é possível cancelar após o serviço ter sido aceito ou finalizado.' });
      }
    } else if (status === 'Pendente') {
      return res.status(400).json({ message: 'Transição para Pendente não permitida.' });
    }

    const nextProviderEmail = status === 'Orçamento Enviado' ? userEmail : existing.providerEmail;
    const nextQuote = status === 'Orçamento Enviado' ? quote : existing.quote;

    const result = await pool.query(
      'UPDATE service_requests SET status = $1, quote = $2, "providerEmail" = $3 WHERE id = $4 RETURNING *',
      [status, nextQuote, nextProviderEmail, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Solicitação não encontrada.' });
      return;
    }
    
  console.log(`Service request ${id} updated to status: ${status}`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Erro ao atualizar solicitação.' });
  }
};