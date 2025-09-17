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
const memMessages: any[] = [];

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

  // select specific columns from users (used by admin listUsers)
  if (/SELECT\s+name\s*,\s*email\s*,/i.test(q) && /FROM\s+users/i.test(q)) {
    // project only the requested fields to mimic real DB response
    const rows = memUsers.map(u => ({
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      cep: u.cep,
      profilePictureBase64: u.profilePictureBase64,
      services: u.services
    }));
    return makeResult(rows);
  }

  // select count users by role (and optional date filters)
  if (/SELECT\s+COUNT\(\*\)\s+FROM\s+users/i.test(q)) {
    // Base filter by role
    let rows = memUsers.slice();
    const roleParamIdx = (q.match(/role\s*=\s*\$1/) ? 0 : q.match(/role\s*=\s*\$2/) ? 1 : null);
    if (roleParamIdx !== null) {
      const role = (params && params[roleParamIdx]) as string;
      rows = rows.filter(u => u.role === role);
    }
    // created_at::date = $n (new signups today)
    if (/created_at\s*::date\s*=\s*\$\d+/i.test(q)) {
      const idx = Number((q.match(/\$(\d+)/) || [])[1]) - 1;
      const dateStr = (params && params[idx]) as string; // 'YYYY-MM-DD'
      rows = rows.filter(u => (u.created_at || '').startsWith(dateStr));
    }
    // last_login_at >= $n::date (active this month)
    if (/last_login_at\s*>?=\s*\$\d+/i.test(q)) {
      const idx = Number((q.match(/\$(\d+)/) || [])[1]) - 1;
      const fromIso = (params && params[idx]) as string;
      const fromTs = new Date(fromIso).getTime();
      rows = rows.filter(u => u.last_login_at && new Date(u.last_login_at).getTime() >= fromTs);
    }
    return makeResult([ { count: String(rows.length) } ]);
  }

  // insert user
  if (/INSERT\s+INTO\s+users/i.test(q)) {
    // expect params in order: name, email, phone, role, cep, password, services
    const [name, email, phone, role, cep, password, services] = params || [];
    const newUser = { 
      name, 
      email: email?.toLowerCase(), 
      phone, 
      role, 
      cep, 
      password, 
      services,
      created_at: new Date().toISOString(),
      last_login_at: null
    };
    memUsers.push(newUser);
    return makeResult([ { ...newUser } ]);
  }

  // update user
  if (/UPDATE\s+users\s+SET/i.test(q) && /WHERE\s+email/i.test(q)) {
    // branch for last_login_at update
    if (/last_login_at\s*=\s*NOW\(\)/i.test(q)) {
      const email = (params && params[0])?.toLowerCase();
      const idx = memUsers.findIndex(u => u.email === email);
      if (idx === -1) return makeResult([]);
      memUsers[idx] = { ...memUsers[idx], last_login_at: new Date().toISOString() };
      return makeResult([ { ...memUsers[idx] } ]);
    }
    // general profile update: params: name, phone, cep, services, profilePictureBase64, email
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

  // messages: select by service id or by participants
  if (/SELECT\s+\*\s+FROM\s+messages/i.test(q)) {
    // select by serviceId
    if (/WHERE\s+"serviceId"\s*=\s*\$1/i.test(q)) {
      const serviceId = params && params[0];
      const rows = memMessages.filter(m => m.serviceId === serviceId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return makeResult(rows);
    }
    // select messages between two participants (by service and participant email)
    return makeResult(memMessages.slice().sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }

  // insert message
  if (/INSERT\s+INTO\s+messages/i.test(q)) {
    // params: id, serviceId, senderEmail, recipientEmail, content, createdAt
    const [id, serviceId, senderEmail, recipientEmail, content, createdAt] = params || [];
    const newMsg = { id, serviceId, senderEmail, recipientEmail, content, createdAt };
    memMessages.push(newMsg);
    return makeResult([ { ...newMsg } ]);
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
  // Em ambiente de teste (Jest) ou quando explicitamente solicitado, não tenta conectar no Postgres.
  if (process.env.JEST_WORKER_ID !== undefined || process.env.SKIP_DB === '1') {
    isDbConnected = false;
    if (!process.env.SILENT_TESTS) {
      console.log('Test mode: pulando conexão real com Postgres e usando armazenamento em memória.');
    }
    return;
  }
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
  services TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
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

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS admin_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100),
        data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        "serviceId" VARCHAR(255),
        "senderEmail" VARCHAR(255),
        "recipientEmail" VARCHAR(255),
        content TEXT,
        "createdAt" TIMESTAMPTZ
      );
    `);

  // Garantir colunas novas em bases já existentes
  await pgPool.query('ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS "clientEmail" VARCHAR(255)');
  await pgPool.query('ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS "providerEmail" VARCHAR(255)');
  await pgPool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "serviceId" VARCHAR(255)');
  await pgPool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "senderEmail" VARCHAR(255)');
  await pgPool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "recipientEmail" VARCHAR(255)');
  await pgPool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT');
  await pgPool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ');
  await pgPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');
  await pgPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ');

    console.log('Database connected and tables checked/created successfully.');
    isDbConnected = true;
  } catch (err: any) {
    isDbConnected = false;
    console.warn('Could not connect to Postgres, falling back to in-memory stores. Error:', err?.message || err);
    // Do not re-throw: allow server to start and use fallback for development/testing.
  }
};

// Ajustar o tipo de erro para garantir tratamento correto
export const checkDbStatus = async () => {
  try {
    const client = await pgPool.connect();
    const result = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tabelas disponíveis:', result.rows.map(row => row.table_name));
    client.release();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Erro ao verificar tabelas do banco:', errorMessage);
  }
};

// Chamar a função ao inicializar o banco
initDb().then(() => checkDbStatus());

export default dbClient;