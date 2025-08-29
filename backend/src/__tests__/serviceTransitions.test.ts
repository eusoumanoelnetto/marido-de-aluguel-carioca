import request from 'supertest';
import { app } from '../index';
import pool, { initDb, isDbConnected } from '../db';
import jwt from 'jsonwebtoken';
import { ServiceRequest } from '../types';

// Helper para criar tokens simples (em testes podemos ignorar senha real)
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const makeToken = (email: string, role: string) =>
  jwt.sign({ email, role }, JWT_SECRET, { expiresIn: '1h' });

// In-memory: garantir DB init (se real DB indisponível, cairá no fallback)
beforeAll(async () => {
  await initDb();
});

afterAll(async () => {
  try { (pool as any).end && (pool as any).end(); } catch {}
});

const baseReq = (over: Partial<ServiceRequest>): ServiceRequest => ({
  id: over.id || 'req-1',
  clientName: over.clientName || 'Cliente Teste',
  clientEmail: over.clientEmail || 'cliente@example.com',
  address: over.address || 'Rua X',
  contact: over.contact || '9999-9999',
  category: over.category || 'Elétrica',
  description: over.description || 'Trocar tomada',
  photoBase64: over.photoBase64 || '',
  status: over.status || 'Pendente',
  isEmergency: over.isEmergency || false,
  requestDate: over.requestDate || new Date().toISOString(),
  quote: over.quote,
  providerEmail: over.providerEmail,
});

describe('Transições de status de ServiceRequest', () => {
  const clientToken = makeToken('cliente@example.com', 'client');
  const providerToken = makeToken('pro@example.com', 'provider');
  let createdId = 'req-1';

  test('Criação Pendente (cliente)', async () => {
    const payload = baseReq({});
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Pendente');
    createdId = res.body.id;
  });

  test('Prestador envia Orçamento Enviado válido', async () => {
    const res = await request(app)
      .patch(`/api/requests/${createdId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'Orçamento Enviado', quote: 150 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Orçamento Enviado');
    expect(res.body.quote).toBe('150'); // PG retorna numeric como string
    expect(res.body.providerEmail).toBe('pro@example.com');
  });

  test('Cliente aceita orçamento', async () => {
    const res = await request(app)
      .patch(`/api/requests/${createdId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'Aceito' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Aceito');
  });

  test('Outro prestador NÃO pode enviar orçamento após Aceito', async () => {
    const otherProvider = makeToken('outro@example.com', 'provider');
    const res = await request(app)
      .patch(`/api/requests/${createdId}`)
      .set('Authorization', `Bearer ${otherProvider}`)
      .send({ status: 'Orçamento Enviado', quote: 200 });
    // Deve falhar porque estado não é Pendente
    expect(res.status).toBe(400);
  });

  test('Não pode aceitar sem orçamento (novo request)', async () => {
    const secondId = 'req-2';
    const payload = baseReq({ id: secondId });
    const cRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(payload);
    expect(cRes.status).toBe(201);

    const res = await request(app)
      .patch(`/api/requests/${secondId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'Aceito' });
    expect(res.status).toBe(400);
  });

  test('Transição invertida Orçamento Enviado -> Pendente proibida', async () => {
    // Criar novo request e enviar orçamento
    const thirdId = 'req-3';
    await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(baseReq({ id: thirdId }));

    await request(app)
      .patch(`/api/requests/${thirdId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'Orçamento Enviado', quote: 100 });

    const res = await request(app)
      .patch(`/api/requests/${thirdId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'Pendente' });
    expect(res.status).toBe(400);
  });
});
