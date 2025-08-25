import { Request, Response } from 'express';
import pool, { isDbConnected } from '../db';
import { ServiceRequest } from '../types';

export const getServiceRequests = async (req: Request, res: Response) => {
  // Smoke test: retornar lista vazia se não há conexão com o DB em desenvolvimento
  if (!isDbConnected && process.env.NODE_ENV !== 'production') {
    return res.status(200).json([]);
  }
  try {
    const result = await pool.query('SELECT * FROM service_requests ORDER BY "requestDate" DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Erro ao buscar solicitações.' });
  }
};

export const createServiceRequest = async (req: Request, res: Response) => {
  const newRequest: ServiceRequest = req.body;
  const { id, clientName, address, contact, category, description, photoBase64, status, isEmergency, requestDate } = newRequest;

  try {
    const result = await pool.query(
      `INSERT INTO service_requests (id, "clientName", address, contact, category, description, "photoBase64", status, "isEmergency", "requestDate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, clientName, address, contact, category, description, photoBase64, status, isEmergency, requestDate]
    );
    console.log('New service request created:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ message: 'Erro ao criar solicitação.' });
  }
};

export const updateServiceRequestStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, quote } = req.body;

  try {
    const result = await pool.query(
      'UPDATE service_requests SET status = $1, quote = $2 WHERE id = $3 RETURNING *',
      [status, quote, id]
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