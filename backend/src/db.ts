import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Determine SSL config: disable SSL for local connections
const isLocalDb = process.env.DATABASE_URL?.includes('localhost') ?? false;
const sslConfig = isLocalDb ? false : { rejectUnauthorized: false };

// Underlying PG pool (may fail to connect in some environments)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection timeout to fail faster if host unreachable
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
});

// Exported flag to indicate whether real DB is available
export let isDbConnected = false;

// In-memory fallback stores (used when DB is not reachable)
const memUsers: any[] = [];
const memServiceRequests: any[] = [];

// Helper to shape a query result similar to `pg`
const makeResult = (rows: any[]) => ({ rowCount: rows.length, rows });

// Very small query router for the specific queries used by the app.
// It intentionally handles only the patterns used in controllers.
const inMemoryQuery = async (text: string, params?: any[]) => {
  const q = text.trim();

  // users: check existence
  if (/SELECT\s+1\s+FROM\s+users\s+WHERE\s+email/i.test(q)) {
    const email = (params && params[0])?.toLowerCase();
    const found = memUsers.find(u => u.email === email);
    return makeResult(found ? [ { exists: 1 } ] : []);
  }

  // select user by email
  if (/SELECT\s+\*\s+FROM\s+users\s+WHERE\s+email/i.test(q)) {
    const email = (params && params[0])?.toLowerCase();
    const user = memUsers.find(u => u.email === email);
    return makeResult(user ? [ { ...user } ] : []);
  }

  // insert user
  if (/INSERT\s+INTO\s+users/i.test(q)) {
    // expect params in order: name, email, phone, role, cep, password, services
    const [name, email, phone, role, cep, password, services] = params || [];
    const newUser = { name, email: email?.toLowerCase(), phone, role, cep, password, services };
    memUsers.push(newUser);
    return makeResult([ { ...newUser } ]);
  }

  // update user
  if (/UPDATE\s+users\s+SET/i.test(q) && /WHERE\s+email/i.test(q)) {
    // params: name, phone, cep, services, profilePictureBase64, email
    const [name, phone, cep, services, profilePictureBase64, email] = params || [];
    const idx = memUsers.findIndex(u => u.email === (email || '').toLowerCase());
    if (idx === -1) return makeResult([]);
    const updated = { ...memUsers[idx], name, phone, cep, services, profilePictureBase64 };
    memUsers[idx] = updated;
    return makeResult([ { ...updated } ]);
  }

  // service requests: select all
  if (/SELECT\s+\*\s+FROM\s+service_requests/i.test(q)) {
    // select by id (mais específico) antes do select all genérico
    if (/WHERE\s+id\s*=\s*\$1/i.test(q)) {
      const id = params && params[0];
      const found = memServiceRequests.find(r => r.id === id);
      return makeResult(found ? [ { ...found } ] : []);
    }
    // order by requestDate desc
    const rows = memServiceRequests.slice().sort((a, b) => {
      const da = new Date(a.requestDate).getTime() || 0;
      const db_ = new Date(b.requestDate).getTime() || 0;
      return db_ - da;
    });
    return makeResult(rows);
  }

  // insert service request
  if (/INSERT\s+INTO\s+service_requests/i.test(q)) {
    // params: id, clientName, clientEmail, address, contact, category, description, photoBase64, status, isEmergency, requestDate
    const [id, clientName, clientEmail, address, contact, category, description, photoBase64, status, isEmergency, requestDate] = params || [];
    const newReq = { id, clientName, clientEmail, address, contact, category, description, photoBase64, status, isEmergency, requestDate };
    memServiceRequests.push(newReq);
    return makeResult([ { ...newReq } ]);
  }

  // update service request status
  if (/UPDATE\s+service_requests\s+SET\s+status\s*=\s*\$1/i.test(q) || /WHERE\s+id\s*=\s*\$4/i.test(q)) {
    // params (new signature): status, quote, providerEmail, id
    const [status, quote, providerEmail, id] = params || [];
    const idx = memServiceRequests.findIndex(r => r.id === id);
    if (idx === -1) return makeResult([]);
    memServiceRequests[idx] = { ...memServiceRequests[idx], status, quote, providerEmail: providerEmail ?? memServiceRequests[idx].providerEmail };
    return makeResult([ { ...memServiceRequests[idx] } ]);
  }

  // Default: no-op
  console.warn('In-memory DB: unrecognized query, returning empty:', q.substring(0, 120));
  return makeResult([]);
};

// The exported db client used by controllers. It always exposes a `query` method.
const dbClient = {
  query: async (text: string, params?: any[]) => {
    if (isDbConnected) {
      return pgPool.query(text, params);
    }
    return inMemoryQuery(text, params);
  }
};

export const initDb = async () => {
  try {
    // Test connection by getting a client from the pool
    const client = await pgPool.connect();
    client.release();

    // Ensure tables exist when real DB is available
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) PRIMARY KEY,
        phone VARCHAR(50),
        role VARCHAR(50) NOT NULL,
        cep VARCHAR(20),
        password VARCHAR(255),
        "profilePictureBase64" TEXT,
        services TEXT[]
      );
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id VARCHAR(255) PRIMARY KEY,
        "clientName" VARCHAR(255) NOT NULL,
        "clientEmail" VARCHAR(255),
        address TEXT NOT NULL,
        contact VARCHAR(50),
        category VARCHAR(100),
        description TEXT,
        "photoBase64" TEXT,
        status VARCHAR(50),
        "isEmergency" BOOLEAN,
        quote NUMERIC(10, 2),
        "providerEmail" VARCHAR(255),
        "requestDate" TIMESTAMPTZ
      );
    `);

  // Garantir colunas novas em bases já existentes
  await pgPool.query('ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS "clientEmail" VARCHAR(255)');
  await pgPool.query('ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS "providerEmail" VARCHAR(255)');

    console.log('Database connected and tables checked/created successfully.');
    isDbConnected = true;
  } catch (err: any) {
    isDbConnected = false;
    console.warn('Could not connect to Postgres, falling back to in-memory stores. Error:', err?.message || err);
    // Do not re-throw: allow server to start and use fallback for development/testing.
  }
};

export default dbClient;