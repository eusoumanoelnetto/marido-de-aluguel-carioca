import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Determine SSL config: disable SSL for local connections
const isLocalDb = process.env.DATABASE_URL?.includes('localhost') ?? false;
const sslConfig = isLocalDb ? false : { rejectUnauthorized: false };
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection timeout to fail faster if host unreachable
  connectionTimeoutMillis: 5000,
  ssl: sslConfig,
});

export let isDbConnected = false;

export const initDb = async () => {
  try {
    // Test connection by getting a client from the pool
    const client = await pool.connect();
    client.release();

    // Tabela de Usuários
    await pool.query(`
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

    // Tabela de Solicitações de Serviço
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id VARCHAR(255) PRIMARY KEY,
        "clientName" VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        contact VARCHAR(50),
        category VARCHAR(100),
        description TEXT,
        "photoBase64" TEXT,
        status VARCHAR(50),
        "isEmergency" BOOLEAN,
        quote NUMERIC(10, 2),
        "requestDate" TIMESTAMPTZ
      );
    `);

    console.log('Database connected and tables checked/created successfully.');
    isDbConnected = true;
  } catch (err) {
    isDbConnected = false;
    // We re-throw the error so the calling function in index.ts can handle it.
    throw err;
  }
};

export default pool;