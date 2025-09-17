import { Request, Response } from 'express';
import pool, { isDbConnected } from '../db';
import { ServiceRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

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
  const body = req.body as Partial<ServiceRequest> & { title?: string; location?: string };
  // Ensure we have an id and minimal fields even if the client sent a lightweight payload
  const id = (body as any).id || uuidv4();
  const userEmail = (req as any).userEmail as string | undefined;
  const clientName = body.clientName || (body as any).name || userEmail || 'Cliente';
  const clientEmail = body.clientEmail || userEmail || null;
  const address = body.address || body.location || '';
  const contact = body.contact || '';
  const category = body.category || body.title || null;
  const description = body.description || '';
  const photoBase64 = body.photoBase64 || null;
  const status = body.status || 'Pendente';
  const isEmergency = !!body.isEmergency;
  const requestDate = body.requestDate || new Date().toISOString();

  try {
    const result = await pool.query(
      `INSERT INTO service_requests (id, "clientName", "clientEmail", address, contact, category, description, "photoBase64", status, "isEmergency", "requestDate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, clientName, clientEmail, address, contact, category, description, photoBase64, status, isEmergency, requestDate]
    );
    console.log('DEBUG: createServiceRequest - result.rows[0]:', result.rows[0], 'id param:', id);

    // Log event for admin notifications
    try {
      console.log('📝 Tentando registrar evento de solicitação de serviço...');
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
      console.log('✅ Evento de solicitação registrado com sucesso');
    } catch (eventError: any) {
      console.log('❌ Erro ao registrar evento de solicitação:', eventError.message);
    }

  // Normalize response: ensure id and clientEmail present even if adapter returned partial object
  const respObj = { ...(result.rows[0] || {}), id, clientEmail };
  res.status(201).json(respObj);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Erro ao criar solicitação.' });
  }
};

export const updateServiceRequestStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, quote, providerEmail } = req.body;
  const { initialMessage } = req.body as { initialMessage?: string };
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

    // Debug: log the params we will send to the DB to diagnose missing providerEmail/quote
    console.log('DEBUG: updateServiceRequestStatus - updating request', id, 'with params:', { status, nextQuote, nextProviderEmail });
    const result = await pool.query(
      'UPDATE service_requests SET status = $1, quote = $2, "providerEmail" = $3 WHERE id = $4 RETURNING *',
      [status, nextQuote, nextProviderEmail, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Solicitação não encontrada.' });
      return;
    }

    // Re-query the updated row to ensure we have the canonical values (avoids mismatches in some adapters)
    let updatedRow;
    try {
      const q = await pool.query('SELECT * FROM service_requests WHERE id = $1', [id]);
      updatedRow = q.rows[0];
    } catch (e) {
      console.warn('Aviso: falha ao reconsultar service_requests após UPDATE para id', id, e);
      updatedRow = result.rows[0];
    }

    // If client accepted the quote and sent an initialMessage, persist it to messages
    if (status === 'Aceito' && initialMessage && initialMessage.trim().length > 0) {
      try {
        const msgId = uuidv4();
        const createdAt = new Date().toISOString();
        const provider = updatedRow?.providerEmail;
        if (!provider) {
          console.warn('Aviso: providerEmail ausente ao tentar inserir mensagem inicial para request', id);
        } else {
          await pool.query('INSERT INTO messages (id, "serviceId", "senderEmail", "recipientEmail", content, "createdAt") VALUES ($1,$2,$3,$4,$5,$6)', [msgId, id, userEmail, provider, initialMessage, createdAt]);
        }
      } catch (err) {
        console.error('Erro ao inserir mensagem inicial para request', id, 'providerEmail:', updatedRow?.providerEmail, 'error:', err);
      }
    }

    console.log(`Service request ${id} updated to status: ${status}`);
    res.status(200).json(updatedRow || result.rows[0]);
  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({ message: 'Erro ao atualizar solicitação.' });
  }
};